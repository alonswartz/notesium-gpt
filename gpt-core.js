var t = `
<div class="h-full flex flex-col">
  <main class="grow overflow-y-scroll" ref="mainContainer">
    <div class="sticky top-0 z-10 bg-white/50 backdrop-blur border-b border-gray-100 h-12 w-full flex items-center px-4">
      <div>Notesium GPT</div>
    </div>
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMessages :messages=messages />
    </div>
  </main>
  <div class="pr-[10px]">
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <GPTMsgBox @message-send="sendMessage" />
    </div>
  </div>
</div>
`

import GPTMsgBox from './gpt-msgbox.js'
import GPTMessages from './gpt-messages.js'
import { mockai } from './gpt-mockai.js'
export default {
  components: { GPTMsgBox, GPTMessages },
  data() {
    return {
      messages: [],
    }
  },
  methods: {
    async sendMessage(messageText) {
      this.messages.push({role: 'user', content: messageText});

      const client = new mockai({ apiKey: 'apikey' });
      const response = await client.chat.completions.create({
        messages: this.messages,
      });

      this.messages.push({role: "assistant", content: response.choices[0].message.content});
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

