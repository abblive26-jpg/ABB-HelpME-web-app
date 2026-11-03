import { useCallback, useEffect, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { confirmSignOut } from '@/components/accountActions';
import { Capy, CapySays } from '@/components/Capy';
import { OtpStep } from '@/components/OtpStep';
import { InterestPicker } from '@/components/InterestPicker';
import { SetPasswordForm } from '@/components/SetPasswordForm';
import { UsernameField, type UsernameStatus } from '@/components/UsernameField';
import { Select } from '@/components/Select';
import { Badge, BrandMark, Button, Field, Text } from '@/components/ui';
import { accents, colors, radius, shadow, space, themed } from '@/constants/brand';
import { signInWithPassword, verifiedLabel, verifier } from '@/data/auth';
import { outfitForRole } from '@/lib/capy';
import { ALLOWED_EMAIL_HINT, isAllowedEmail } from '@/lib/emailPolicy';
import { SIGN_IN_FAILURE_TEXT } from '@/lib/password';
import { UsernameTakenError } from '@/data/shared';
import { usernameProblem } from '@/lib/username';
import { EXPERIENCE_OPTIONS, ROLE_OPTIONS, roleLabel } from '@/lib/profileOptions';
import { REQUEST_FAILURE_TEXT, VerificationError, isValidEmail, type OtpChallenge } from '@/lib/verification';
import { useApp } from '@/state/AppProvider';

/**
 * landing → Login ID + password (employees, developer accounts) or email → code (emailed-code sign-in and registration) → details
 * (only for an account without a saved profile). A new account is first asked to choose its own password, whichever way it got in.
 */
type Mode = 'landing' | 'email' | 'code' | 'details' | 'password';
type Intent = 'register' | 'login';
const STEP: Record<Exclude<Mode, 'landing'>, number> = { email: 1, code: 2, details: 3, password: 1 };

export default function Welcome() {
  const {
    profile, account, signedIn, mustChangePassword, finishSignIn, createProfile, unlock, signOut,
  } = useApp();
  // Signed in but no profile yet (e.g. the app was closed mid-registration): continue at the details step.
  const [mode, setMode] = useState<Mode>(() => (account && !profile ? 'details' : 'landing'));
  const [intent, setIntent] = useState<Intent>('register');
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [lock, setLock] = useState(true);
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('empty');
  const [interests, setInterests] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = isAllowedEmail(email);
  /** A new account must choose its own password before anything else, whichever way it signed in. */
  const forcePassword = signedIn && mustChangePassword;

  const goBack = useCallback(() => {
    setError(null);
    if (mode === 'code') setMode('email');
    else if (mode === 'details') { void signOut(); setMode('landing'); } // cancel registration
    else setMode('landing');
  }, [mode, signOut]);

  // Android back steps through the flow instead of closing the app.
  useEffect(() => {
    if (mode === 'landing') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { goBack(); return true; });
    return () => sub.remove();
  }, [mode, goBack]);

  const start = (i: Intent) => { setIntent(i); setError(null); setMissing(false); setMode('email'); };

  const sendCode = async () => {
    if (!emailOk) { setMissing(true); return; }
    setBusy(true); setError(null);
    try {
      setChallenge(await verifier.requestCode(email, undefined, { createUser: intent === 'register' }));
      setMode('code');
    } catch (e) {
      setError(REQUEST_FAILURE_TEXT[e instanceof VerificationError ? e.reason : 'send_failed']);
    }
    setBusy(false);
  };

  /** Code accepted: the session (JWT) exists now. */
  const onVerified = async () => {
    try {
      const r = await finishSignIn();
      if (r === 'needs_profile') setMode('details');
      // 'ready': navigation moves on by itself.
    } catch {
      setError('Could not finish signing in. Please try again.');
      setMode('email');
    }
  };

  /** Login ID + password. */
  const passwordSignIn = async () => {
    if (!isValidEmail(email)) { setError('Enter your Login ID, which is your work email address.'); return; }
    setBusy(true); setError(null);
    const r = await signInWithPassword(email, password);
    if (!r.ok) { setError(SIGN_IN_FAILURE_TEXT[r.reason]); setBusy(false); return; }
    setPassword('');
    try {
      const res = await finishSignIn();
      if (res === 'needs_profile') setMode('details');
      // 'needs_password': the panel below takes over. 'ready': navigation moves on by itself.
    } catch { setError('Could not finish signing in. Please try again.'); }
    setBusy(false);
  };

  /** The new password is saved: carry on with the profile steps, exactly as after registering. */
  const onPasswordSet = async () => {
    try {
      const res = await finishSignIn();
      if (res === 'needs_profile') setMode('details');
    } catch { setError('Could not finish signing in. Please try again.'); }
  };

  const onCreate = async () => {
    if (name.trim().length > 30) { setError('Please keep your name within 30 characters.'); return; }
    if (usernameProblem(username) || usernameStatus === 'taken') { setMissing(true); return; }
    if (!role || !experience) { setMissing(true); return; }
    setBusy(true); setError(null);
    try {
      await createProfile({ displayName: name.trim(), lockEnabled: lock, role, experience, username: username.trim(), interests });
    } catch (e) {
      setError(e instanceof UsernameTakenError ? 'That username was just taken. Please choose another.' : 'Could not create your profile. Please try again.');
      setBusy(false);
    }
  };

  const onUnlock = async () => {
    setBusy(true); setError(null);
    const r = await unlock();
    if (!r.ok) setError(r.message ?? 'Could not unlock.');
    setBusy(false);
  };

  // Capy reacts to the form: waves first, then dresses for the chosen role.
  const firstName = name.trim();
  const capyLine = role
    ? { pose: outfitForRole(role), text: `Nice to meet you${firstName ? `, ${firstName}` : ''}! ${role === 'other' ? '' : `A fellow ${roleLabel(role)}.`}`.trim() }
    : { pose: 'hi' as const, text: firstName ? `Hi ${firstName}! What do you do at ABB?` : "You're in! Tell me a little about your work." };

  const steps = intent === 'register' || mode === 'details' ? 3 : 2;
  const emailError = missing && !emailOk
    ? (isValidEmail(email) ? REQUEST_FAILURE_TEXT.domain : 'Enter a valid email address.')
    : error;

  if (forcePassword) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: space.xl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
              <Button label="Sign out" variant="ghost" icon="log-out-outline" onPress={() => { void signOut(); setMode('landing'); }} style={{ paddingHorizontal: 0 }} />
              <View style={{ flex: 1 }} />
              <Text variant="label" style={{ color: colors.red, letterSpacing: 1 }}>FIRST SIGN-IN</Text>
            </View>
            <CapySays pose="support" message="Before we start, choose a password that only you know." size={96} motion="pop" tint={colors.bg} />
            <Text variant="title" accessibilityRole="header" style={{ marginTop: space.xl, marginBottom: space.xs }}>Choose your password</Text>
            <Text variant="small" style={{ marginBottom: space.lg }}>
              {account?.email ? `Signed in as ${account.email}. ` : ''}The starting password you were given only works once. Next you will set up your profile.
            </Text>
            <SetPasswordForm onDone={onPasswordSet} submitLabel="Save and continue" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: space.xl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {mode !== 'landing' ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.lg }}>
                <Button label={mode === 'details' ? 'Cancel' : 'Back'} variant="ghost" icon="chevron-back" onPress={goBack}
                  style={{ paddingHorizontal: 0 }} />
                <View style={{ flex: 1 }} />
                {mode === 'password' ? <Text variant="label" style={{ color: colors.red, letterSpacing: 1 }}>LOG IN</Text>
                  : <Text variant="label" style={{ color: colors.red, letterSpacing: 1 }}>STEP {STEP[mode]} OF {steps}</Text>}
              </View>

              {mode === 'email' ? (
                <View>
                  <CapySays pose="hi" message={intent === 'register' ? "Hi! I'm Cappy. Let's set you up." : 'Welcome back! Which email do you use?'}
                    size={96} motion="pop" tint={colors.bg} />
                  <Text variant="title" accessibilityRole="header" style={{ marginTop: space.xl, marginBottom: space.xs }}>
                    {intent === 'register' ? 'Create your account' : 'Log in'}
                  </Text>
                  <Text variant="small" style={{ marginBottom: space.lg }}>
                    We&apos;ll email you a 6-digit code. No password needed.
                  </Text>
                  <Field label="Email" value={email} onChangeText={(t) => { setEmail(t); setMissing(false); setError(null); }}
                    placeholder="you@outlook.com or you@abb.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                    textContentType="emailAddress" autoComplete="email" returnKeyType="send" onSubmitEditing={sendCode}
                    error={emailError} hint={`${ALLOWED_EMAIL_HINT} It's never shown on your posts.`} />
                  <Button label="Send code" icon="mail-outline" onPress={sendCode} loading={busy} />
                  <Text variant="small" style={{ textAlign: 'center', marginTop: space.lg }}>
                    {intent === 'register' ? 'Already have an account? ' : 'New here? '}
                    <Text variant="small" style={styles.link} accessibilityRole="button"
                      onPress={() => start(intent === 'register' ? 'login' : 'register')}>
                      {intent === 'register' ? 'Log in' : 'Create an account'}
                    </Text>
                  </Text>
                </View>
              ) : null}

              {mode === 'code' && challenge ? (
                <OtpStep email={email.trim()} challenge={challenge} createUser={intent === 'register'} onChallenge={setChallenge}
                  onVerified={onVerified} onChangeEmail={() => { setMode('email'); setError(null); }} />
              ) : null}

              {mode === 'password' ? (
                <View>
                  <CapySays pose="hi" message="Welcome! Log in with the Login ID you were given." size={96} motion="pop" tint={colors.bg} />
                  <Text variant="title" accessibilityRole="header" style={{ marginTop: space.xl, marginBottom: space.xs }}>Log in</Text>
                  <Text variant="small" style={{ marginBottom: space.lg }}>
                    Your Login ID is your work email address. Use the starting password from your welcome note; you will choose your own next.
                  </Text>
                  <Field label="Login ID" value={email} onChangeText={(t) => { setEmail(t); setError(null); }} placeholder="firstname.lastname@in.abb.com"
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="username" autoComplete="username" returnKeyType="next" />
                  <Field label="Password" value={password} onChangeText={(t) => { setPassword(t); setError(null); }} secureTextEntry={!showPassword}
                    autoCapitalize="none" autoCorrect={false} textContentType="password" autoComplete="current-password"
                    error={error} onSubmitEditing={passwordSignIn} returnKeyType="go" />
                  <Text variant="small" style={[styles.link, { alignSelf: 'flex-start', marginBottom: space.lg }]} accessibilityRole="button"
                    onPress={() => setShowPassword((v) => !v)}>{showPassword ? 'Hide password' : 'Show password'}</Text>
                  <Button label="Log in" onPress={passwordSignIn} loading={busy} disabled={!email.trim() || !password} />
                  <Text variant="small" style={{ textAlign: 'center', marginTop: space.lg }}>
                    Forgot your password?{' '}
                    <Text variant="small" style={styles.link} accessibilityRole="button" onPress={() => start('login')}>Email me a sign-in code</Text>
                  </Text>
                  <Text variant="small" style={{ textAlign: 'center', marginTop: space.sm }}>
                    No email access? Ask your administrator to reset your password.
                  </Text>
                </View>
              ) : null}

              {mode === 'details' ? (
                <View>
                  <CapySays pose={capyLine.pose} message={capyLine.text} size={role ? 120 : 96} motion="pop" tint={colors.bg} />
                  <Text variant="title" accessibilityRole="header" style={{ marginTop: space.xl, marginBottom: space.xs }}>Set up your profile</Text>
                  <View style={styles.verifyRow}>
                    <Badge label={verifiedLabel()} tone="ok" />
                    <Text variant="small" style={{ flex: 1 }} numberOfLines={2}>
                      {account?.email ? `Signed in as ${account.email}` : 'Email verified.'}
                    </Text>
                  </View>
                  <UsernameField value={username} onChange={(v) => { setUsername(v); setMissing(false); }} onStatus={setUsernameStatus} />
                  {missing && !username.trim() ? <Text style={[styles.error, { textAlign: 'left', marginTop: -space.sm, marginBottom: space.md }]}>Please choose a username.</Text> : null}
                  <Field label="What should we call you? (optional)" value={name} onChangeText={setName}
                    placeholder="First name or nickname" maxLength={40} autoCapitalize="words"
                    hint="Only shown to you. Posts never show your name or email." />
                  <Select label="Your role" placeholder="Choose your role" value={role} onChange={(v) => { setRole(v); setMissing(false); }}
                    options={ROLE_OPTIONS} error={missing && !role ? 'Please choose a role (or "Prefer not to say").' : null} />
                  <Select label="Experience at ABB" placeholder="Choose a range" value={experience} onChange={(v) => { setExperience(v); setMissing(false); }}
                    options={EXPERIENCE_OPTIONS} error={missing && !experience ? 'Please choose a range.' : null}
                    hint="You decide per post whether your username, role and experience are shown." />
                  <InterestPicker value={interests} onChange={setInterests} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.xl }}>
                    <View style={{ flex: 1, paddingRight: space.md }}>
                      <Text variant="h3">Lock with device authentication</Text>
                      <Text variant="small">Uses your phone&apos;s fingerprint, face, or screen lock when available.</Text>
                    </View>
                    <Switch value={lock} onValueChange={setLock} accessibilityLabel="Lock with device authentication"
                      trackColor={{ true: colors.red, false: colors.border }} />
                  </View>
                  {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
                  <Button label="Create profile" onPress={onCreate} loading={busy} />
                </View>
              ) : null}
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <BrandMark height={30} />
                <Text accessibilityRole="header" style={styles.headline}>
                  {profile ? `Welcome back${profile.displayName && profile.displayName !== 'there' ? `,\n${profile.displayName}` : ''}.` : 'Real people.\nReal conversations.'}
                </Text>
                <Text variant="body" style={{ textAlign: 'center', marginTop: space.sm }}>
                  {profile ? 'Cappy kept your seat warm.' : 'Share, support and grow — anonymously.'}
                </Text>
              </View>

              {/* Hero: Capy at the laptop, on a soft warm halo */}
              <View style={styles.heroWrap}>
                <View style={styles.halo} />
                <Capy pose="laptop" size={230} label="Cappy, the ABB Help Me mascot, working on a laptop" />
                <View style={styles.speech}>
                  <Text variant="h3" style={{ fontSize: 14 }}>{profile ? 'Good to see you again!' : 'Your safe space at work.'}</Text>
                </View>
              </View>

              <View style={{ gap: space.md }}>
                {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
                {profile && signedIn ? (
                  <>
                    <Button label="Unlock" icon="lock-open-outline" onPress={onUnlock} loading={busy} />
                    {account?.email ? <Text variant="small" style={{ textAlign: 'center' }}>Signed in as {account.email}</Text> : null}
                    <Button label="Sign out" variant="ghost" onPress={() => confirmSignOut(signOut)} />
                  </>
                ) : (
                  <>
                    <Button label="Log in" onPress={() => { setError(null); setMode('password'); }} />
                    <Text variant="small" style={{ textAlign: 'center' }}>
                      New here?{' '}
                      <Text variant="small" style={styles.link} accessibilityRole="button" onPress={() => start('register')}>Create an account</Text>
                    </Text>
                  </>
                )}
                <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                  <Ionicons name="phone-portrait-outline" size={16} color={colors.muted} style={{ marginTop: 1 }} />
                  <Text variant="small" style={{ flex: 1, fontSize: 12, lineHeight: 16 }}>
                    Your account is protected by your password. Mood check-ins and saved items are visible only to you. Posts are shared without your name or email.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themed(() => StyleSheet.create({
  headline: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.navy, textAlign: 'center', marginTop: space.xl, letterSpacing: -0.4 },
  heroWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: space.xl, minHeight: 270 },
  halo: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: accents.rose.bg },
  speech: { position: 'absolute', top: 6, right: 0, backgroundColor: colors.surface, paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: radius.lg, borderBottomLeftRadius: 4, ...shadow },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.lg, padding: space.md,
    borderRadius: radius.lg, backgroundColor: accents.green.bg },
  link: { color: colors.red, fontWeight: '700', textDecorationLine: 'underline' },
  error: { color: colors.redDark, textAlign: 'center' },
}));
