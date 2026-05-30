// A board for someone who speaks only with their eyes. Every tile has to earn
// its place — nothing here is leisure or a pleasantry. Four boards, ordered by
// urgency so the auto-scan reaches the most time-critical things first. Each
// phrase is a complete, natural sentence (the `say`); the short `label` is what
// shows on the card. Icons are Lucide names.

export const CATEGORIES = [
  { id: "feel",   label: "I feel",  icon: "HeartPulse" },     // body & distress — most urgent, scanned first
  { id: "need",   label: "I need",  icon: "HandHelping" },    // things to be brought or done
  { id: "people", label: "People",  icon: "Users" },          // reaching the person with me — calls + closeness
  { id: "answer", label: "Answers", icon: "MessageCircle" },  // fast replies to a question
];

export const WORDS = {
  // How my body feels right now. Pain and breathing first — these can't wait.
  // "itchy" looks small, but an itch you can't scratch is torture and there's
  // no other way to ask.
  feel: [
    { label: "in pain",       icon: "Activity",    say: "I'm in pain.",                 urgent: true },
    { label: "can't breathe", icon: "Wind",        say: "I can't breathe.",             urgent: true },
    { label: "sick",          icon: "Thermometer", say: "I feel sick." },
    { label: "too hot",       icon: "Sun",         say: "I'm too hot." },
    { label: "too cold",      icon: "Snowflake",   say: "I'm too cold." },
    { label: "itchy",         icon: "Feather",     say: "I have an itch. Could you help me?" },
  ],
  // Things I need brought or done for me.
  need: [
    { label: "water",        icon: "GlassWater", say: "I need some water." },
    { label: "the bathroom", icon: "DoorOpen",   say: "I need to use the bathroom." },
    { label: "my medicine",  icon: "Pill",       say: "I need my medicine." },
    { label: "to be moved",  icon: "Move",       say: "Could you help reposition me? I'm uncomfortable." },
    { label: "to rest",      icon: "Moon",       say: "I'd like to rest now." },
    { label: "food",         icon: "Utensils",   say: "I'd like something to eat." },
  ],
  // Reaching the person beside me — practical calls and the things that are
  // impossible to say any other way once your body can't.
  people: [
    { label: "come closer",  icon: "ChevronsRight", say: "Could you come closer, please?" },
    { label: "call family",  icon: "Users",         say: "Could you call my family, please?" },
    { label: "call a nurse", icon: "Stethoscope",   say: "Could you call the nurse, please?" },
    { label: "hold my hand", icon: "Hand",          say: "Will you hold my hand?" },
    { label: "stay with me", icon: "HeartHandshake",say: "Please stay with me." },
    { label: "I love you",   icon: "Heart",         say: "I love you." },
  ],
  // Answering a question — the most frequent thing of all, kept one board away.
  answer: [
    { label: "Yes",          icon: "Check",      say: "Yes." },
    { label: "No",           icon: "X",          say: "No." },
    { label: "I'm okay",     icon: "ThumbsUp",   say: "I'm okay." },
    { label: "I don't know", icon: "HelpCircle", say: "I'm not sure." },
    { label: "Please wait",  icon: "Clock",      say: "Please wait a moment." },
    { label: "Stop",         icon: "Ban",        say: "Please stop." },
  ],
};
