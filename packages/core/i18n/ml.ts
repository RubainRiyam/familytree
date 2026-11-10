import type { MessageKey } from './en.ts';

// Malayalam strings. Draft wording until a native speaker reviews it: every key listed in
// ml.todo.json is unreviewed and must be reviewed before release.
export const ml: Record<MessageKey, string> = {
  'app.name': 'ആൽത്തറ',
  'app.tagline': 'കുടുംബം മുഴുവൻ, ഒരു തണലിൽ.',
  'language.en': 'ഇംഗ്ലീഷ്',
  'language.ml': 'മലയാളം',
  'language.switchTo': '{language} ആക്കുക',
  'status.serverMissing': 'ഇതുവരെ കുടുംബ സെർവറുമായി ബന്ധിപ്പിച്ചിട്ടില്ല. ഈ പതിപ്പിൽ സെർവർ ക്രമീകരണങ്ങളില്ല.',
  'status.serverReady': 'കുടുംബ സെർവറുമായി ബന്ധിപ്പിക്കാൻ തയ്യാർ.',
  'status.configError': 'ഈ പതിപ്പിലെ സെർവർ ക്രമീകരണങ്ങൾ തെറ്റാണ്: {problem}',
};
