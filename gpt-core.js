var t = `
<div class="h-full flex flex-col">
  <main class="grow overflow-y-scroll" ref="mainContainer">
    <div class="sticky top-0 z-10 bg-white/50 backdrop-blur border-b border-gray-100 h-12 w-full flex items-center justify-between px-4">
      <div @click="live=!live; resetState()" v-text="live ? 'Notesium GPT' : 'Notesium GPT (MockAI)'"></div>
      <div class="flex space-x-4 items-center justify-items-center">
        <span v-show="settings.showCost.value" class="text-xs text-gray-400" v-text="'$' + tokenCounts.cost.toFixed(6)"
          :title="'tokens - prompt:' + tokenCounts.prompt + ' cached:' + tokenCounts.prompt_cached + ' completion:' + tokenCounts.completion" />
        <span title="clear" @click="resetState()" class="cursor-pointer text-gray-400 hover:text-gray-600 -mt-px">
          <Icon name="outline-arrow-path" size="h-4 w-4" />
        </span>
        <GPTSettings :settings=settings />
      </div>
    </div>
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMessages :messages=messages :assistantWaiting=assistantWaiting :warning=warning @note-open="(...args) => $emit('note-open', ...args)" />
      <GPTPending v-if="pending.length && !settings.autoApprove.value" :pending=pending @pending-approve="approvePending" @pending-decline="declinePending" />
      <GPTEmpty v-if="!messages.length" @message-send="sendMessage" :live=live />
    </div>
  </main>
  <div class="pr-[10px]">
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMsgBox @message-send="sendMessage" :assistantWaiting=assistantWaiting />
    </div>
  </div>
</div>
`

import Icon from './gpt-icon.js'
import GPTEmpty from './gpt-empty.js'
import GPTMsgBox from './gpt-msgbox.js'
import GPTPending from './gpt-pending.js'
import GPTMessages from './gpt-messages.js'
import GPTSettings from './gpt-settings.js'
import { mockai } from './gpt-mockai.js'
import { openai } from './gpt-openai.js'
import { OPENAI_API_KEY } from './secrets.js'
import { getSystemMsg, toolSpecs, runTool } from './gpt-tools.js'
export default {
  components: { Icon, GPTEmpty, GPTMsgBox, GPTPending, GPTMessages, GPTSettings },
  emits: ['note-open'],
  data() {
    return {
      live: false,
      pending: [],
      messages: [],
      assistantWaiting: false,
      warning: null,
      tokenCounts: { prompt: 0, prompt_cached: 0, completion: 0, cost: 0 },
      settings: {
        showCost:    { type: 'bool', value: true, title: 'show estimated cost' },
        autoApprove: { type: 'bool', value: false, title: 'auto approve context requests' },
        temperature: { type: 'range', value: 0.7, min: 0,   max: 2,     step: 0.1, title: 'temperature'},
        maxTokens:   { type: 'range', value: 100, min: 100, max: 16000, step: 100, title: 'max output tokens'},
        model:       { type: 'string', value: 'gpt-4o-mini', title: 'model' },
      },
    }
  },
  methods: {
    resetState() {
      this.pending = [];
      this.messages = [];
      this.assistantWaiting = false;
      this.warning = null;
      this.tokenCounts = { prompt: 0, prompt_cached: 0, completion: 0, cost: 0 };
    },
    declinePending() {
      this.pending = [];
    },
    approvePending(enableAutoApprove) {
      if (enableAutoApprove) this.settings.autoApprove.value = true;
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
        model: this.settings.model.value,
        max_tokens: parseInt(this.settings.maxTokens.value, 10),
        temperature: parseFloat(this.settings.temperature.value),
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
        if (this.settings.autoApprove.value && this.inToolCallsLoop()) {
          this.settings.autoApprove.value = false;
          this.warning = 'Possible loop detected, autoApprove disabled';
        }
        if (this.settings.autoApprove.value) this.approvePending();
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
    inToolCallsLoop() {
      const loopThreshold = 3;
      let toolCallCount = 0;
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const message = this.messages[i];
        if (message.role === "user") return false;
        if (message.role === "assistant" && message.tool_calls) {
          toolCallCount++;
          if (toolCallCount >= loopThreshold) return true;
        }
      }
      return false;
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

