import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Switch,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '@/services/api';
import { FARM } from '@/constants/MockData';

const Colors = {
  primary: '#1B4332',
  accent: '#F4A522',
  healthy: '#22C55E',
  alert: '#EF4444',
  resolved: '#6B7280',
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

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return fullName.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { currentUser, logout, refreshUser, refreshAlerts } = useAuth();

  // Notification toggles (local UI state)
  const [pushNotifs, setPushNotifs]       = useState(true);
  const [smsNotifs, setSmsNotifs]         = useState(false);
  const [soundVibration, setSoundVibration] = useState(true);
  const [receiveAlerts, setReceiveAlerts] = useState(true);

  // Edit modal state — pre-filled with all signup fields
  const [editVisible, setEditVisible]     = useState(false);
  const [editFullName, setEditFullName]   = useState('');
  const [editUsername, setEditUsername]   = useState('');
  const [editEmail, setEditEmail]         = useState('');
  const [editPhone, setEditPhone]         = useState('');
  const [editFarmName, setEditFarmName]   = useState('');
  const [editLocation, setEditLocation]   = useState('');
  const [editLoading, setEditLoading]     = useState(false);
  const [editError, setEditError]         = useState('');
  const [editSuccess, setEditSuccess]     = useState(false);

  // Password change state
  const [pwVisible, setPwVisible]   = useState(false);
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwError, setPwError]       = useState('');
  const [pwSuccess, setPwSuccess]   = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  const openEdit = () => {
    // Pre-fill with current user data
    setEditFullName(currentUser?.full_name ?? '');
    setEditUsername(currentUser?.username ?? '');
    setEditEmail(currentUser?.email ?? '');
    setEditPhone(currentUser?.phone_number ?? '');
    setEditFarmName(currentUser?.farm_name ?? '');
    setEditLocation(currentUser?.location ?? '');
    setEditError('');
    setEditSuccess(false);
    setEditVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editFullName.trim()) { setEditError('Full name cannot be empty.'); return; }
    if (!editUsername.trim()) { setEditError('Username cannot be empty.'); return; }
    if (!editEmail.trim() && !editPhone.trim()) {
      setEditError('At least an email or phone number is required.');
      return;
    }
    if (editEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      setEditError('Please enter a valid email address.');
      return;
    }

    setEditLoading(true);
    setEditError('');
    try {
      await usersAPI.update(currentUser!.user_id, {
        full_name:    editFullName.trim(),
        username:     editUsername.trim(),
        email:        editEmail.trim() || undefined,
        phone_number: editPhone.trim() || undefined,
        farm_name:    editFarmName.trim() || undefined,
        location:     editLocation.trim() || undefined,
      });
      setEditSuccess(true);
      await refreshUser();   // re-fetch user from backend so profile display updates
      await refreshAlerts();
      setTimeout(() => setEditVisible(false), 1200);
    } catch (e: any) {
      setEditError(e.message ?? 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const openPw = () => {
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setPwError(''); setPwSuccess(false);
    setPwVisible(true);
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!currentPw)        { setPwError('Current password is required.'); return; }
    if (!newPw)            { setPwError('New password is required.'); return; }
    if (newPw.length < 8)  { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await usersAPI.changePassword(currentUser!.user_id, {
        current_password: currentPw,
        new_password:     newPw,
        confirm_password: confirmPw,
      });
      setPwSuccess(true);
      setTimeout(() => setPwVisible(false), 1500);
    } catch (e: any) {
      setPwError(e.message ?? 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const styles = makeStyles(C, isDark);

  if (!currentUser) return null;

  const initials = getInitials(currentUser.full_name ?? currentUser.username);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSub}>Account & Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Profile Card ── */}
        <View style={[styles.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: C.text }]}>
              {currentUser.full_name}
            </Text>
            <Text style={[styles.profileFarm, { color: Colors.primary }]}>
              🌱 {currentUser.farm_name ?? FARM.name}
            </Text>
            <Text style={[styles.profileRegion, { color: C.subtext }]}>
              👷 Farm Worker
            </Text>
            <Text style={[styles.profileRegion, { color: C.subtext }]}>
              📍 {currentUser.location ?? FARM.region}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: Colors.primary }]}
            activeOpacity={0.7}
            onPress={openEdit}
          >
            <Text style={[styles.editBtnText, { color: Colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Account Details ── */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>ACCOUNT DETAILS</Text>
        <View style={[styles.detailsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { label: 'Full Name',     value: currentUser.full_name },
            { label: 'Username',      value: currentUser.username },
            { label: 'Email',         value: currentUser.email ?? '—' },
            { label: 'Phone',         value: currentUser.phone_number ?? '—' },
            { label: 'Farm Name',     value: currentUser.farm_name ?? '—' },
            { label: 'Location',      value: currentUser.location ?? '—' },
          ].map((row, index, arr) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                { borderColor: C.border, borderBottomWidth: index === arr.length - 1 ? 0 : 1 },
              ]}
            >
              <Text style={[styles.detailLabel, { color: C.subtext }]}>{row.label}</Text>
              <Text style={[styles.detailValue, { color: C.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Farm Details ── */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>FARM DETAILS</Text>
        <View style={[styles.detailsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { label: 'Farm Name',   value: currentUser.farm_name ?? FARM.name },
            { label: 'Coordinates', value: FARM.coordinates },
            { label: 'Farm Area',   value: FARM.farmArea },
            { label: 'Region',      value: currentUser.location ?? FARM.region },
          ].map((row, index, arr) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                { borderColor: C.border, borderBottomWidth: index === arr.length - 1 ? 0 : 1 },
              ]}
            >
              <Text style={[styles.detailLabel, { color: C.subtext }]}>{row.label}</Text>
              <Text style={[styles.detailValue, { color: C.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Notifications ── */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>NOTIFICATIONS</Text>
        <View style={[styles.settingsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { icon: '🔔', title: 'Receive Alerts from Admin', sub: 'Get notified when UAV detects disease', value: receiveAlerts, setter: setReceiveAlerts },
            { icon: '📱', title: 'Push Notifications',        sub: 'Alerts on your phone',                  value: pushNotifs,    setter: setPushNotifs },
            { icon: '💬', title: 'SMS Notifications',         sub: 'Receive alerts via SMS',                value: smsNotifs,     setter: setSmsNotifs },
            { icon: '🔊', title: 'Sound & Vibration',         sub: 'Audio alerts for new detections',       value: soundVibration,setter: setSoundVibration },
          ].map((item, index, arr) => (
            <View
              key={item.title}
              style={[styles.settingRow, { borderColor: C.border, borderBottomWidth: index === arr.length - 1 ? 0 : 1 }]}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{item.icon}</Text>
                <View>
                  <Text style={[styles.settingTitle, { color: C.text }]}>{item.title}</Text>
                  <Text style={[styles.settingSub, { color: C.subtext }]}>{item.sub}</Text>
                </View>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.setter}
                trackColor={{ false: C.border, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* ── App Settings ── */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>APP SETTINGS</Text>
        <View style={[styles.settingsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { icon: '✉️', title: 'Email',                  value: currentUser.email ?? '—' },
            { icon: '📞', title: 'Phone',                  value: currentUser.phone_number ?? '—' },
            { icon: '🌐', title: 'Language',               value: 'English' },
            { icon: 'ℹ️', title: 'About BananaGuard AI',  value: '' },
            { icon: '📋', title: 'App Version',            value: 'v1.0.0' },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.settingRow, { borderColor: C.border, borderBottomWidth: index === arr.length - 1 ? 0 : 1 }]}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{item.icon}</Text>
                <Text style={[styles.settingTitle, { color: C.text }]}>{item.title}</Text>
              </View>
              <View style={styles.settingRight}>
                {item.value ? <Text style={[styles.settingValue, { color: C.subtext }]}>{item.value}</Text> : null}
                <Text style={[styles.chevron, { color: C.subtext }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Member Since ── */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>MEMBERSHIP</Text>
        <View style={[styles.detailsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.detailRow, { borderColor: C.border, borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: C.subtext }]}>Member Since</Text>
            <Text style={[styles.detailValue, { color: C.text }]}>
              {currentUser.created_at
                ? new Date(currentUser.created_at).toLocaleDateString('en-PH', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })
                : '—'}
            </Text>
          </View>
        </View>

        {/* ── Change Password ── */}
        <TouchableOpacity
          style={[styles.changePwBtn, { borderColor: Colors.primary }]}
          activeOpacity={0.7}
          onPress={openPw}
        >
          <Text style={styles.changePwIcon}>🔐</Text>
          <Text style={[styles.changePwText, { color: Colors.primary }]}>Change Password</Text>
        </TouchableOpacity>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: Colors.alert }]}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: Colors.alert }]}>🚪 Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: C.subtext }]}>
          BananaGuard AI · Powered by UAV Technology{'\n'}
          Bukidnon, Philippines 🇵🇭
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal visible={pwVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: C.card }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Change Password</Text>

            {[
              { label: 'CURRENT PASSWORD', value: currentPw, setter: setCurrentPw, placeholder: 'Enter current password' },
              { label: 'NEW PASSWORD',     value: newPw,     setter: setNewPw,     placeholder: 'At least 8 characters' },
              { label: 'CONFIRM PASSWORD', value: confirmPw, setter: setConfirmPw, placeholder: 'Repeat new password' },
            ].map((f) => (
              <View key={f.label} style={mfS.group}>
                <Text style={[mfS.label, { color: C.subtext }]}>{f.label}</Text>
                <View style={[mfS.wrapper, { backgroundColor: C.input, borderColor: C.border }]}>
                  <Text style={mfS.icon}>🔒</Text>
                  <TextInput
                    style={[mfS.input, { color: C.text }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={C.subtext}
                    secureTextEntry={!showPw}
                    value={f.value}
                    onChangeText={(t) => { f.setter(t); setPwError(''); setPwSuccess(false); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ marginBottom: 12 }}>
              <Text style={[styles.feedbackText, { color: C.subtext }]}>
                {showPw ? '🙈 Hide passwords' : '👁️ Show passwords'}
              </Text>
            </TouchableOpacity>

            {pwError !== '' && (
              <Text style={[styles.feedbackText, { color: Colors.alert }]}>⚠️ {pwError}</Text>
            )}
            {pwSuccess && (
              <Text style={[styles.feedbackText, { color: Colors.healthy }]}>✅ Password updated!</Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: C.border, borderWidth: 1.5 }]}
                onPress={() => setPwVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnText, { color: C.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.primary }]}
                onPress={handleChangePassword}
                activeOpacity={0.8}
                disabled={pwLoading}
              >
                {pwLoading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Update</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: C.card }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Edit Profile</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Account Info */}
              <Text style={[styles.modalSection, { color: C.subtext }]}>ACCOUNT INFO</Text>
              {[
                { label: 'FULL NAME',    icon: '👤', value: editFullName, setter: setEditFullName, placeholder: 'Full name',        caps: 'words'  as const },
                { label: 'USERNAME',     icon: '🏷️', value: editUsername, setter: setEditUsername, placeholder: 'Username',         caps: 'none'   as const },
              ].map((f) => (
                <ModalField key={f.label} {...f} C={C} onEdit={() => { setEditError(''); setEditSuccess(false); }} />
              ))}

              {/* Contact */}
              <Text style={[styles.modalSection, { color: C.subtext, marginTop: 8 }]}>
                CONTACT {''}
                <Text style={{ fontWeight: '400' }}>(email or phone required)</Text>
              </Text>
              {[
                { label: 'EMAIL',        icon: '✉️', value: editEmail,    setter: setEditEmail,    placeholder: 'Email address',    caps: 'none'   as const, keyboard: 'email-address' as const },
                { label: 'PHONE NUMBER', icon: '📞', value: editPhone,    setter: setEditPhone,    placeholder: 'e.g. 09171234567', caps: 'none'   as const, keyboard: 'phone-pad'    as const },
              ].map((f) => (
                <ModalField key={f.label} {...f} C={C} onEdit={() => { setEditError(''); setEditSuccess(false); }} />
              ))}

              {/* Farm Info */}
              <Text style={[styles.modalSection, { color: C.subtext, marginTop: 8 }]}>
                FARM INFO {''}
                <Text style={{ fontWeight: '400' }}>(optional)</Text>
              </Text>
              {[
                { label: 'FARM NAME',    icon: '🌱', value: editFarmName,  setter: setEditFarmName,  placeholder: 'Farm name',       caps: 'words'  as const },
                { label: 'LOCATION',     icon: '📍', value: editLocation,  setter: setEditLocation,  placeholder: 'Location',        caps: 'words'  as const },
              ].map((f) => (
                <ModalField key={f.label} {...f} C={C} onEdit={() => { setEditError(''); setEditSuccess(false); }} />
              ))}

              {editError !== '' && (
                <Text style={[styles.feedbackText, { color: Colors.alert }]}>⚠️ {editError}</Text>
              )}
              {editSuccess && (
                <Text style={[styles.feedbackText, { color: Colors.healthy }]}>✅ Profile updated!</Text>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { borderColor: C.border, borderWidth: 1.5 }]}
                  onPress={() => setEditVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalBtnText, { color: C.subtext }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.primary }]}
                  onPress={handleSaveEdit}
                  activeOpacity={0.8}
                  disabled={editLoading}
                >
                  {editLoading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Reusable modal input field ────────────────────────────────────────────────
type ModalFieldProps = {
  label: string; icon: string; value: string;
  setter: (t: string) => void; placeholder: string;
  caps?: 'none' | 'words' | 'sentences' | 'characters';
  keyboard?: 'default' | 'email-address' | 'phone-pad';
  C: typeof Colors.light;
  onEdit: () => void;
};

function ModalField({ label, icon, value, setter, placeholder, caps = 'sentences', keyboard = 'default', C, onEdit }: ModalFieldProps) {
  return (
    <View style={mfS.group}>
      <Text style={[mfS.label, { color: C.subtext }]}>{label}</Text>
      <View style={[mfS.wrapper, { backgroundColor: C.input, borderColor: C.border }]}>
        <Text style={mfS.icon}>{icon}</Text>
        <TextInput
          style={[mfS.input, { color: C.text }]}
          placeholder={placeholder} placeholderTextColor={C.subtext}
          value={value} onChangeText={(t) => { setter(t); onEdit(); }}
          autoCapitalize={caps} keyboardType={keyboard} autoCorrect={false}
        />
      </View>
    </View>
  );
}

const mfS = StyleSheet.create({
  group: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
  wrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, height: 50, gap: 8 },
  icon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, height: '100%' },
});

function makeStyles(C: typeof Colors.light, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
    headerSub: { fontSize: 13, color: '#A7C4B0', marginTop: 2 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
    profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 12 },
    avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 16, fontWeight: '700' },
    profileFarm: { fontSize: 13, fontWeight: '500', marginTop: 2 },
    profileRegion: { fontSize: 12, marginTop: 2 },
    editBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5 },
    editBtnText: { fontSize: 13, fontWeight: '600' },
    sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
    detailsCard: { borderRadius: 12, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    detailLabel: { fontSize: 14, fontWeight: '500' },
    detailValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
    settingsCard: { borderRadius: 12, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, minHeight: 64 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    settingIcon: { fontSize: 20 },
    settingTitle: { fontSize: 14, fontWeight: '600' },
    settingSub: { fontSize: 12, marginTop: 1 },
    settingRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    settingValue: { fontSize: 13 },
    chevron: { fontSize: 20, fontWeight: '300' },
    logoutBtn: { height: 52, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    logoutText: { fontSize: 15, fontWeight: '700' },
    footer: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginBottom: 8 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    modalSection: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
    feedbackText: { fontSize: 13, fontWeight: '500', marginBottom: 12 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    modalBtnText: { fontSize: 15, fontWeight: '700' },
    changePwBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: 12,
      borderWidth: 1.5,
      marginBottom: 16,
      gap: 8,
    },
    changePwIcon: { fontSize: 18 },
    changePwText: { fontSize: 15, fontWeight: '700' },
  });
}