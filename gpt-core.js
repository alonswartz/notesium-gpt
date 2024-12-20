var t = `
<div class="h-full flex flex-col">
  <main class="grow overflow-y-scroll" ref="mainContainer">
    <div class="sticky top-0 z-10 bg-white/50 backdrop-blur border-b border-gray-100 h-12 w-full flex items-center justify-between px-4">
      <div>Notesium GPT</div>
      <div :class="live ? 'text-green-700' : 'text-indigo-700'" v-text="live ? 'openai' : 'mockai'" @click="live=!live; messages=[]" ></div>
    </div>
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMessages :messages=messages :assistantWaiting=assistantWaiting :warning=warning />
      <GPTPending v-if="pending.length" :pending=pending @pending-approve="approvePending" @pending-decline="declinePending" />
    </div>
  </main>
  <div class="pr-[10px]">
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMsgBox @message-send="sendMessage" :assistantWaiting=assistantWaiting />
    </div>
  </div>
</div>
`

import GPTMsgBox from './gpt-msgbox.js'
import GPTPending from './gpt-pending.js'
import GPTMessages from './gpt-messages.js'
import { mockai } from './gpt-mockai.js'
import { openai } from './gpt-openai.js'
import { OPENAI_API_KEY } from './secrets.js'
import { getSystemMsg, toolSpecs, runTool } from './gpt-tools.js'
export default {
  components: { GPTMsgBox, GPTPending, GPTMessages },
  data() {
    return {
      live: false,
      pending: [],
      messages: [],
      assistantWaiting: false,
      warning: null,
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
    },
    scrollMainContainer() {
      this.$nextTick(() => {
        const container = this.$refs.mainContainer;
        container.scrollTo({top: container.scrollHeight, behavior: "smooth"});
      });
    },
  },
  template: t
}

