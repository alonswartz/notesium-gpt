var t = `
<div class="relative group inline-block text-left">
  <span title="settings" class="cursor-pointer text-gray-400 group-hover:text-gray-600">
    <Icon name="outline-adjustments-horizontal" size="h-5 w-5" />
  </span>
  <div class="hidden group-hover:block absolute right-0 z-50 w-80 pt-3 -mt-1 origin-top-right">
    <div class="rounded-md bg-white border border-gray-300 overflow-hidden">
      <ul class="text-xs divide-y divide-gray-200">
        <li class="flex items-center justify-items-center justify-end bg-gray-100 block py-2 px-4">
          <span class="text-gray-500" v-text="settings.model.value" />
        </li>

        <template v-for="(option, key) in settings" :key="key">
          <li v-if="option.type == 'bool'" @click="option.value=!option.value"
            class="flex items-center justify-items-center justify-between hover:bg-gray-50 block cursor-pointer py-4 px-4">
            <label class="mt-px" v-text="option.title"></label>
            <input v-model="option.value" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
          </li>
        </template>

        <template v-for="(option, key) in settings" :key="key">
          <li v-if="option.type == 'range'"
            class="items-center justify-items-center justify-between block py-3 px-4">
            <div class="flex items-center justify-between">
              <span v-text="option.title"></span>
              <span v-text="option.value"></span>
            </div>
            <input class="w-full" type="range" v-model="option.value" :min="option.min" :max="option.max" :step="option.step" />
          </li>
        </template>
      </ul>
    </div>
  </div>
</div>
`

import Icon from './gpt-icon.js'
export default {
  props: ['settings'],
  components: { Icon },
  template: t
}
