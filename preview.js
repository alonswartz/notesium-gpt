var t = `
<div class="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" role="dialog" aria-modal="true" >
  <div @click="$emit('close')" class="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" aria-hidden="true"></div>
  <div v-if="note" class="mx-auto max-w-2xl h-4/5 flex flex-col transform overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black ring-opacity-5">
    <div class="w-full p-2 flex justify-end space-x-2 border-b border-gray-200">
      <a title="open via xdg" :href="'notesium://'+ note.Path"
        class="p-1 cursor-pointer text-gray-300 hover:text-gray-400">
        <Icon name="outline-external-link" size="h-4 w-4" />
      </a>
      <div title="close" @click="$emit('close')"
        class="p-1 cursor-pointer text-gray-300 hover:text-gray-400">
        <Icon name="mini-x-mark" size="h-4 w-4" />
      </div>
    </div>

    <pre v-text="note.Content" class="mt-2 p-2 text-sm overflow-y-auto"></pre>
  </div>
</div>
`

import Icon from './gpt-icon.js'
export default {
  props: ['filename'],
  emits: ['close'],
  components: { Icon },
  data() {
    return {
      note: null,
    }
  },
  methods: {
    fetchNote() {
      fetch("/api/notes/" + this.filename)
        .then(response => response.json())
        .then(note => { this.note = note })
    },
  },
  mounted() {
    this.fetchNote();
  },
  template: t
}

