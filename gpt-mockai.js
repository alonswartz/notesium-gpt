const mockContent = {
  "default": "Sorry, but I don't know how to help with that...",
  "hello": "Hey there, what can I help you with?",
  "lorem": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
};

function getMockResponse(messages) {
  const lastMessage = messages.at(-1);
  const responseContent = Object.entries(mockContent).find(([key]) => lastMessage.content.includes(key) && key !== "default")?.[1] || mockContent["default"];
  return { "choices": [ { "message": { "role": "assistant", "content": responseContent } } ] };
}

class MockAI {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.chat = {
      completions: {
        create: this._completionCreate.bind(this),
      },
    };
  }

  async _completionCreate(payload) {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(500);
    return getMockResponse(payload.messages);
  }
}

export const mockai = MockAI;
