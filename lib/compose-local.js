// On-device sentence composer — NO API, NO key, instant, fully private.
// Turns selected board words into a natural first-person sentence using a
// small grammar of templates. Good enough that the app never needs the cloud.

import { WORDS } from "@/lib/board";

const LABEL_CAT = (() => {
  const m = {};
  for (const cat of Object.keys(WORDS)) {
    for (const w of WORDS[cat]) m[w.label] = cat;
  }
  return m;
})();

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

function joinList(arr) {
  if (arr.length <= 1) return arr[0] || "";
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

export function composeLocal(words) {
  if (!words || !words.length) return "";

  const g = { feel: [], need: [], do: [], thing: [], social: [] };
  const unknown = [];
  for (const w of words) {
    const c = LABEL_CAT[w];
    if (c) g[c].push(w);
    else unknown.push(w);
  }

  const actions = [...g.do];
  const things = [...g.thing];
  const needObjects = g.need.filter((n) => !n.startsWith("to "));
  const needInfinitives = g.need.filter((n) => n.startsWith("to "));
  const feels = [...g.feel];

  const parts = [];

  // — warm combined case: one feeling + an object → the hero line —
  // e.g. ["cold","a blanket"] → "I'm cold — could you bring me a blanket, please?"
  if (feels.length === 1 && needObjects.length && !actions.length && !things.length) {
    parts.push(`I'm ${feels[0]} — could you bring me ${joinList(needObjects)}, please?`);
    needObjects.length = 0;
    feels.length = 0;
  }

  // feelings
  if (feels.length) parts.push(`I'm ${joinList(feels)}.`);

  // actions, paired with a thing when one is available
  const actionPhrases = [];
  while (actions.length) {
    const a = actions.shift();
    if (things.length) actionPhrases.push(`${a} ${things.shift()}`);
    else actionPhrases.push(a);
  }
  if (actionPhrases.length) parts.push(`Could you ${joinList(actionPhrases)}, please?`);

  // leftover things → request them
  if (things.length) parts.push(`Could you get me ${joinList(things)}, please?`);

  // needs
  if (needObjects.length) parts.push(`I need ${joinList(needObjects)}.`);
  for (const inf of needInfinitives) parts.push(`I'd like ${inf}.`);

  // anything unrecognised, spoken plainly
  if (unknown.length) parts.push(cap(joinList(unknown)) + ".");

  // social phrases are already complete — speak them as-is
  for (const s of g.social) {
    parts.push(/[.!?]$/.test(s) ? cap(s) : cap(s) + ".");
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
