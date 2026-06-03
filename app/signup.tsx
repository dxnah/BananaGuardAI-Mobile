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
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

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

  const [fullName, setFullName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = () => {
    setError('');
    if (!fullName || !farmName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    // Mock success
    setSuccess(true);
    setTimeout(() => {
      router.replace('/login' as any);
    }, 2000);
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
        {/* Header */}
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍌</Text>
          </View>
          <Text style={styles.appName}>BananaGuard AI</Text>
          <Text style={styles.appTagline}>Create your farmer account</Text>
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.formTitle, { color: C.text }]}>Sign Up</Text>
          <Text style={[styles.formSub, { color: C.subtext }]}>
            Register to start monitoring your farm
          </Text>

          {[
            { label: 'FULL NAME', icon: '👤', value: fullName, setter: setFullName, placeholder: 'e.g. Dinah V. Caburatan', keyboard: 'default' as const },
            { label: 'FARM NAME', icon: '🌱', value: farmName, setter: setFarmName, placeholder: 'e.g. Caburatan Banana Farm', keyboard: 'default' as const },
            { label: 'EMAIL', icon: '✉️', value: email, setter: setEmail, placeholder: 'Enter your email', keyboard: 'email-address' as const },
          ].map((field) => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.subtext }]}>{field.label}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: C.border }]}>
                <Text style={styles.inputIcon}>{field.icon}</Text>
                <TextInput
                  style={[styles.input, { color: C.text }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.subtext}
                  keyboardType={field.keyboard}
                  autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'words'}
                  value={field.value}
                  onChangeText={(t) => { field.setter(t); setError(''); }}
                />
              </View>
            </View>
          ))}

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.subtext }]}>PASSWORD</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: C.border }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="Create a password"
                placeholderTextColor={C.subtext}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.subtext }]}>CONFIRM PASSWORD</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: C.border }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="Repeat your password"
                placeholderTextColor={C.subtext}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
              />
            </View>
          </View>

          {/* Error */}
          {error !== '' && (
            <View style={[styles.msgBox, { backgroundColor: isDark ? '#2A1010' : '#FEF2F2' }]}>
              <Text style={[styles.msgText, { color: Colors.alert }]}>⚠️ {error}</Text>
            </View>
          )}

          {/* Success */}
          {success && (
            <View style={[styles.msgBox, { backgroundColor: isDark ? '#0F2A1A' : '#DCFCE7' }]}>
              <Text style={[styles.msgText, { color: Colors.healthy }]}>
                ✅ Account created! Redirecting to login...
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: Colors.primary }]}
            onPress={handleSignup}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Create Account</Text>
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backBtnText, { color: C.subtext }]}>
              ← Back to Login
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: typeof Colors.light, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: 60,
    },
    topSection: {
      alignItems: 'center',
      marginBottom: 28,
    },
    logoCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    logoEmoji: { fontSize: 30 },
    appName: {
      fontSize: 22,
      fontWeight: '800',
      color: Colors.primary,
    },
    appTagline: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
    },
    formCard: {
      width: '100%',
      borderRadius: 20,
      borderWidth: 1,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    formTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    formSub: {
      fontSize: 13,
      marginBottom: 20,
    },
    inputGroup: { marginBottom: 14 },
    inputLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1.5,
      paddingHorizontal: 12,
      height: 50,
      gap: 8,
    },
    inputIcon: { fontSize: 16 },
    input: {
      flex: 1,
      fontSize: 15,
      height: '100%',
    },
    eyeIcon: { fontSize: 18 },
    msgBox: {
      borderRadius: 8,
      padding: 10,
      marginBottom: 14,
    },
    msgText: {
      fontSize: 13,
      fontWeight: '500',
    },
    submitBtn: {
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    backBtn: {
      alignItems: 'center',
      marginTop: 16,
      paddingVertical: 8,
    },
    backBtnText: {
      fontSize: 14,
      fontWeight: '500',
    },
  });
}