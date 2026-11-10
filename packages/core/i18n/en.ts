// English strings. Keys are grouped by screen. Every key must also exist in ml.ts
// (the compiler enforces it). Use {name}-style placeholders; never build sentences by concatenation.
export const en = {
  'app.name': 'Aalthara',
  'app.tagline': 'The whole family, under one tree.',
  'language.en': 'English',
  'language.ml': 'Malayalam',
  'language.switchTo': 'Switch to {language}',
  'status.serverMissing': 'Not connected to a family server yet. This build has no server settings.',
  'status.serverReady': 'Ready to connect to the family server.',
  'status.configError': 'The server settings in this build are wrong: {problem}',
} as const;

export type MessageKey = keyof typeof en;
