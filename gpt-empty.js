var t = `
<div class="flex flex-col items-center justify-center h-3/4">
  <div class="font-bold text-2xl py-4">
    What can I assist you with today?
  </div>
  <ul class="mt-10 text-center w-2/3 space-y-2">
    <li v-for="(prompt, index) in examplePrompts" :key="index" v-text="prompt" @click="$emit('message-send', prompt)"
      class="border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 py-4 rounded-xl text-sm w-full cursor-pointer whitespace-pre-line">
    </li>
  </ul>
</div>
`

export default {
  props: ['live'],
  emits: ['message-send'],
  data() {
    return {
      livePrompts: [
        "What did I work on last week?",
        "Do my notes have a common theme?",
        "Suggest some ways you can assist me",
      ],
      mockPrompts: [
        "hello",
        "lorem",
        "markdown",
        "func_list_notes",
      ],
    }
  },
  computed: {
    examplePrompts() {
      if (this.live) return this.livePrompts;
      return this.mockPrompts;
    },
  },
  template: t
}

