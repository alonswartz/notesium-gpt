var t = `
<div class="h-full flex flex-col">
  <main class="grow overflow-y-scroll" ref="mainContainer">
    <div class="sticky top-0 z-10 bg-white/50 backdrop-blur border-b border-gray-100 h-12 w-full flex items-center justify-between px-4">
      <div>Notesium GPT</div>
      <div class="flex space-x-2 items-center">
        <span :class="live ? 'text-green-700' : 'text-indigo-700'" v-text="live ? 'openai' : 'mockai'"
          @click="live=!live; messages=[]; resetTokenCounts()" />
        <span v-if="live" class="text-xs text-gray-400 pt-1" v-text="'$' + tokenCounts.cost.toFixed(6)"
          :title="'tokens - prompt:' + tokenCounts.prompt + ' cached:' + tokenCounts.prompt_cached + ' completion:' + tokenCounts.completion" />
      </div>

    </div>
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMessages :messages=messages :assistantWaiting=assistantWaiting :warning=warning @note-open="(...args) => $emit('note-open', ...args)" />
      <GPTPending v-if="pending.length" :pending=pending @pending-approve="approvePending" @pending-decline="declinePending" />
      <GPTEmpty v-if="!messages.length" @message-send="sendMessage" />
    </div>
  </main>
  <div class="pr-[10px]">
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMsgBox @message-send="sendMessage" :assistantWaiting=assistantWaiting />
    </div>
  </div>
</div>
`

import GPTEmpty from './gpt-empty.js'
import GPTMsgBox from './gpt-msgbox.js'
import GPTPending from './gpt-pending.js'
import GPTMessages from './gpt-messages.js'
import { mockai } from './gpt-mockai.js'
import { openai } from './gpt-openai.js'
import { OPENAI_API_KEY } from './secrets.js'
import { getSystemMsg, toolSpecs, runTool } from './gpt-tools.js'
export default {
  components: { GPTEmpty, GPTMsgBox, GPTPending, GPTMessages },
  emits: ['note-open'],
  data() {
    return {
      live: false,
      pending: [],
      messages: [],
      assistantWaiting: false,
      warning: null,
      tokenCounts: { prompt: 0, prompt_cached: 0, completion: 0, cost: 0 },
    }
  },
  methods: {
    declinePending() {
      this.pending = [];
    },
    approvePending() {
      this.messages.push(...this.pending);
      this.pending = [];
      this.sendMessages();
    },
    sendMessage(messageText) {
      this.messages.push({role: 'user', content: messageText});
      this.sendMessages();
    },
    async sendMessages() {
      this.warning = null;
      this.assistantWaiting = true;
      this.scrollMainContainer();

      const client = this.live
        ? new openai({ apiKey: OPENAI_API_KEY })
        : new mockai({ apiKey: 'apikey' });

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        temperature: 0.7,
        messages: [getSystemMsg(), ...this.messages],
        tools: toolSpecs,
      });

      this.assistantWaiting = false;

      const finishReason = response.choices[0]?.finish_reason;
      const toolCalls = response.choices[0]?.message?.tool_calls;
      if (finishReason == "tool_calls") {
        this.pending.push(response.choices[0].message);
        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          const toolResult = await runTool(toolName, toolArgs);
          this.pending.push({role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });
        }
      } else if (finishReason == "length" && toolCalls) {
        this.warning = 'The assistant responded with tool_calls, but max_tokens was reached.\n\n' + JSON.stringify(toolCalls);
      } else {
        this.messages.push({role: "assistant", content: response.choices[0].message.content});
        if (finishReason == "length") this.warning = 'Response truncated, max_tokens reached.';
      }

      this.scrollMainContainer();
      this.updateTokenCounts(response.usage);
    },
    scrollMainContainer() {
      this.$nextTick(() => {
        const container = this.$refs.mainContainer;
        container.scrollTo({top: container.scrollHeight, behavior: "smooth"});
      });
    },
    resetTokenCounts() {
      this.tokenCounts = { prompt: 0, prompt_cached: 0, completion: 0, cost: 0 }
    },
    updateTokenCounts(usage) {
      if (!usage) return;

      this.tokenCounts.prompt += usage.prompt_tokens || 0;
      this.tokenCounts.prompt_cached += (usage.prompt_tokens_details?.cached_tokens || 0);
      this.tokenCounts.completion += usage.completion_tokens || 0;

      // gpt-4o-mini-2024-07-18 - https://openai.com/api/pricing/
      const costPer1k = { cached: 0.000075, uncached: 0.000150, completion: 0.000600 };
      const cachedCost = (this.tokenCounts.prompt_cached / 1000) * costPer1k.cached;
      const uncachedCost = ((this.tokenCounts.prompt - this.tokenCounts.prompt_cached) / 1000) * costPer1k.uncached;
      const completionCost = (this.tokenCounts.completion / 1000) * costPer1k.completion;
      this.tokenCounts.cost = cachedCost + uncachedCost + completionCost;
    },
  },
  template: t
}

