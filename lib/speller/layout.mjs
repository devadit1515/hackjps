// The Speller grid — pure data, no DOM. Letters stay alphabetical and stationary
// (predictability beats raw speed for a tiring, often-alone user — the AI does the
// speed work). Predictions are row 0 so a guessed word is the fastest thing to reach.
// Every row ends with a "back" cell so a mis-entered row is never a dead end.

const back = (key) => ({ kind: "back", label: "back", value: "back", icon: "CornerDownLeft", key: "back-" + key });

function letters(str, extra = [], rowKey = str) {
  const cells = str.split("").map((ch) => ({ kind: "letter", label: ch, value: ch, key: "L" + ch }));
  return [...cells, ...extra, back(rowKey)];
}

// Stable labels for the row-mode highlight / ARIA.
export const ROW_LABELS = ["Suggestions", "A–I", "J–R", "S–Z", "Edit", "Actions"];

// Build the full grid for the current suggestions. `suggestions` is an array of
// { label, text } where `text` is the FULL composed message after acceptance.
// When `canSay` is true (the message has content), a prominent "Say it" cell is
// placed first — the fastest thing to reach once a message is ready to speak.
export function buildRows(suggestions = [], canSay = false) {
  const sg = suggestions.slice(0, canSay ? 3 : 4).map((s, i) => ({
    kind: "suggestion", label: s.label, value: s.text, key: "sg" + i,
  }));
  const sayCell = canSay ? [{ kind: "say", label: "Say it", value: "say", icon: "Megaphone", key: "sayit" }] : [];

  return [
    [...sayCell, ...sg, back("sg")],                                              // 0 — say-it + predictions (scanned first)
    letters("ABCDEFGHI", [], "ai"),                                              // 1
    letters("JKLMNOPQR", [], "jr"),                                              // 2
    letters("STUVWXYZ", [{ kind: "space", label: "space", value: " ", icon: "Space", key: "space" }], "sz"), // 3
    [                                                                            // 4 — edit + punctuation
      { kind: "edit", label: "letter", value: "delLetter", icon: "Delete", key: "delLetter" },
      { kind: "edit", label: "word", value: "delWord", icon: "Eraser", key: "delWord" },
      { kind: "edit", label: "undo", value: "undo", icon: "Undo2", key: "undo" },
      { kind: "edit", label: "clear", value: "clear", icon: "Trash2", key: "clear" },
      { kind: "punct", label: ".", value: ".", key: "dot" },
      { kind: "punct", label: ",", value: ",", key: "comma" },
      { kind: "punct", label: "?", value: "?", key: "qmark" },
      back("edit"),
    ],
    [                                                                            // 5 — actions + safety
      { kind: "action", label: "speak", value: "speak", icon: "Volume2", key: "speak" },
      { kind: "action", label: "rest", value: "rest", icon: "PauseCircle", key: "rest" },
      { kind: "action", label: "recent", value: "recent", icon: "History", key: "recent" },
      { kind: "action", label: "speed", value: "speed", icon: "Gauge", key: "speed" },
      { kind: "action", label: "call for help", value: "call", icon: "Siren", urgent: true, key: "call" },
      back("act"),
    ],
  ];
}
