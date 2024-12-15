var t = `
<div class="flex flex-col space-y-4 pt-4">
  <template v-for="message in messages">
    <div v-if="message.role == 'user'" class="flex justify-end">
      <div class="ml-20 bg-gray-100 rounded-2xl py-3 px-4" v-text="message.content"></div>
    </div>
    <div v-else-if="message.role == 'assistant'" class="flex w-full items-start gap-4 py-2">
      <div class="flex items-center justify-center gap-2 rounded-full h-8 w-8 border border-gray-200 text-gray-700">
        <Icon name="outline-sparkles" size="w-4 h-4">
      </div>
      <div class="flex grow shrink-0 basis-0 flex-col items-start gap-2">
        <div class="flex w-full flex-col items-start pt-1.5">
          <span class="grow shrink-0 basis-0" v-text="message.content"></span>
        </div>
      </div>
    </div>
  </template>
</div>
`

import Icon from './gpt-icon.js'
export default {
  props: ['messages'],
  components: { Icon },
  template: t
}
