var t = `
<div class="max-h-screen h-screen overflow-hidden">
  <GPT @note-open="openNote" />
  <Preview v-if="previewFilename" :filename=previewFilename @close="previewFilename=null" />
</div>
`

import GPT from './gpt-core.js';
import Preview from './preview.js';
export default {
  components: { GPT, Preview },
  data() {
    return {
      previewFilename: null,
    }
  },
  methods: {
    openNote(filename) {
      this.previewFilename = filename;
    },
  },
  template: t
}
