// Define mock responses as a dictionary
const mockResponses = {
  "hello": "Hey there, what can I help you with?",
  "lorem": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
};

export function getMockResponse(messages) {
  const msgContent = messages.at(-1)?.content || "";
  for (const [key, response] of Object.entries(mockResponses)) {
    if (msgContent.includes(key)) {
      return response;
    }
  }
  return "Sorry, but I don't know how to help with that...";
}
