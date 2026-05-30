// A board for someone who speaks only with their eyes. Every tile earns its
// place — nothing here is a pleasantry. Four categories, ordered by urgency so
// the auto-scan reaches the most time-critical things first. Each phrase is a
// complete, natural sentence (the `say`); the short `label` is what shows on the
// card. Icons are Lucide names.

export const CATEGORIES = [
  { id: "feel",   label: "I feel",   icon: "HeartPulse" },   // body & distress — most urgent, scanned first
  { id: "need",   label: "I need",   icon: "HandHelping" },  // physical needs
  { id: "ask",    label: "Please",   icon: "Bell" },         // ask someone to do something
  { id: "answer", label: "Yes / No", icon: "MessageCircle" },// fast answers to a caregiver's question
];

export const WORDS = {
  // How my body feels right now. Pain and breathing first — these can't wait.
  feel: [
    { label: "in pain",       icon: "Activity",  say: "I'm in pain.",            urgent: true },
    { label: "can't breathe", icon: "Wind",      say: "I can't breathe.",        urgent: true },
    { label: "uncomfortable", icon: "BedDouble", say: "I'm uncomfortable." },
    { label: "too hot",       icon: "Sun",       say: "I'm too hot." },
    { label: "too cold",      icon: "Snowflake", say: "I'm too cold." },
    { label: "scared",        icon: "Frown",     say: "I'm scared. Please stay with me." },
  ],
  // Things I need looked after.
  need: [
    { label: "water",        icon: "GlassWater", say: "I need some water." },
    { label: "the bathroom", icon: "DoorOpen",   say: "I need to use the bathroom." },
    { label: "my medicine",  icon: "Pill",       say: "I need my medicine." },
    { label: "to be moved",  icon: "Move",       say: "Could you help reposition me? I'm uncomfortable." },
    { label: "to rest",      icon: "Moon",       say: "I'd like to rest now." },
    { label: "food",         icon: "Utensils",   say: "I'd like something to eat." },
  ],
  // Ask the person with me to do something.
  ask: [
    { label: "come here",    icon: "ArrowRight",  say: "Could you come here, please?" },
    { label: "call family",  icon: "Users",       say: "Could you call my family, please?" },
    { label: "call a nurse", icon: "Stethoscope", say: "Could you call the nurse, please?" },
    { label: "the light",    icon: "Lightbulb",   say: "Could you turn on the light, please?" },
    { label: "music",        icon: "Music",       say: "Could you play some music, please?" },
    { label: "my phone",     icon: "Smartphone",  say: "Could you bring me my phone, please?" },
  ],
  // Answering a question — the most frequent thing of all, kept one category away.
  answer: [
    { label: "Yes",          icon: "Check",      say: "Yes." },
    { label: "No",           icon: "X",          say: "No." },
    { label: "Maybe",        icon: "Meh",        say: "Maybe." },
    { label: "I don't know", icon: "HelpCircle", say: "I'm not sure." },
    { label: "Please wait",  icon: "Clock",      say: "Please wait a moment." },
    { label: "Stop",         icon: "Hand",       say: "Please stop." },
  ],
};
