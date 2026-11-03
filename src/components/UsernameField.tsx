import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Field, Text } from '@/components/ui';
import { colors, space } from '@/constants/brand';
import { suggestUsernames, usernameProblem } from '@/lib/username';
import { useApp } from '@/state/AppProvider';

export type UsernameStatus = 'empty' | 'invalid' | 'checking' | 'ok' | 'taken' | 'unknown';

/** The anonymous username, with a friendly suggestion and a live "is it free?" check. */
export function UsernameField({ value, onChange, onStatus, label = 'Anonymous username' }: {
  value: string; onChange: (v: string) => void; onStatus?: (s: UsernameStatus) => void; label?: string;
}) {
  const { repo } = useApp();
  const [status, setStatus] = useState<UsernameStatus>('empty');
  const problem = value.trim() ? usernameProblem(value) : null;

  useEffect(() => {
    let alive = true;
    const set = (s: UsernameStatus) => { if (alive) { setStatus(s); onStatus?.(s); } };
    if (!value.trim()) { set('empty'); return () => { alive = false; }; }
    if (usernameProblem(value)) { set('invalid'); return () => { alive = false; }; }
    set('checking');
    const t = setTimeout(() => {
      repo.isUsernameAvailable(value.trim()).then((free) => set(free ? 'ok' : 'taken')).catch(() => set('unknown'));
    }, 450);
    return () => { alive = false; clearTimeout(t); };
    // onStatus is intentionally left out: callers pass an inline function and only the value should retrigger the check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, repo]);

  const error = problem ?? (status === 'taken' ? 'That username is already taken. Try another.' : null);
  const hint = status === 'ok' ? 'Available.' : status === 'checking' ? 'Checking…'
    : status === 'unknown' ? 'Could not check right now; we will check again when you save.'
      : 'Unique, and not your name. Shown only where you choose to show who you are.';

  return (
    <View>
      <Field label={label} value={value} onChangeText={(t) => onChange(t.replace(/\s/g, ''))} placeholder="e.g. CalmMaple42"
        autoCapitalize="none" autoCorrect={false} maxLength={20} error={error} hint={hint} />
      <Text variant="small" accessibilityRole="button" onPress={() => onChange(suggestUsernames(1)[0])}
        style={{ alignSelf: 'flex-start', marginTop: -space.sm, marginBottom: space.lg, color: colors.red, fontWeight: '700', textDecorationLine: 'underline' }}>
        Suggest one
      </Text>
    </View>
  );
}
