/**
 * Password rules and the plain-language messages for sign-in and for choosing a password.
 * Kept free of Supabase imports so it can be unit-tested; src/data/auth.ts calls Supabase and uses these to classify failures.
 */
export const PASSWORD_MIN = 8;
/** bcrypt, which the auth service uses, only reads the first 72 bytes. */
export const PASSWORD_MAX = 72;

const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123', 'qwertyuiop', 'abcd1234', 'iloveyou1',
  'welcome1', 'welcome123', 'admin123', 'abb12345', 'abbhelpme', 'abbhelpme1', 'letmein123',
]);

/** null when the password is acceptable, otherwise what to fix. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (pw !== pw.trim()) return 'Remove the spaces at the start or end.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  if (COMMON.has(pw.toLowerCase())) return 'That password is too easy to guess. Try something longer or less common.';
  return null;
}

export type SignInFailure = 'wrong' | 'suspended' | 'rate_limited' | 'offline' | 'failed';
export type SetPasswordFailure = 'weak' | 'same' | 'reauth' | 'offline' | 'failed';

interface AuthErrorLike { status?: number; code?: string; name?: string; message?: string }

const isOffline = (e: AuthErrorLike) =>
  e.name === 'AuthRetryableFetchError' || e.status === 0 || /network|fetch failed|failed to fetch/i.test(e.message ?? '');

export function classifySignInError(e: AuthErrorLike): SignInFailure {
  if (e.code === 'user_banned') return 'suspended';
  if (e.status === 429 || e.code === 'over_request_rate_limit') return 'rate_limited';
  if (isOffline(e)) return 'offline';
  if (e.code === 'invalid_credentials' || e.code === 'email_not_confirmed' || e.status === 400) return 'wrong';
  return 'failed';
}

export function classifySetPasswordError(e: AuthErrorLike): SetPasswordFailure {
  if (e.code === 'same_password') return 'same';
  if (e.code === 'weak_password') return 'weak';
  if (e.code === 'reauthentication_needed' || e.code === 'reauthentication_not_valid') return 'reauth';
  if (isOffline(e)) return 'offline';
  return 'failed';
}

export const SIGN_IN_FAILURE_TEXT: Record<SignInFailure, string> = {
  wrong: 'That Login ID and password do not match. Check both and try again.',
  suspended: 'This account is suspended. Please contact your administrator.',
  rate_limited: 'Too many attempts. Please wait a minute and try again.',
  offline: 'Could not reach the server. Check your internet connection and try again.',
  failed: 'Could not sign you in. Please try again.',
};

export const SET_PASSWORD_FAILURE_TEXT: Record<SetPasswordFailure, string> = {
  weak: 'That password is too easy to guess. Try something longer or less common.',
  same: 'Your new password must be different from your current one.',
  reauth: 'For your security, please sign out, sign in again, and then change your password.',
  offline: 'Could not reach the server. Check your internet connection and try again.',
  failed: 'Could not save your new password. Please try again.',
};
