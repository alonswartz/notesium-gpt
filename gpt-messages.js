var t = `
<div class="flex flex-col space-y-4 pt-4">

  <template v-for="message in messages">
    <div v-if="message.role == 'user'" class="flex justify-end">
      <div class="ml-20 bg-gray-100 rounded-2xl py-3 px-4" v-text="message.content"></div>
    </div>
    <div v-else-if="message.role == 'tool'" class="flex justify-end">
      <div class="ml-20 bg-gray-100 rounded-2xl pt-2 pb-1.5 pl-3 pr-4 -mb-2">
        <details class="w-full text-xs">
          <summary class="flex focus:outline-none cursor-pointer hover:underline italic space-x-1">
            <Icon name="mini-paperclip" size="w-3 h-3" />
            <span>context</span>
          </summary>
          <pre class="mt-2 text-xs max-h-64 overflow-auto" v-text="message.content"></pre>
        </details>
      </div>
    </div>
    <div v-else-if="message.role == 'assistant' && message.content" class="flex w-full items-start gap-4 py-2">
      <div class="flex items-center justify-center gap-2 rounded-full h-8 w-8 border border-gray-200 text-gray-700">
        <Icon name="outline-sparkles" size="w-4 h-4" />
      </div>
      <div class="flex grow shrink-0 basis-0 flex-col items-start gap-2">
        <div class="flex w-full flex-col items-start pt-1.5">
          <span class="grow shrink-0 basis-0" v-text="message.content"></span>
        </div>
      </div>
    </div>
  </template>

  <div v-show="assistantWaiting" class="animate-pulse flex w-full items-start gap-4 py-2 mt-4">
    <div class="flex items-center justify-center gap-2 rounded-full h-8 w-8 border border-gray-200 text-gray-700">
      <Icon name="outline-sparkles" size="w-4 h-4" />
    </div>
    <div class="flex grow shrink-0 basis-0 flex-col items-start gap-2">
      <div class="flex w-full flex-col items-start pt-2 space-y-2">
        <div v-for="row in [['col-span-2', 'col-span-1'], ['col-span-1', 'col-span-2'], ['col-span-2']]" class="w-full grid grid-cols-3 gap-4">
          <div v-for="colSpan in row" class="h-4 bg-slate-200 rounded-full" :class="colSpan"></div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="messagesPending.length" class="flex w-full items-start gap-4 py-2">
    <div class="flex items-center justify-center gap-2 rounded-full h-8 w-8 border border-gray-200 text-gray-700">
      <Icon name="outline-exclamation-triangle" size="w-4 h-4" />
    </div>
    <div class="flex grow shrink-0 basis-0 flex-col items-start gap-2">
      <div class="flex w-full flex-col items-start pt-1.5">
        <details class="flex-none w-full">
          <summary class="flex w-full focus:outline-none">
            <span>The assistant has <span class="border-b border-gray-700 border-dashed cursor-pointer hover:text-gray-700 ">requested context</span> to fulfill the request</span>
          </summary>
          <div class="w-full mt-2 mb-1 bg-gray-100 p-2 rounded-md">
            <pre class="text-xs max-h-64 overflow-auto p-2" v-text="messagesPending"></pre>
          </div>
        </details>
      </div>
      <div class="flex space-x-4 items-center text-sm">
        <button @click="$emit('pending-approve')" class="py-1 px-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white">Allow</button>
        <button @click="$emit('pending-decline')" class="py-1 px-3 rounded-full bg-gray-100 hover:text-red-700 text-gray-700">Decline</button>
      </div>
    </div>
  </div>

</div>
`

import Icon from './gpt-icon.js'
export default {
  props: ['messages', 'assistantWaiting', 'messagesPending'],
  emits: ['pending-approve', 'pending-decline'],
  components: { Icon },
  template: t
}
