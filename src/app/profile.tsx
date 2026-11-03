import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { CapySays } from '@/components/Capy';
import { AuthorTag } from '@/components/community';
import { InterestPicker } from '@/components/InterestPicker';
import { Select } from '@/components/Select';
import { UsernameField, type UsernameStatus } from '@/components/UsernameField';
import { Badge, Button, Card, Field, Header, Notice, Screen, Text } from '@/components/ui';
import { space } from '@/constants/brand';
import { outfitForRole } from '@/lib/capy';
import { EXPERIENCE_OPTIONS, ROLE_OPTIONS } from '@/lib/profileOptions';
import { verifiedLabel } from '@/data/auth';
import { UsernameTakenError } from '@/data/shared';
import { usernameProblem } from '@/lib/username';
import { useApp } from '@/state/AppProvider';

export default function EditProfile() {
  const { profile, account, updateProfile } = useApp();
  const [name, setName] = useState(profile?.displayName === 'there' ? '' : profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('empty');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [role, setRole] = useState<string | null>(profile?.role ?? null);
  const [experience, setExperience] = useState<string | null>(profile?.experience ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (name.trim().length > 30) { setErr('Please keep your name within 30 characters.'); return; }
    if (username.trim() && (usernameProblem(username) || usernameStatus === 'taken')) { setErr('Please fix the username first.'); return; }
    setBusy(true); setErr(null);
    try {
      await updateProfile({ displayName: name.trim() || 'there', role, experience, interests, ...(username.trim() ? { username: username.trim() } : {}) });
      router.back();
    } catch (e) {
      setErr(e instanceof UsernameTakenError ? 'That username is already taken. Please choose another.' : 'Could not save. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Your profile" back />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.lg }}>
        <Badge label={profile?.verified ? verifiedLabel() : 'Not verified'} tone={profile?.verified ? 'ok' : 'warn'} />
        <Text variant="small" style={{ flex: 1 }} numberOfLines={2}>
          {account?.email ? `Signed in as ${account.email}` : null}
        </Text>
      </View>
      <View style={{ marginBottom: space.lg }}>
        <CapySays pose={outfitForRole(role)} message="I dress for your role. Change it and see!" size={110} motion="pop" />
      </View>
      <UsernameField value={username} onChange={setUsername} onStatus={setUsernameStatus} />
      <Field label="Display name (only you see this)" value={name} onChangeText={setName} placeholder="First name or nickname" maxLength={40} error={err} />
      <Select label="Your role" value={role} onChange={setRole} options={ROLE_OPTIONS} />
      <Select label="Experience at ABB" value={experience} onChange={setExperience} options={EXPERIENCE_OPTIONS} />
      <InterestPicker value={interests} onChange={setInterests} />

      <Card style={{ marginBottom: space.lg }}>
        <Text variant="label" style={{ marginBottom: space.sm }}>HOW OTHERS SEE YOUR POSTS (WHEN YOU CHOOSE TO SHOW IT)</Text>
        <AuthorTag author={{ role, experience, verified: !!profile?.verified, username: username.trim() || null }} />
      </Card>
      <Notice text="Changes apply to new posts. Posts you already wrote keep what was shown at the time." />
      <Notice icon="shield-checkmark-outline" text="Role bands are deliberately broad so they don't single anyone out. Choose “Other / Prefer not to say” if your role is rare in your team." />
      <Button label="Save" onPress={save} loading={busy} style={{ marginTop: space.lg }} />
    </Screen>
  );
}
