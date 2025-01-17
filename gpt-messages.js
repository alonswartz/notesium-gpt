var t = `
<div class="flex flex-col space-y-4 pt-4">

  <template v-for="message in messages">
    <div v-if="message.role == 'user'" class="flex justify-end">
      <div class="ml-20 bg-gray-100 rounded-2xl py-3 px-4 whitespace-pre-line" v-text="message.content"></div>
    </div>
    <div v-else-if="message.role == 'tool'" class="flex justify-end">
      <div class="bg-gray-100 rounded-2xl pt-2 pl-3 -mb-2 overflow-hidden">
        <details class="w-full max-w-full text-xs">
          <summary class="flex focus:outline-none cursor-pointer hover:underline italic space-x-1">
            <Icon name="mini-paperclip" size="w-3 h-3" />
            <span class="pb-1.5 pr-4">context</span>
          </summary>
          <div class="flex flex-col divide-y">
            <pre class="py-3 text-xs max-h-32 overflow-auto font-semibold" v-text="getToolCall(message.tool_call_id).function"></pre>
            <pre class="py-3 text-xs max-h-64 overflow-auto" v-text="JSON.parse(message.content)"></pre>
          </div>
        </details>
      </div>
    </div>
    <div v-else-if="message.role == 'assistant' && message.content" class="flex w-full items-start gap-4 py-2">
      <div class="flex items-center justify-center gap-2 rounded-full h-8 w-8 border border-gray-200 text-gray-700">
        <Icon name="outline-sparkles" size="w-4 h-4" />
      </div>
      <div class="flex grow shrink-0 basis-0 flex-col items-start gap-2">
        <div class="group flex w-full flex-col items-start pt-1">
          <span class="grow shrink-0 basis-0 prose prose-md prose-h1:text-3xl prose-headings:my-3 prose-a:text-blue-600 hover:prose-a:text-blue-500 max-w-none"
            @click="handleClick"
            v-html="parseMarkdown(message.content)">
          </span>
          <span class="flex space-x-1 items-center cursor-pointer text-transparent group-hover:text-gray-400 hover:underline pt-2 -mb-5 w-full"
            @click="copyToClipboard(message.content)">
            <Icon name="square-2-stack" size="w-4 h-4" />
            <span class="text-xs mt-px" v-text="copyStatus || 'copy to clipboard'" />
          </span>
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

  <div v-show="warning" class="flex w-full items-start gap-4 py-2">
    <div class="flex items-center justify-center gap-2 rounded-full h-8 w-8 border border-gray-200 text-gray-700">
      <Icon name="outline-exclamation-triangle" size="w-4 h-4" />
    </div>
    <div class="flex grow shrink-0 basis-0 flex-col items-start gap-2">
      <div class="flex w-full flex-col items-start pt-1.5">
        <span class="grow shrink-0 basis-0 text-red-700" v-text="warning"></span>
      </div>
    </div>
  </div>

</div>
`

import Icon from './gpt-icon.js'
export default {
  props: ['messages', 'assistantWaiting', 'warning'],
  emits: ['note-open'],
  components: { Icon },
  data() {
    return {
      copyStatus: '',
    }
  },
  methods: {
    parseMarkdown(content) {
      return marked.parse(content);
    },
    handleClick(event) {
      const href = event.target?.getAttribute('href');
      if (href) {
        if (/^[0-9a-f]{8}\.md$/i.test(href)) {
          event.preventDefault();
          this.$emit('note-open', href);
        } else {
          event.target.setAttribute('target', '_blank');
        }
      }
    },
    getToolCall(id) {
      for (const message of this.messages) {
        if (message.tool_calls) {
          const toolCall = message.tool_calls.find(tc => tc.id === id);
          if (toolCall) return toolCall;
        }
      }
      return null;
    },
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.copyStatus = "copied!";
      } catch (err) {
        console.error("Failed to copy text:", err);
        this.copyStatus = "copy failed";
      }
      setTimeout(() => { this.copyStatus = "" }, 2000);
    },
  },
  template: t
}
