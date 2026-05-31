export const CATEGORIES = [
  { id: "feel",   label: "I feel",  icon: "HeartPulse" },
  { id: "need",   label: "I need",  icon: "HandHelping" },
  { id: "people", label: "People",  icon: "Users" },
  { id: "answer", label: "Answers", icon: "MessageCircle" },
];

export const WORDS = {
  feel: [
    { label: "in pain",       icon: "Activity",    say: "I'm in pain.",                 urgent: true },
    { label: "can't breathe", icon: "Wind",        say: "I can't breathe.",             urgent: true },
    { label: "sick",          icon: "Thermometer", say: "I feel sick." },
    { label: "too hot",       icon: "Sun",         say: "I'm too hot." },
    { label: "too cold",      icon: "Snowflake",   say: "I'm too cold." },
    { label: "itchy",         icon: "Feather",     say: "I have an itch. Could you help me?" },
  ],
  need: [
    { label: "water",        icon: "GlassWater", say: "I need some water." },
    { label: "the bathroom", icon: "DoorOpen",   say: "I need to use the bathroom." },
    { label: "my medicine",  icon: "Pill",       say: "I need my medicine." },
    { label: "to be moved",  icon: "Move",       say: "Could you help reposition me? I'm uncomfortable." },
    { label: "to rest",      icon: "Moon",       say: "I'd like to rest now." },
    { label: "food",         icon: "Utensils",   say: "I'd like something to eat." },
  ],
  people: [
    { label: "come closer",  icon: "ChevronsRight", say: "Could you come closer, please?" },
    { label: "call family",  icon: "Users",         say: "Could you call my family, please?" },
    { label: "call a nurse", icon: "Stethoscope",   say: "Could you call the nurse, please?" },
    { label: "hold my hand", icon: "Hand",          say: "Will you hold my hand?" },
    { label: "stay with me", icon: "HeartHandshake",say: "Please stay with me." },
    { label: "I love you",   icon: "Heart",         say: "I love you." },
  ],

  answer: [
    { label: "Yes",          icon: "Check",      say: "Yes." },
    { label: "No",           icon: "X",          say: "No." },
    { label: "I'm okay",     icon: "ThumbsUp",   say: "I'm okay." },
    { label: "I don't know", icon: "HelpCircle", say: "I'm not sure." },
    { label: "Please wait",  icon: "Clock",      say: "Please wait a moment." },
    { label: "Stop",         icon: "Ban",        say: "Please stop." },
  ],
};
