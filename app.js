var t = `
<div class="max-h-screen h-screen overflow-hidden">
  <GPT @note-open="openNote" />
</div>
`

import GPT from './gpt-core.js';
export default {
  components: { GPT },
  methods: {
    openNote(filename) {
      console.log('openNote', filename);
    },
  },
  template: t
}
