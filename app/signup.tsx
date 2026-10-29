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
  Image,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const PH_MOBILE = /^(?:\+?63|0)9\d{9}$/;

export default function SignupScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const [fullName, setFullName]               = useState('');
  const [username, setUsername]               = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone]                     = useState('');
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
    if (!PH_MOBILE.test(phone.replace(/[\s\-()]/g, ''))) {
      setError('Enter a valid mobile number, e.g. 09171234567.');
      return;
    }

    setLoading(true);
    try {
      await usersAPI.create({
        full_name:    fullName.trim(),
        username:     username.trim(),
        phone_number: phone.trim(),
        password,
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
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/images/icon.bgai.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>BananaGuard AI</Text>
          <Text style={styles.appTagline}>Create your farmer account</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.formTitle, { color: C.text }]}>Sign Up</Text>
          <Text style={[styles.formSub, { color: C.subtext }]}>
            Register to receive disease alerts for your farm
          </Text>

          <Field label="FARMER NAME" icon="person-outline" required
            placeholder="e.g. Juan de la Cruz"
            value={fullName} onChangeText={(t) => { setFullName(t); clearError(); }}
            autoCapitalize="words" C={C} />

          <Field label="USERNAME" icon="at-outline" required
            placeholder="e.g. juandelacruz"
            value={username} onChangeText={(t) => { setUsername(t); clearError(); }}
            autoCapitalize="none" C={C} />

          <Field label="MOBILE NUMBER" icon="call-outline" required
            placeholder="e.g. 09171234567"
            value={phone} onChangeText={(t) => { setPhone(t); clearError(); }}
            keyboardType="phone-pad" C={C} />

          <Field label="PASSWORD" icon="lock-closed-outline" required
            placeholder="At least 8 characters"
            value={password} onChangeText={(t) => { setPassword(t); clearError(); }}
            secureTextEntry={!showPassword}
            showToggle onToggle={() => setShowPassword(!showPassword)}
            showingPassword={showPassword} C={C} />

          <Field label="CONFIRM PASSWORD" icon="lock-closed-outline" required
            placeholder="Repeat your password"
            value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); clearError(); }}
            secureTextEntry={!showPassword} C={C} />

          {error !== '' && (
            <View style={[styles.msgBox, { backgroundColor: isDark ? '#2A1010' : '#FEF2F2' }]}>
              <Ionicons name="warning-outline" size={16} color={Colors.alert} />
              <Text style={[styles.msgText, { color: Colors.alert }]}>{error}</Text>
            </View>
          )}
          {success && (
            <View style={[styles.msgBox, { backgroundColor: isDark ? '#0F2A1A' : '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.healthy} />
              <Text style={[styles.msgText, { color: Colors.healthy }]}>
                Account created! Redirecting to login...
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
            <Ionicons name="arrow-back" size={16} color={C.subtext} />
            <Text style={[styles.backBtnText, { color: C.subtext }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Reusable Field ────────────────────────────────────────────────────────────
type FieldProps = {
  label: string; icon: IconName; placeholder: string;
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
        <Ionicons name={icon} size={18} color={C.subtext} />
        <TextInput
          style={[fS.input, { color: C.text }]}
          placeholder={placeholder} placeholderTextColor={C.subtext}
          value={value} onChangeText={onChangeText}
          secureTextEntry={secureTextEntry} keyboardType={keyboardType}
          autoCapitalize={autoCapitalize} autoCorrect={false}
        />
        {showToggle && (
          <TouchableOpacity
            onPress={onToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showingPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={C.subtext}
            />
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
  input: { flex: 1, fontSize: 15, height: '100%' },
});

function makeStyles(C: typeof Colors.light, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 60 },
    topSection: { alignItems: 'center', marginBottom: 28 },
    logoWrap: {
      marginBottom: 10,
      borderRadius: 18,
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    logo: { width: 70, height: 70, borderRadius: 18 },
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
    msgBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 8, padding: 10, marginBottom: 14,
    },
    msgText: { flex: 1, fontSize: 13, fontWeight: '500' },
    submitBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, marginTop: 16, paddingVertical: 8,
    },
    backBtnText: { fontSize: 14, fontWeight: '500' },
  });
}