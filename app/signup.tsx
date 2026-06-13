import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { usersAPI } from '@/services/api';

const Colors = {
  primary: '#1B4332',
  accent: '#F4A522',
  alert: '#EF4444',
  healthy: '#22C55E',
  light: {
    background: '#F9F7F2',
    card: '#FFFFFF',
    text: '#111714',
    subtext: '#6B7280',
    border: '#E5E7EB',
    input: '#F3F4F6',
  },
  dark: {
    background: '#111714',
    card: '#1C2B22',
    text: '#F9F7F2',
    subtext: '#9CA3AF',
    border: '#2D3D33',
    input: '#1C2B22',
  },
};

export default function SignupScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const [fullName, setFullName]               = useState('');
  const [username, setUsername]               = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail]                     = useState('');
  const [phone, setPhone]                     = useState('');
  const [farmName, setFarmName]               = useState('');
  const [location, setLocation]               = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState(false);
  const [loading, setLoading]                 = useState(false);

  const clearError = () => setError('');

  const handleSignup = async () => {
    setError('');

    if (!fullName.trim())        { setError('Full name is required.'); return; }
    if (!username.trim())        { setError('Username is required.'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!password)               { setError('Password is required.'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!email.trim() && !phone.trim()) {
      setError('Please provide at least an email or phone number.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await usersAPI.create({
        full_name:    fullName.trim(),
        username:     username.trim(),
        password,
        email:        email.trim() || undefined,
        phone_number: phone.trim() || undefined,
        farm_name:    farmName.trim() || undefined,
        location:     location.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.replace('/login' as any), 2000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(C, isDark);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.primary}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍌</Text>
          </View>
          <Text style={styles.appName}>BananaGuard AI</Text>
          <Text style={styles.appTagline}>Create your farmer account</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.formTitle, { color: C.text }]}>Sign Up</Text>
          <Text style={[styles.formSub, { color: C.subtext }]}>
            Register to start monitoring your farm
          </Text>

          {/* ── Account Info ── */}
          <Text style={[styles.groupHeader, { color: C.subtext }]}>ACCOUNT INFO</Text>

          <Field label="FULL NAME" icon="👤" required
            placeholder="e.g. Juan de la Cruz"
            value={fullName} onChangeText={(t) => { setFullName(t); clearError(); }}
            C={C} />

          <Field label="USERNAME" icon="🏷️" required
            placeholder="e.g. juandelacruz"
            value={username} onChangeText={(t) => { setUsername(t); clearError(); }}
            autoCapitalize="none" C={C} />

          <Field label="PASSWORD" icon="🔒" required
            placeholder="At least 8 characters"
            value={password} onChangeText={(t) => { setPassword(t); clearError(); }}
            secureTextEntry={!showPassword}
            showToggle onToggle={() => setShowPassword(!showPassword)}
            showingPassword={showPassword} C={C} />

          <Field label="CONFIRM PASSWORD" icon="🔒" required
            placeholder="Repeat your password"
            value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
            secureTextEntry={!showPassword} C={C} />

          {/* ── Contact ── */}
          <Text style={[styles.groupHeader, { color: C.subtext, marginTop: 8 }]}>
            CONTACT {''}
            <Text style={styles.groupNote}>(email or phone required)</Text>
          </Text>

          <Field label="EMAIL" icon="✉️"
            placeholder="e.g. juandelacruz@gmail.com"
            value={email} onChangeText={(t) => { setEmail(t); clearError(); }}
            keyboardType="email-address" autoCapitalize="none" C={C} />

          <Field label="PHONE NUMBER" icon="📞"
            placeholder="e.g. 09171234567"
            value={phone} onChangeText={(t) => { setPhone(t); clearError(); }}
            keyboardType="phone-pad" C={C} />

          {/* ── Farm Info ── */}
          <Text style={[styles.groupHeader, { color: C.subtext, marginTop: 8 }]}>
            FARM INFO {''}
            <Text style={styles.groupNote}>(optional)</Text>
          </Text>

          <Field label="FARM NAME" icon="🌱"
            placeholder="e.g. Banana Farm"
            value={farmName} onChangeText={(t) => { setFarmName(t); clearError(); }}
            autoCapitalize="words" C={C} />

          <Field label="LOCATION" icon="📍"
            placeholder="e.g. Talakag, Bukidnon"
            value={location} onChangeText={(t) => { setLocation(t); clearError(); }}
            autoCapitalize="words" C={C} />

          {error !== '' && (
            <View style={[styles.msgBox, { backgroundColor: isDark ? '#2A1010' : '#FEF2F2' }]}>
              <Text style={[styles.msgText, { color: Colors.alert }]}>⚠️ {error}</Text>
            </View>
          )}
          {success && (
            <View style={[styles.msgBox, { backgroundColor: isDark ? '#0F2A1A' : '#DCFCE7' }]}>
              <Text style={[styles.msgText, { color: Colors.healthy }]}>
                ✅ Account created! Redirecting to login...
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: loading ? '#4A7A5C' : Colors.primary }]}
            onPress={handleSignup}
            activeOpacity={0.8}
            disabled={loading || success}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backBtnText, { color: C.subtext }]}>← Back to Login</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Reusable Field ────────────────────────────────────────────────────────────
type FieldProps = {
  label: string; icon: string; placeholder: string;
  value: string; onChangeText: (t: string) => void;
  required?: boolean; secureTextEntry?: boolean;
  showToggle?: boolean; onToggle?: () => void; showingPassword?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  C: typeof Colors.light;
};

function Field({ label, icon, placeholder, value, onChangeText, required,
  secureTextEntry, showToggle, onToggle, showingPassword,
  keyboardType = 'default', autoCapitalize = 'sentences', C }: FieldProps) {
  return (
    <View style={fS.group}>
      <Text style={[fS.label, { color: C.subtext }]}>
        {label}{required && <Text style={{ color: Colors.alert }}> *</Text>}
      </Text>
      <View style={[fS.wrapper, { backgroundColor: C.input, borderColor: C.border }]}>
        <Text style={fS.icon}>{icon}</Text>
        <TextInput
          style={[fS.input, { color: C.text }]}
          placeholder={placeholder} placeholderTextColor={C.subtext}
          value={value} onChangeText={onChangeText}
          secureTextEntry={secureTextEntry} keyboardType={keyboardType}
          autoCapitalize={autoCapitalize} autoCorrect={false}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle}>
            <Text style={fS.eye}>{showingPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const fS = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
  wrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 12, height: 50, gap: 8,
  },
  icon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  eye: { fontSize: 18 },
});

function makeStyles(C: typeof Colors.light, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 60 },
    topSection: { alignItems: 'center', marginBottom: 28 },
    logoCircle: {
      width: 70, height: 70, borderRadius: 35,
      backgroundColor: Colors.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    logoEmoji: { fontSize: 30 },
    appName: { fontSize: 22, fontWeight: '800', color: Colors.primary },
    appTagline: { fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 4 },
    formCard: {
      width: '100%', borderRadius: 20, borderWidth: 1, padding: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    },
    formTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    formSub: { fontSize: 13, marginBottom: 20 },
    groupHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginTop: 4 },
    groupNote: { fontSize: 11, fontWeight: '400', color: '#9CA3AF' },
    msgBox: { borderRadius: 8, padding: 10, marginBottom: 14 },
    msgText: { fontSize: 13, fontWeight: '500' },
    submitBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    backBtn: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
    backBtnText: { fontSize: 14, fontWeight: '500' },
  });
}