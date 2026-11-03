import { useState } from 'react';
import { router } from 'expo-router';
import { SetPasswordForm } from '@/components/SetPasswordForm';
import { Button, Header, Notice, Screen, Text } from '@/components/ui';
import { space } from '@/constants/brand';

/** Settings > Change password. */
export default function ChangePassword() {
  const [done, setDone] = useState(false);
  return (
    <Screen>
      <Header title="Change password" back />
      {done ? (
        <>
          <Notice text="Your password is updated. Use it the next time you sign in." icon="checkmark-circle-outline" />
          <Button label="Done" onPress={() => router.back()} style={{ marginTop: space.lg }} />
        </>
      ) : (
        <>
          <Text variant="small" style={{ marginBottom: space.lg }}>
            Pick a password only you know. You stay signed in on this device.
          </Text>
          <SetPasswordForm submitLabel="Update password" onDone={() => setDone(true)} />
        </>
      )}
    </Screen>
  );
}
