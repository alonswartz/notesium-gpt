const systemMsg = "You are a helpful assistant for a notes app. Use the supplied tools to assist the user. You do not have the ability to update a note via a tool.";
const toolSpecs = [];
const toolFuncs = {};

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

export { systemMsg, toolSpecs, runTool };
