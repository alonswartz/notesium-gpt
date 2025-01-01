**Notesium-GPT** is an *experimental addon* for [Notesium](https://github.com/alonswartz/notesium) that integrates with
the OpenAI API, effectively creating a powerful assistant you can talk
to about your own knowledge base.

This addon is designed with **privacy, transparency, and control** in
mind. Unlike other AI integrations, it does not use embeddings,
training, or require a vector database. It also avoids relying on
intermediary servers or services, which could potentially access or view
sensitive data.

Instead, it has no external dependencies, communicates directly with the
OpenAI completion endpoint, and leverages [function calling](https://platform.openai.com/docs/guides/function-calling) to maintain
full control over **exactly** what information is shared with the
assistant.

For example, when a request is made, the assistant determines what
context is needed to fulfill it and responds with "tool_calls" to fetch
the relevant data. These tool_calls and their resulting data are
displayed for **review and manual approval**, ensuring complete transparency
in the interaction. For those who prefer uninterrupted conversations, an
"auto-approve" mode can be enabled.

## Features

- **Note Referencing**: Use `[[` to reference notes seamlessly. The
  note's title and filename are inserted into the message box, not the
  note content itself.
- **Context Request Control**: Manually approve context requests, or
  enable auto-approval for uninterrupted conversations. Auto-approval is
  automatically disabled as a fail-safe if a potential loop is detected.
- **Cost Estimation**: Real-time estimate of conversation costs.
- **Customizable Settings**: Configure `temperature` and `max output
  tokens` to fine-tune responses.
- **Quick Copy**: Copy responses to the clipboard with a single click.

## Setup

**Prerequisites:**

- [Notesium](https://github.com/alonswartz/notesium#installation) 0.6.3 or newer.
- An [OpenAI API Key](https://platform.openai.com/account/api-keys).

**Download**:

> Assumes Linux and [tailwindcss standalone-cli](https://tailwindcss.com/blog/standalone-cli).

```bash
git clone https://github.com/alonswartz/notesium-gpt.git
cd notesium-gpt
./web/graph/make.sh all
```

**Api Key**:

> Create notesium-gpt/secrets.js with the following contents.
> See security considerations below.

```javascript
const OPENAI_API_KEY = 'your-api-key-here';
export { OPENAI_API_KEY };
```

## Usage

```bash
notesium web --webroot="path/to/notesium-gpt" --open-browser
```

## Security considerations

- **API Key Exposure**: Even though Notesium runs on localhost, this
  doesn't mitigate all risks. The API key is accessible in the frontend,
  making it potentially vulnerable to malicious or poorly written
  browser extensions and scripts.

- **Spending Limit**: It is recommended to set a spending limit on your
  OpenAI account to avoid unexpected charges.

- **Risk Acceptance**: I personally accept these risks for my own API
  key. If you do not, you should not use this. I take no responsibility
  or liability for any consequences of using Notesium-GPT.

- **Future Plans**: If or when this functionality is integrated into
  Notesium itself, API key management will be moved to the backend, and
  requests will be securely proxied through it.

