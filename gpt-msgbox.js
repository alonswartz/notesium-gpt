var t = `
<div>
  <input autofocus class="w-full bg-gray-100 my-4 p-3 rounded-xl focus:outline-none" 
   placeholder="Type your message..." v-model="userPrompt" @keyup.enter="sendMessage" />
</div>
`

export default {
  emits: ['message-send'],
  data() {
    return {
      userPrompt: '',
    }
  },
  methods: {
    sendMessage() {
      if (!this.userPrompt) return;
      this.$emit('message-send', this.userPrompt);
      this.userPrompt = '';
    },
  },
  template: t
}
