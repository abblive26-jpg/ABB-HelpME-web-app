import { useState } from 'react';
import { View } from 'react-native';
import { Button, Field, Text } from '@/components/ui';
import { space } from '@/constants/brand';
import { PASSWORD_MIN, SET_PASSWORD_FAILURE_TEXT, passwordProblem } from '@/lib/password';
import { useApp } from '@/state/AppProvider';

/** Choose a new password: used at first sign-in (required) and from Settings (any time). */
export function SetPasswordForm({ onDone, submitLabel = 'Save password' }: { onDone: () => void | Promise<void>; submitLabel?: string }) {
  const { changePassword } = useApp();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problem = passwordProblem(password);
  const mismatch = again.length > 0 && again !== password;

  const submit = async () => {
    setTouched(true);
    if (problem || again !== password) return;
    setBusy(true); setError(null);
    const r = await changePassword(password);
    if (!r.ok) { setError(SET_PASSWORD_FAILURE_TEXT[r.reason]); setBusy(false); return; }
    try { await onDone(); } finally { setBusy(false); }
  };

  return (
    <View>
      <Field label="New password" value={password} onChangeText={(t) => { setPassword(t); setError(null); }} secureTextEntry={!show}
        autoCapitalize="none" autoCorrect={false} textContentType="newPassword" autoComplete="new-password" returnKeyType="next"
        error={touched && problem ? problem : null} hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`} />
      <Field label="Type it again" value={again} onChangeText={(t) => { setAgain(t); setError(null); }} secureTextEntry={!show}
        autoCapitalize="none" autoCorrect={false} textContentType="newPassword" autoComplete="new-password" returnKeyType="go" onSubmitEditing={submit}
        error={mismatch || (touched && !again) ? 'The two passwords do not match.' : error} />
      <Text variant="small" accessibilityRole="button" onPress={() => setShow((v) => !v)}
        style={{ alignSelf: 'flex-start', marginBottom: space.lg, fontWeight: '700', textDecorationLine: 'underline' }}>
        {show ? 'Hide password' : 'Show password'}
      </Text>
      <Button label={submitLabel} icon="lock-closed-outline" onPress={submit} loading={busy} disabled={!password || !again} />
    </View>
  );
}
