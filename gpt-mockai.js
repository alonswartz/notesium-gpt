const mockChoice = {
  "default": {
    "message": {
      "role": "assistant",
      "content": "Sorry, but I don't know how to help with that..."
    },
    "finish_reason": "stop"
  },
  "default_tool": {
    "message": {
      "role": "assistant",
      "content": "Based on the context provided ...."
    },
    "finish_reason": "stop"
  },
  "hello": {
    "message": {
      "role": "assistant",
      "content": "Hey there, what can I help you with?"
    },
    "finish_reason": "stop"
  },
  "lorem": {
    "message": {
      "role": "assistant",
      "content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    "finish_reason": "stop"
  },
  "func_list_notes": {
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_123456789012345678901234",
          "type": "function",
          "function": {
            "name": "list_notes",
            "arguments": "{}"
          }
        }
      ],
    },
    "finish_reason": "tool_calls"
  },
}

function getMockResponse(messages) {
  const { role, content = "" } = messages.at(-1) || {};
  if (role === 'tool') {
    return {"choices": [ mockChoice["default_tool"] ] };
  } else {
    return {"choices": [ Object.entries(mockChoice).find(([key]) => content.includes(key))?.[1] || mockChoice["default"] ] };
  }
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
