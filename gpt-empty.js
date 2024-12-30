var t = `
<div class="flex flex-col items-center justify-center h-3/4">
  <div class="font-bold text-2xl py-4" v-text="animatedText || '|'"></div>
  <div class="mt-10 text-center w-2/3">
    <ul :class="showPrompts ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      class="transform transition-opacity transition-transform duration-700 ease-in-out space-y-2">
      <li v-for="(prompt, index) in examplePrompts" :key="index" v-text="prompt" @click="$emit('message-send', prompt)"
        class="border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 py-4 rounded-xl text-sm w-full cursor-pointer whitespace-pre-line">
      </li>
    </ul>
  </div>
</div>
`

export default {
  props: ['live'],
  emits: ['message-send'],
  data() {
    return {
      welcomeText: "What can I help with today?",
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
      animatedText: "",
      showPrompts: false,
    }
  },
  methods: {
    async animate() {
      this.animatedText = "";
      this.showPrompts = false;
      await new Promise((resolve) => setTimeout(resolve, 500));

      let i = 0;
      while (i < this.welcomeText.length) {
        this.animatedText += this.welcomeText[i]; i++;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      this.showPrompts = true;
    },
  },
  computed: {
    examplePrompts() {
      if (this.live) return this.livePrompts;
      return this.mockPrompts;
    },
  },
  mounted() {
    this.animate();
  },
  template: t
}

