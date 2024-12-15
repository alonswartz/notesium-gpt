class OpenAI {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.chat = {
      completions: {
        create: this._completionCreate.bind(this),
      },
    };
  }

  async _completionCreate(payload) {
    try {
      const auth = `Bearer ${this.apiKey}`;
      const endpoint = "https://api.openai.com/v1/chat/completions";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {"Content-Type":"application/json", "Authorization": auth},
        body: JSON.stringify(payload)
      });
      if (!response.ok) { throw new Error(response); }
      return await response.json();
    } catch (error) {
      console.error("Error during OpenAI request:", error);
      throw error;
    }
  }

}

export const openai = OpenAI;
