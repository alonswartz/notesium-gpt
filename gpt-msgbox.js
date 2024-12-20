var t = `
<div class="flex items-center space-x-1 w-full my-4 px-3 bg-stone-100 rounded-xl">
  <div autofocus contenteditable="true" placeholder="Ask anything, reference a note with [[" id="messageInput" ref="messageInput"
    class="grow w-full my-2 p-2 focus:outline-none max-h-40 overflow-y-auto text-md"
    @keyup.[.exact="handleLeftBracket"
    @keydown.enter.exact.prevent="sendMessage">
  </div>

  <div v-if="assistantWaiting" class="cursor-pointer hover:text-gray-600" @click="console.log('TODO: abort')">
    <Icon name="solid-stop-circle" size="h-8 w-8" />
  </div>
  <div v-else class="cursor-pointer hover:text-gray-600" @click="sendMessage">
    <Icon name="solid-arrow-up-circle" size="h-8 w-8" />
  </div>
</div>

<Finder v-if="showFinder" uri="/api/raw/list?sort=mtime" small=true @finder-selection="handleFinderSelection" />
`

import Icon from './gpt-icon.js'
import Finder from './finder.js'
export default {
  components: { Icon, Finder },
  props: ['assistantWaiting'],
  emits: ['message-send'],
  data() {
    return {
      showFinder: false,
      cursorPos: { childIndex: 0, startOffset: 0, finalOffset: 0 },
    }
  },
  methods: {
    sendMessage() {
      const messageInput = this.$refs.messageInput;
      const messageText = messageInput.innerText.trim();
      if (messageText) {
        this.$emit('message-send', messageText);
        messageInput.innerText = '';
        messageInput.focus();
      }
    },
    handleLeftBracket(e) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const textContent = range.startContainer.textContent;
      if (textContent.substr(range.startOffset - 2, 2) == "[[") {
        const startContainer = range.startContainer;
        const parentNode = startContainer.nodeType === 3 ? startContainer.parentNode : startContainer;
        const childIndex = Array.from(parentNode.childNodes).indexOf(startContainer);
        this.cursorPos.childIndex = childIndex;
        this.cursorPos.startOffset = this.cursorPos.finalOffset = range.startOffset;
        this.showFinder = true;
      }
    },
    handleFinderSelection(value) {
      this.showFinder = false;
      const messageInput = this.$refs.messageInput;

      if (value) {
        const replacementText = `${value.Content} (${value.Filename})`;
        const childNode = messageInput.childNodes[this.cursorPos.childIndex];
        const text = childNode.textContent;
        const startPosition = this.cursorPos.startOffset - 2;
        childNode.textContent = text.substring(0, startPosition) + replacementText + text.substring(startPosition + 2);
        this.cursorPos.finalOffset += replacementText.length - 2;
      }

      this.$nextTick(() => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(messageInput.childNodes[this.cursorPos.childIndex], this.cursorPos.finalOffset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        messageInput.focus();
      });
    },
  },
  watch: {
    'assistantWaiting': function(newVal) { if (!newVal) this.$refs.messageInput.focus(); },
  },
  template: t
}
