var t = `
<div class="fixed inset-0 z-50 cursor-not-allowed"></div>
<div class="relative mt-4 z-50" @keydown.esc="$emit('pending-decline')">
  <div class="flex w-full items-start gap-4 py-2">
    <div class="flex flex-none items-center justify-center gap-2 rounded-full h-8 w-8 border border-gray-200 text-gray-700">
      <Icon name="outline-exclamation-triangle" size="w-4 h-4" />
    </div>
    <div class="w-full flex flex-col items-start gap-2 pt-1.5 pb-2 overflow-hidden">
      <div class="w-full">
        <p>The assistant has requested context to fulfill the request</p>
        <template v-for="message in pending">
          <pre v-if="message.role === 'assistant'" v-for="tool in message.tool_calls" v-text="'function: ' + JSON.stringify(tool.function)"
            class="text-xs my-2 p-2 bg-gray-100 text-gray-800 max-h-64 overflow-auto rounded-md font-semibold border border-gray-200"></pre>
          <pre v-if="message.role === 'tool'" v-text="JSON.parse(message.content)"
            class="text-xs mb-2 p-2 bg-gray-100 text-gray-800 max-h-64 overflow-auto rounded-md"></pre>
        </template>
      </div>
      <div class="flex space-x-4 items-center text-sm pl-1">
        <button ref="approveBtn" @click="$emit('pending-approve')" @keydown.tab.prevent="$refs.declineBtn.focus()"
          class="py-1 px-3 focus:ring focus:outline-none ring-indigo-400 rounded-full bg-gray-700 hover:bg-gray-600 text-white">Allow</button>
        <button ref="declineBtn" @click="$emit('pending-decline')" @keydown.tab.prevent="$refs.approveBtn.focus()" 
          class="py-1 px-3 focus:ring focus:outline-none ring-indigo-400 rounded-full bg-gray-100 hover:text-red-700 text-gray-700">Decline</button>
      </div>
    </div>
  </div>
</div>
`

import Icon from './gpt-icon.js'
export default {
  props: ['pending'],
  emits: ['pending-approve', 'pending-decline'],
  components: { Icon },
  mounted() {
    this.$nextTick(() => {
      this.$refs.approveBtn.focus();
    });
  },
  template: t
}
