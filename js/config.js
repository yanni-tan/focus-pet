// Focus Pet — configurable constants (§9 of the PRD).
// Everything tunable about the emotional loop lives here.

export const PAUSE_STATE_THRESHOLDS_MS = {
  waiting: 0, // 0:00
  curious: 30_000, // 0:30
  concerned: 90_000, // 1:30
  impatient: 180_000, // 3:00
  upset: 300_000, // 5:00  ← anger trigger (per spec)
  sulking: 900_000, // 15:00 (optional)
};

// Ordered high→low so we can find the current state by first threshold met.
export const PAUSE_STATE_ORDER = ['sulking', 'upset', 'impatient', 'concerned', 'curious', 'waiting'];

export const DURATION_PRESETS_MIN = [15, 25, 45, 60];
export const CUSTOM_DURATION_RANGE_MIN = [5, 120];
export const TICK_MS = 500;

export const DEFAULTS = {
  soundEnabled: false,
  hapticsEnabled: true,
  reducedMotion: 'system', // 'system' | 'on' | 'off'
  theme: 'system', // 'system' | 'light' | 'dark'
  notificationsEnabled: false,
  defaultDurationMin: 25,
};

// Species / variant catalogue used by onboarding and the Companion art.
export const SPECIES = {
  cat: {
    label: 'Cat',
    variants: [
      { id: 'orange-tabby', label: 'Orange tabby', coat: '#e8955b', belly: '#f7ddc4', accent: '#c96f38' },
      { id: 'grey', label: 'Grey', coat: '#9aa4ad', belly: '#e6ebef', accent: '#6f7a84' },
      { id: 'black', label: 'Midnight', coat: '#4a4a52', belly: '#6d6d78', accent: '#2c2c33' },
      { id: 'calico', label: 'Calico', coat: '#f0d9b5', belly: '#fff3e2', accent: '#c47a45' },
    ],
  },
  dog: {
    label: 'Dog',
    variants: [
      { id: 'golden', label: 'Golden', coat: '#e6b565', belly: '#f7e6c4', accent: '#c8924a' },
      { id: 'brown', label: 'Chocolate', coat: '#8a5a3c', belly: '#c49a7a', accent: '#603c26' },
      { id: 'cream', label: 'Cream', coat: '#f0e0c8', belly: '#fff7ea', accent: '#cbb28e' },
      { id: 'grey', label: 'Husky grey', coat: '#8f9aa4', belly: '#eef2f5', accent: '#5f6a74' },
    ],
  },
};

export const ACTIVITIES = {
  painting: {
    label: 'Painting',
    verb: 'painting',
    artifactNoun: 'painting',
    emoji: '🎨',
    blurb: 'Fills a canvas as you focus. Finished works go to your gallery.',
  },
  gardening: {
    label: 'Gardening',
    verb: 'gardening',
    artifactNoun: 'plant',
    emoji: '🌱',
    blurb: 'Grows a plant from sprout to bloom. Grown plants join your garden.',
  },
};

// Copy shown in the companion's speech bubble per emotional state.
// {name} is replaced with the pet's name.
export const STATE_COPY = {
  idle: 'Ready when you are.',
  focusing: '',
  waiting: 'Take your time 🐾',
  curious: 'Everything ok?',
  concerned: 'Coming back soon?',
  impatient: "I'm still here…",
  upset: 'Hey! Come back and focus with me!',
  sulking: "I'll be right here…",
  celebrating: 'We did it! 🎉',
  farewell: 'See you soon!',
};
