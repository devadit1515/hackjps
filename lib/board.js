// Deliberately small vocabulary — a person using their eyes should never face a
// wall of choices. Few, large, calm targets per screen. Icons are Lucide names.

export const CATEGORIES = [
  { id: "feel", label: "Feelings", icon: "Heart" },
  { id: "need", label: "Needs", icon: "HandHelping" },
  { id: "do", label: "Requests", icon: "Sparkles" },
  { id: "social", label: "People", icon: "MessageCircle" },
];

export const WORDS = {
  feel: [
    { label: "tired", icon: "Moon" },
    { label: "in pain", icon: "Activity" },
    { label: "hungry", icon: "Utensils" },
    { label: "thirsty", icon: "GlassWater" },
    { label: "cold", icon: "Snowflake" },
    { label: "scared", icon: "Wind" },
  ],
  need: [
    { label: "water", icon: "GlassWater" },
    { label: "food", icon: "Apple" },
    { label: "a blanket", icon: "BedDouble" },
    { label: "the bathroom", icon: "DoorOpen" },
    { label: "my medicine", icon: "Pill" },
    { label: "to rest", icon: "Moon" },
  ],
  do: [
    { label: "come here", icon: "ArrowRight" },
    { label: "wait", icon: "Clock" },
    { label: "turn on the light", icon: "Lightbulb" },
    { label: "play music", icon: "Music" },
    { label: "bring my phone", icon: "Smartphone" },
    { label: "read to me", icon: "BookOpen" },
  ],
  social: [
    { label: "hello", icon: "Hand" },
    { label: "thank you", icon: "Heart" },
    { label: "I love you", icon: "Heart" },
    { label: "how are you?", icon: "MessageCircle" },
    { label: "good morning", icon: "Sunrise" },
    { label: "goodnight", icon: "Moon" },
  ],
};

// Spoken instantly when chosen. Always one dwell away.
export const QUICK = [
  { label: "Yes", icon: "Check", say: "Yes." },
  { label: "No", icon: "X", say: "No." },
  { label: "Help", icon: "Siren", say: "I need help, please.", urgent: true },
];
