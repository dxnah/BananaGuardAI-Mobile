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
  Animated,
} from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';

const Colors = {
  primary: '#1B4332',
  accent: '#F4A522',
  alert: '#EF4444',
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

export default function LoginScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = () => {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      shake();
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        setLoading(false);
        router.replace('/(tabs)' as any);
      } else {
        setLoading(false);
        setError('Invalid email or password. Please try again.');
        shake();
      }
    }, 1000);
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

      <View style={styles.topSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🍌</Text>
        </View>
        <Text style={styles.appName}>BananaGuard AI</Text>
        <Text style={styles.appTagline}>Black Sigatoka Disease Detection</Text>
      </View>

      <Animated.View
        style={[
          styles.formCard,
          { backgroundColor: C.card, borderColor: C.border },
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <Text style={[styles.formTitle, { color: C.text }]}>Farmer Login</Text>
        <Text style={[styles.formSub, { color: C.subtext }]}>
          Sign in to monitor your farm
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: C.subtext }]}>EMAIL</Text>
          <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: error ? Colors.alert : C.border }]}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={[styles.input, { color: C.text }]}
              placeholder="Enter your email"
              placeholderTextColor={C.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: C.subtext }]}>PASSWORD</Text>
          <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: error ? Colors.alert : C.border }]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: C.text }]}
              placeholder="Enter your password"
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

        {error !== '' && (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#2A1010' : '#FEF2F2' }]}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: loading ? '#4A7A5C' : Colors.primary }]}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
          <Text style={[styles.dividerText, { color: C.subtext }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
        </View>

        <TouchableOpacity
          style={[styles.signupBtn, { borderColor: Colors.primary }]}
          onPress={() => router.push('/signup' as any)}
          activeOpacity={0.8}
        >
          <Text style={[styles.signupBtnText, { color: Colors.primary }]}>
            Create New Account
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.footer, { color: C.subtext }]}>
        Bukidnon, Philippines 🇵🇭 · UAV-Powered
      </Text>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: typeof Colors.light, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    topSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    logoEmoji: { fontSize: 36 },
    appName: {
      fontSize: 26,
      fontWeight: '800',
      color: Colors.primary,
      letterSpacing: 0.5,
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
      marginBottom: 24,
    },
    inputGroup: { marginBottom: 16 },
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
    errorBox: {
      borderRadius: 8,
      padding: 10,
      marginBottom: 16,
    },
    errorText: {
      color: Colors.alert,
      fontSize: 13,
      fontWeight: '500',
    },
    loginBtn: {
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    loginBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      gap: 10,
    },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { fontSize: 13 },
    signupBtn: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    signupBtnText: {
      fontSize: 15,
      fontWeight: '600',
    },
    footer: {
      fontSize: 12,
      marginTop: 24,
      textAlign: 'center',
    },
  });
}