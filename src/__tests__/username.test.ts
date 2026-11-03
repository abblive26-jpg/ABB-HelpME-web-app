import { USERNAME_MAX, suggestUsernames, usernameProblem } from '@/lib/username';
import { authorLine } from '@/lib/profileOptions';

describe('usernameProblem', () => {
  it('accepts normal usernames', () => {
    for (const n of ['CalmMaple42', 'quiet.river', 'a_b', 'Sam99']) expect(usernameProblem(n)).toBeNull();
  });
  it('checks the length', () => {
    expect(usernameProblem('ab')).toMatch(/at least/);
    expect(usernameProblem('a'.repeat(USERNAME_MAX + 1))).toMatch(/at most/);
    expect(usernameProblem('a'.repeat(USERNAME_MAX))).toBeNull();
  });
  it('allows only letters, numbers, underscore and dot', () => {
    expect(usernameProblem('has space')).toMatch(/letters, numbers/);
    expect(usernameProblem('emoji😀name')).toMatch(/letters, numbers/);
    expect(usernameProblem('_leading')).toMatch(/letters, numbers/);
    expect(usernameProblem('a@b.com')).toMatch(/letters, numbers/);
  });
  it('blocks names that look like staff or the app', () => {
    for (const n of ['AdminTeam', 'abb', 'Support_Desk', 'cappy99', 'ABBHelpMe', 'Moderator1']) expect(usernameProblem(n)).toMatch(/not available/);
  });
});

describe('suggestUsernames', () => {
  it('returns distinct names that pass the rules', () => {
    const s = suggestUsernames(5);
    expect(new Set(s).size).toBe(5);
    for (const n of s) expect(usernameProblem(n)).toBeNull();
  });
  it('is deterministic for a given random source', () => {
    let i = 0; const seq = [0.1, 0.5, 0.3, 0.9, 0.2, 0.7];
    const rand = () => seq[i++ % seq.length];
    expect(suggestUsernames(1, rand)).toHaveLength(1);
  });
});

describe('authorLine with a username', () => {
  it('leads with the handle', () => {
    expect(authorLine({ role: 'engineer', experience: '3to5', verified: true, username: 'CalmMaple42' })).toBe('@CalmMaple42 · Engineer · 3–5 yrs at ABB');
  });
  it('shows just the handle when role and experience are hidden', () => {
    expect(authorLine({ role: 'other', experience: null, verified: true, username: 'CalmMaple42' })).toBe('@CalmMaple42');
  });
  it('is unchanged without a username', () => {
    expect(authorLine({ role: 'intern', experience: 'lt1', verified: true })).toBe('Intern · <1 yr at ABB');
  });
});
