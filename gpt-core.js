var t = `
<div class="h-full flex flex-col">
  <main class="grow overflow-y-scroll" ref="mainContainer">
    <div class="sticky top-0 z-10 bg-white/50 backdrop-blur border-b border-gray-100 h-12 w-full flex items-center justify-between px-4">
      <div>Notesium GPT</div>
      <div :class="live ? 'text-green-700' : 'text-indigo-700'" v-text="live ? 'openai' : 'mockai'" @click="live=!live; messages=[]" ></div>
    </div>
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMessages :messages=messages :assistantWaiting=assistantWaiting
       :messagesPending=messagesPending @pending-approve="approveMessagesPending" @pending-decline="declineMessagesPending" />
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
import GPTMessages from './gpt-messages.js'
import { mockai } from './gpt-mockai.js'
import { openai } from './gpt-openai.js'
import { OPENAI_API_KEY } from './secrets.js'
export default {
  components: { GPTMsgBox, GPTMessages },
  data() {
    return {
      live: false,
      messages: [],
      messagesPending: [],
      assistantWaiting: false,
    }
  },
  methods: {
    declineMessagesPending() {
      this.messagesPending = [];
    },
    approveMessagesPending() {
      this.messages.push(...this.messagesPending);
      this.messagesPending = [];
      this.sendMessages();
    },
    sendMessage(messageText) {
      this.messages.push({role: 'user', content: messageText});
      this.sendMessages();
    },
    async sendMessages() {
      this.assistantWaiting = true;
      this.scrollMainContainer();

      const client = this.live
        ? new openai({ apiKey: OPENAI_API_KEY })
        : new mockai({ apiKey: 'apikey' });

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        temperature: 0.7,
        messages: this.messages,
      });

      this.assistantWaiting = false;

      const finishReason = response.choices[0]?.finish_reason;
      if (finishReason == "tool_calls") {
        this.messagesPending.push(response.choices[0].message);
        for (const toolCall of response.choices[0].message.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          //const toolResult = await runTool(toolName, toolArgs);
          const toolResult = [{'foo': 'bar'}];
          this.messagesPending.push({role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(toolResult) });
        }
      } else {
        this.messages.push({role: "assistant", content: response.choices[0].message.content});
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

