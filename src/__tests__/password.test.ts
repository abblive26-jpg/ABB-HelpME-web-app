import {
  PASSWORD_MAX, PASSWORD_MIN, SET_PASSWORD_FAILURE_TEXT, SIGN_IN_FAILURE_TEXT, classifySetPasswordError, classifySignInError, passwordProblem,
} from '@/lib/password';

describe('passwordProblem', () => {
  it('accepts a normal password', () => {
    expect(passwordProblem('Maple2026night')).toBeNull();
    expect(passwordProblem('a1b2c3d4')).toBeNull();
  });
  it('asks for a minimum length', () => {
    expect(passwordProblem('Ab1')).toMatch(new RegExp(String(PASSWORD_MIN)));
  });
  it('caps the length at what bcrypt reads', () => {
    expect(passwordProblem('a1'.repeat(PASSWORD_MAX))).toMatch(/at most/);
    expect(passwordProblem('a1'.repeat(PASSWORD_MAX / 2))).toBeNull();
  });
  it('needs a letter and a number', () => {
    expect(passwordProblem('abcdefghij')).toMatch(/letter and one number/);
    expect(passwordProblem('1234567890')).toMatch(/letter and one number/);
  });
  it('rejects spaces at the ends and very common passwords', () => {
    expect(passwordProblem(' Maple2026night')).toMatch(/spaces/);
    expect(passwordProblem('Password123')).toMatch(/too easy/);
    expect(passwordProblem('ABBHELPME1')).toMatch(/too easy/);
  });
});

describe('sign-in failures are told apart', () => {
  it('wrong credentials', () => {
    expect(classifySignInError({ status: 400, code: 'invalid_credentials' })).toBe('wrong');
    expect(classifySignInError({ status: 400, code: 'email_not_confirmed' })).toBe('wrong');
  });
  it('suspended, rate-limited and offline', () => {
    expect(classifySignInError({ status: 400, code: 'user_banned' })).toBe('suspended');
    expect(classifySignInError({ status: 429 })).toBe('rate_limited');
    expect(classifySignInError({ name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' })).toBe('offline');
  });
  it('anything else is a generic failure, and every case has text', () => {
    expect(classifySignInError({ status: 500 })).toBe('failed');
    for (const t of Object.values(SIGN_IN_FAILURE_TEXT)) expect(t.length).toBeGreaterThan(10);
  });
});

describe('set-password failures are told apart', () => {
  it('maps the service codes', () => {
    expect(classifySetPasswordError({ code: 'same_password' })).toBe('same');
    expect(classifySetPasswordError({ code: 'weak_password' })).toBe('weak');
    expect(classifySetPasswordError({ code: 'reauthentication_needed' })).toBe('reauth');
    expect(classifySetPasswordError({ name: 'AuthRetryableFetchError', status: 0 })).toBe('offline');
    expect(classifySetPasswordError({ status: 500 })).toBe('failed');
    for (const t of Object.values(SET_PASSWORD_FAILURE_TEXT)) expect(t.length).toBeGreaterThan(10);
  });
});
