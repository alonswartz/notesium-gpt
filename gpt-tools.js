const toolSpecs = [];
const toolFuncs = {};

function getSystemMsg() {
  const currentDatetime = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
  const systemMsg = `
    You are a helpful assistant for a notes app.
    Use the supplied tools to assist the user.
    The search tools require multi-word terms to be enclosed in single quotes. If you do not enclose multi-word terms in single quotes, the search query will fail and produce no results. This is a hard requirement. Any multi-word terms not enclosed in single quotes are invalid.
    You do not have the ability to update a note via a tool.
    When referencing a specific note, render it as a markdown link - e.g., [TITLE](FILENAME)
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
  description: "Perform a full text search on all notes. Use this when the user specifically requests a keyword-based search across note contents.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: `A single string representing the search query.

Search Query Construction guidelines:

IMPORTANT: **Any multi-word term MUST be enclosed in single quotes**. This applies in ALL scenarios. If a term has more than one word (e.g. "earth science"), you must write it as "'earth science'". Never leave multi-word terms unquoted. Our search logic interprets space-delimited words as AND. If you don't enclose multi-word phrases in single quotes, the entire search query will break, especially when included in an OR. To prevent this, **always** enclose multi-word phrases in single quotes. If you do not enclose multi-word terms in single quotes, the search query will fail and produce no results. This is a hard requirement. Any multi-word terms not enclosed in single quotes are invalid.

1. **Analyze the user intent**:
   - Is the user likely looking for synonyms or variations? If yes, incorporate OR and broaded the search.
   - Is the user explicitly saying "it must have these terms together?" If yes, use AND.
   - Is the user explicitly saying "exclude this term?" If yes, use NOT.

2. **Default to OR (|) for synonyms/semantic expansions**:
   - If the user request suggests related, synonymous terms, or a semantic concept that can be expressed in different ways, use the OR operator.
   - If the user says "notes relating to science topics", broaden the search using synonymous terms: "science|physics|'earth science'|chemistry|biology|...".
   - If the user says "notes mentioning albert einstein or richard feynman", broaden the search by using their last names: "einstein|feynman".
   - If the user says "notes on earth science or astronomy", the user is being specific, so produce "'earth science'|astronomy".
   - When using multi-word terms, each multi-word term must be enclosed in single quotes. **Never** produce unquoted multi-word terms.

3. **Use AND (spaces) only if the user explicitly wants all terms simultaneously**:
   - If the user says "notes that mention both 'book' and 'physics'", then you can do "book physics".

4. **Use NOT (!) only if the user explicitly wants to exclude terms**:
   - If the user says "notes that mention 'book' but not 'math'", then you can do "book !math".

Examples:
  - "physics|'space exploration'|math" => lines matching 'physics' OR the exact phrase 'space exploration' or 'math'.
  - "dog|puppy|canine" => lines matching at least one synonym/semantic variant.
  - "book physics" => lines matching both "book" AND "physics".
  - "book !math" => lines matching "book" but NOT "math".

Rules recap:

1. **Always** put multi-word terms in single quotes. Failing to quote multi-word terms will break the query. **Never** produce unquoted multi-word terms.
2. **Default to OR** (|) for broader, semantic-like searches.
3. **Use AND** (space) only if the user explicitly wants all terms co-occurring.
4. **Use NOT** (!) only if the user explicity wants to exclude terms.
`,
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
