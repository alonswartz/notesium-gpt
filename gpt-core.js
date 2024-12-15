var t = `
<div class="h-full flex flex-col">
  <main class="grow overflow-y-scroll">
    <div class="sticky top-0 z-10 bg-white/50 backdrop-blur border-b border-gray-100 h-12 w-full flex items-center px-4">
      <div>Notesium GPT</div>
    </div>
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <template v-for="message in messages">
        <pre class="h-48 bg-gray-100 p-2 my-4 rounded-md overflow-x-auto" v-text="message"></pre>
      </template>
    </div>
  </main>
  <div class="pr-[10px]">
    <div class="max-w-3xl mx-auto px-4 xl:px-0">
      <input autofocus class="w-full bg-gray-100 my-4 p-3 rounded-xl focus:outline-none" 
       placeholder="Type your message..." v-model="userPrompt" @keyup.enter="sendMessage" />
    </div>
  </div>
</div>
`

export default {
  data() {
    return {
      userPrompt: '',
      messages: [],
    }
  },
  methods: {
    sendMessage() {
      if (!this.userPrompt) return;
      this.messages.push(this.userPrompt);
      this.userPrompt = '';
    },
  },
  template: t
}

