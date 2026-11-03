/** The anonymous username: 3 to 20 letters, digits, "_" or ".", starting with a letter or digit. Mirrors profiles_username_format in setup.sql. */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.]{2,19}$/;

/** Words that could be mistaken for staff or the app. Mirrors username_reserved() in setup.sql; the database is the real gate. */
const RESERVED = /(admin|moderator|abbhelp|support|official|cappy|staff|system|helpdesk)/i;

/** null when the name is acceptable, otherwise what to fix. */
export function usernameProblem(name: string): string | null {
  const n = name.trim();
  if (n.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
  if (n.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
  if (!USERNAME_PATTERN.test(n)) return 'Use letters, numbers, "_" or "." only, with no spaces.';
  if (RESERVED.test(n) || n.toLowerCase() === 'abb') return 'That name is not available. Please choose another.';
  return null;
}

const ADJECTIVES = ['Calm', 'Quiet', 'Brave', 'Bright', 'Gentle', 'Swift', 'Sunny', 'Steady', 'Kind', 'Curious', 'Cosy', 'Misty', 'Golden', 'Clever', 'Lucky', 'Mellow'];
const NOUNS = ['Maple', 'River', 'Lynx', 'Otter', 'Falcon', 'Willow', 'Comet', 'Meadow', 'Harbor', 'Cedar', 'Pebble', 'Sparrow', 'Lantern', 'Summit', 'Orchid', 'Breeze'];

/** A few friendly, name-free suggestions such as "CalmMaple42". */
export function suggestUsernames(count = 3, rand: () => number = Math.random): string[] {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const out = new Set<string>();
  while (out.size < count) out.add(`${pick(ADJECTIVES)}${pick(NOUNS)}${10 + Math.floor(rand() * 90)}`);
  return [...out];
}
