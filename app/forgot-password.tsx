import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { usersAPI } from "@/services/api";

const Colors = {
  primary: "#1B4332",
  accent: "#F4A522",
  alert: "#EF4444",
  light: {
    background: "#F9F7F2",
    card: "#FFFFFF",
    text: "#111714",
    subtext: "#6B7280",
    border: "#E5E7EB",
    input: "#F3F4F6",
  },
  dark: {
    background: "#111714",
    card: "#1C2B22",
    text: "#F9F7F2",
    subtext: "#9CA3AF",
    border: "#2D3D33",
    input: "#1C2B22",
  },
};

const RESEND_SECONDS = 60;

type Step = "request" | "verify";

export default function ForgotPasswordScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Countdown for "Resend code"
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Always go back to the login screen
  const goToLogin = () => {
    router.replace("/login" as any);
  };

  // Android hardware back button -> login
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goToLogin();
      return true;
    });
    return () => sub.remove();
  }, []);

  // Step 1 (and "Resend"): ask the server to text a code
  const requestCode = async () => {
    setError("");
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter your mobile number, e.g. 09171234567.");
      return;
    }

    setLoading(true);
    try {
      await usersAPI.forgotPassword(username.trim(), phone.trim());
      setStep("verify");
      setCooldown(RESEND_SECONDS);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: check the code and save the new password
  const resetPassword = async () => {
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the text message.");
      return;
    }
    if (newPw.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("The new passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await usersAPI.resetPassword({
        username: username.trim(),
        code,
        new_password: newPw,
        confirm_password: confirmPw,
      });
      Alert.alert("Password updated", "You can now sign in with your new password.", [
        { text: "Sign In", onPress: goToLogin },
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(C, isDark);
  const lastDigits = phone.replace(/\D/g, "").slice(-4);

  return (
    <KeyboardAvoidingView
      style={[styles.outer, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={Colors.primary}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backRow}
          onPress={goToLogin}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={[styles.backText, { color: Colors.primary }]}>Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.topSection}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>Forgot Password</Text>
          <Text style={styles.appTagline}>
            {step === "request"
              ? "We will text a 6-digit code to your mobile number"
              : "Enter the code and choose a new password"}
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {step === "request" ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: C.subtext }]}>USERNAME</Text>
                <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: C.border }]}>
                  <Ionicons name="person-outline" size={18} color={C.subtext} />
                  <TextInput
                    style={[styles.input, { color: C.text }]}
                    placeholder="juandlc123"
                    placeholderTextColor={C.subtext}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={(t: string) => { setUsername(t); setError(""); }}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: C.subtext }]}>MOBILE NUMBER</Text>
                <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: C.border }]}>
                  <Ionicons name="call-outline" size={18} color={C.subtext} />
                  <TextInput
                    style={[styles.input, { color: C.text }]}
                    placeholder="09171234567"
                    placeholderTextColor={C.subtext}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(t: string) => { setPhone(t); setError(""); }}
                    onSubmitEditing={requestCode}
                    returnKeyType="go"
                  />
                </View>
                <Text style={[styles.hint, { color: C.subtext }]}>Use the number you registered with.</Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.infoBox, { backgroundColor: isDark ? "#14261C" : "#ECFDF5" }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primary} />
                <Text style={[styles.infoText, { color: C.text }]}>
                  If the details match an account, a code was texted to the number ending in {lastDigits}. It works for 10 minutes.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: C.subtext }]}>6-DIGIT CODE</Text>
                <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: C.border }]}>
                  <Ionicons name="keypad-outline" size={18} color={C.subtext} />
                  <TextInput
                    style={[styles.input, styles.codeInput, { color: C.text }]}
                    placeholder="------"
                    placeholderTextColor={C.subtext}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    value={code}
                    onChangeText={(t: string) => { setCode(t.replace(/\D/g, "")); setError(""); }}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: C.subtext }]}>NEW PASSWORD</Text>
                <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: C.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={C.subtext} />
                  <TextInput
                    style={[styles.input, { color: C.text }]}
                    placeholder="At least 8 characters"
                    placeholderTextColor={C.subtext}
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                    value={newPw}
                    onChangeText={(t: string) => { setNewPw(t); setError(""); }}
                    returnKeyType="next"
                  />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={C.subtext} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: C.subtext }]}>CONFIRM NEW PASSWORD</Text>
                <View style={[styles.inputWrapper, { backgroundColor: C.input, borderColor: C.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={C.subtext} />
                  <TextInput
                    style={[styles.input, { color: C.text }]}
                    placeholder="Type it again"
                    placeholderTextColor={C.subtext}
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                    value={confirmPw}
                    onChangeText={(t: string) => { setConfirmPw(t); setError(""); }}
                    onSubmitEditing={resetPassword}
                    returnKeyType="go"
                  />
                </View>
              </View>
            </>
          )}

          {error !== "" && (
            <View style={[styles.errorBox, { backgroundColor: isDark ? "#2A1010" : "#FEF2F2" }]}>
              <Ionicons name="warning-outline" size={16} color={Colors.alert} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: loading ? "#4A7A5C" : Colors.primary }]}
            onPress={step === "request" ? requestCode : resetPassword}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>{step === "request" ? "Send Code" : "Reset Password"}</Text>
            )}
          </TouchableOpacity>

          {step === "verify" && (
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={requestCode} disabled={cooldown > 0 || loading}>
                <Text style={[styles.linkText, { color: cooldown > 0 ? C.subtext : Colors.primary }]}>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setStep("request"); setCode(""); setNewPw(""); setConfirmPw(""); setError(""); }}
              >
                <Text style={[styles.linkText, { color: Colors.primary }]}>Change number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: typeof Colors.light, isDark: boolean) {
  return StyleSheet.create({
    outer: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
    backText: { fontSize: 14, fontWeight: "600" },
    topSection: { alignItems: "center", marginBottom: 28 },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    appName: { fontSize: 24, fontWeight: "800", color: Colors.primary, letterSpacing: 0.5 },
    appTagline: {
      fontSize: 13,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 4,
      textAlign: "center",
    },
    formCard: {
      width: "100%",
      borderRadius: 20,
      borderWidth: 1,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8, marginBottom: 6 },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      borderWidth: 1.5,
      paddingHorizontal: 12,
      height: 50,
      gap: 8,
    },
    input: { flex: 1, fontSize: 15, height: "100%" },
    codeInput: { fontSize: 20, fontWeight: "700", letterSpacing: 6 },
    hint: { fontSize: 12, marginTop: 6 },
    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 8,
      padding: 10,
      marginBottom: 16,
    },
    errorText: { flex: 1, color: Colors.alert, fontSize: 13, fontWeight: "500" },
    primaryBtn: {
      height: 52,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    linksRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 18,
    },
    linkText: { fontSize: 13, fontWeight: "600" },
  });
}