const toolSpecs = [];
const toolFuncs = {};

function getSystemMsg() {
  const currentDatetime = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
  const systemMsg = `
    You are a helpful assistant for a notes app.
    Use the supplied tools to assist the user.
    You do not have the ability to update a note via a tool.
    If the user asks about relative dates, know that the current datetime is ${currentDatetime}.
  `;
  return { role: "system", content: systemMsg.replace(/^\s+/gm, '').trim() };
}

// list_notes
const list_notes_spec = {
  name: "list_notes",
  description: "Get a list of notes",
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
}
async function list_notes() {
  return fetch("/api/notes")
    .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
    .then(response => {
      const notes = Object.values(response);
      return notes.map(note => {
        return {
          Filename: note.Filename,
          Title: note.Title,
          Created: note.Ctime,
          Modified: note.Mtime,
        }
      })
    });
}
toolSpecs.push({ type: "function", function: list_notes_spec })
toolFuncs.list_notes = list_notes;

// fetch note
const fetch_note_spec = {
  name: "fetch_note",
  description: "Fetch a note with its metadata and content. Metadata includes Incoming and Outgoing links.",
  parameters: {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description: "The note filename. Filenames are 8 hexidecimal digits with the .md suffix."
      },
    },
    required: ["filename"],
    additionalProperties: false,
  },
}
async function fetch_note({ filename = filename } = {}) {
  return fetch(`/api/notes/${filename}`)
    .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
    .then(response => {
      const { IsLabel, Lines, Words, Chars, Path, ...note } = response;
      return note;
    })
}
toolSpecs.push({ type: "function", function: fetch_note_spec })
toolFuncs.fetch_note = fetch_note;

// search_notes_content
const search_notes_content_spec = {
  name: "search_notes_content",
  description: "Perform a full text search on all notes. Use this sparingly, always prefer the list_notes tool (at least as a first step) unless you can infer the user is suggesting a full text search",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "array",
        items: { type: "string" },
        description: "Only match lines which include the specified words",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
}
async function search_notes_content({ query = query } = {}) {
  return fetch('/api/raw/lines?prefix=title&color=true')
    .then(response => response.text())
    .then(text => {
      const PATTERN = /^(.*?):(.*?):\s*(?:\x1b\[0;36m(.*?)\x1b\[0m\s*)?(.*)$/
      const items = text.trim().split('\n').map(line => {
        const matches = PATTERN.exec(line);
        if (!matches) return null;
        const Filename = matches[1];
        const Linenum = parseInt(matches[2], 10);
        const Title = matches[3] || '';
        const Line = matches[4].toLowerCase();
        return { Filename, Title, Linenum, Line };
      }).filter(Boolean);

      const filteredItems = items.filter(item => (query.every(queryWord => item.Line.includes(queryWord.toLowerCase()))));

      const groupedItems = Object.values(
        filteredItems.reduce((acc, item) => {
          if (!acc[item.Filename]) { acc[item.Filename] = { Filename: item.Filename, Title: item.Title, Matches: [] }; }
          acc[item.Filename].Matches.push({ Line: item.Linenum, Text: item.Line });
          return acc;
        }, {})
      );

      return groupedItems;
    });
}
toolSpecs.push({ type: "function", function: search_notes_content_spec })
toolFuncs.search_notes_content = search_notes_content;

function runTool(name, args) {
  if (typeof toolFuncs[name] === "function") {
    try {
      return toolFuncs[name](args);
    } catch (error) {
      throw new Error(`Error executing function "${name} with args ${args}": ${error.message}`);
    }
  } else {
    throw new Error(`Function "${name}" is not defined.`);
  }
}

export { getSystemMsg, toolSpecs, runTool };
