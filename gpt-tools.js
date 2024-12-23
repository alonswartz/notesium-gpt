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
  description: "Get a list of notes. Optionally filter by a date range.",
  parameters: {
    type: "object",
    properties: {
      date_range: {
        type: "object",
        description: "Filter notes by a date range. Leave 'start' or 'end' empty for open-ended ranges.",
        properties: {
          date: {
            type: "string",
            description: "The date field to filter by ('created' or 'modified').",
            enum: ["created", "modified"],
          },
          start: {
            type: "string",
            description: "The start date in ISO 8601 format (e.g., '2024-01-01').",
            format: "date",
          },
          end: {
            type: "string",
            description: "The end date in ISO 8601 format (e.g., '2024-01-30').",
            format: "date",
          },
        },
        required: ["date"],
        additionalProperties: false,
      },
    },
    required: [],
    additionalProperties: false,
  },
};
async function list_notes({ date_range = null } = {}) {
  return fetch("/api/notes")
    .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
    .then(response => {
      let notes = Object.values(response).map(note => ({
        Filename: note.Filename,
        Title: note.Title,
        Created: note.Ctime,
        Modified: note.Mtime,
      }));

      if (date_range) {
        const { date, start, end } = date_range;
        notes = notes.filter(note => {
          const field = note[date === 'created' ? 'Created' : 'Modified'];
          const fieldDate = new Date(field);
          const afterStart = start ? fieldDate >= new Date(start) : true;
          const beforeEnd = end ? fieldDate <= new Date(end) : true;
          return afterStart && beforeEnd;
        });
      }

      return notes;
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
  description:
    "Perform a full text search on all notes. Use this sparingly; prefer the list_notes tool (at least as a first step) unless the user specifically requests a deeper, keyword-based search across note contents.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: `A single string representing the search query.

Guidelines for constructing the query:

1. **Default to OR (|) for synonyms/semantic expansions**:
   - If the user’s request suggests multiple related or synonymous terms, or a semantic concept that can be expressed in different ways, use the OR operator.
   - For instance, if the user says "dog" prefer "dog|puppy|canine".

2. **Use partial matches for stems**:
   - E.g., 'abilit' to match 'ability'/'abilities'.

3. **Use AND (spaces) only if the user explicitly wants all terms simultaneously**:
   - If the user says "notes that mention both 'book' and 'physics'," then you can do "book physics".

4. **Use NOT (!) sparingly to exclude terms**:
   - Only if the user explicitly wants to exclude something. For instance, if the user says "but not math," then do "book !math".

5. **Examples**:
   - "dog|puppy|canine" => lines matching at least one synonym/semantic variant.
   - "book physics" => lines must have both "book" AND "physics".
   - "book !math" => lines must have "book" but not "math".

6. **Analyze the user intent**:
   - Are they likely looking for synonyms or variations? If yes, incorporate OR for each conceptual group.
   - Are they explicitly saying “it must have these terms together?” If yes, use AND.
   - Are they explicitly saying “exclude this term?” If yes, use NOT.

Construct the query string accordingly, focusing on OR-based synonyms for broader, semantic-like searches, and only using AND/NOT if the user specifically indicates that requirement.`,
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
};


async function search_notes_content({ query = query } = {}) {
  const encodedQuery = encodeURIComponent(query);
  return fetch('/api/raw/lines?prefix=title&color=true&filter=' + encodedQuery)
    .then(response => response.text())
    .then(text => {
      const PATTERN = /^(.*?):(.*?):\s*(?:\x1b\[0;36m(.*?)\x1b\[0m\s*)?(.*)$/
      const items = text.trim().split('\n').map(line => {
        const matches = PATTERN.exec(line);
        if (!matches) return null;
        const Filename = matches[1];
        const Linenum = parseInt(matches[2], 10);
        const Title = matches[3] || '';
        const Line = matches[4];
        return { Filename, Title, Linenum, Line };
      }).filter(Boolean);

      const groupedItems = Object.values(
        items.reduce((acc, item) => {
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
