var t = `
<div class="flex items-center space-x-1 w-full my-4 px-3 bg-stone-100 rounded-xl">
  <div autofocus contenteditable="true" placeholder="Type your message..." id="messageInput" ref="messageInput"
    class="grow w-full my-2 p-2 focus:outline-none max-h-40 overflow-y-auto text-md"
    @keydown.enter.exact.prevent="sendMessage">
  </div>
  <div class="cursor-pointer hover:text-gray-600" @click="sendMessage">
    <Icon name="solid-arrow-up-circle" size="h-8 w-8" />
  </div>
</div>
`

import Icon from './gpt-icon.js'
export default {
  components: { Icon },
  emits: ['message-send'],
  methods: {
    sendMessage() {
      const messageInput = this.$refs.messageInput;
      const messageText = messageInput.innerText.trim();
      if (messageText) {
        this.$emit('message-send', messageText);
        messageInput.innerText = '';
        messageInput.focus();
      }
    },
  },
  template: t
}
