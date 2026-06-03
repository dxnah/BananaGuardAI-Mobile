import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Switch,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
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
  },
  dark: {
    background: '#111714',
    card: '#1C2B22',
    text: '#F9F7F2',
    subtext: '#9CA3AF',
    border: '#2D3D33',
  },
};

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [soundVibration, setSoundVibration] = useState(true);
  const [receiveAlerts, setReceiveAlerts] = useState(true);

  const handleLogout = () => {
    logout();
    router.replace('/login' as any);
  };

  const styles = makeStyles(C, isDark);

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
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{currentUser?.initials ?? '??'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: C.text }]}>
              {currentUser?.name ?? 'Unknown'}
            </Text>
            <Text style={[styles.profileFarm, { color: Colors.primary }]}>
              🌱 {FARM.name}
            </Text>
            <Text style={[styles.profileRegion, { color: C.subtext }]}>
              👷 {currentUser?.role ?? 'Farm Worker'}
            </Text>
            <Text style={[styles.profileRegion, { color: C.subtext }]}>
              📍 {FARM.region}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: Colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.editBtnText, { color: Colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Farm Details Card */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>FARM DETAILS</Text>
        <View style={[styles.detailsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.detailRow, { borderColor: C.border }]}>
            <Text style={[styles.detailLabel, { color: C.subtext }]}>Farm Name</Text>
            <Text style={[styles.detailValue, { color: C.text }]}>{FARM.name}</Text>
          </View>
          <View style={[styles.detailRow, { borderColor: C.border }]}>
            <Text style={[styles.detailLabel, { color: C.subtext }]}>Coordinates</Text>
            <Text style={[styles.detailValue, { color: C.text }]}>{FARM.coordinates}</Text>
          </View>
          <View style={[styles.detailRow, { borderColor: C.border }]}>
            <Text style={[styles.detailLabel, { color: C.subtext }]}>Farm Area</Text>
            <Text style={[styles.detailValue, { color: C.text }]}>{FARM.farmArea}</Text>
          </View>
          <View style={[styles.detailRow, { borderColor: C.border, borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: C.subtext }]}>Region</Text>
            <Text style={[styles.detailValue, { color: C.text }]}>{FARM.region}</Text>
          </View>
        </View>

        {/* Notification Preferences */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>NOTIFICATIONS</Text>
        <View style={[styles.settingsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            {
              icon: '🔔',
              title: 'Receive Alerts from Admin',
              sub: 'Get notified when UAV detects disease',
              value: receiveAlerts,
              setter: setReceiveAlerts,
            },
            {
              icon: '📱',
              title: 'Push Notifications',
              sub: 'Alerts on your phone',
              value: pushNotifs,
              setter: setPushNotifs,
            },
            {
              icon: '💬',
              title: 'SMS Notifications',
              sub: 'Receive alerts via SMS',
              value: smsNotifs,
              setter: setSmsNotifs,
            },
            {
              icon: '🔊',
              title: 'Sound & Vibration',
              sub: 'Audio alerts for new detections',
              value: soundVibration,
              setter: setSoundVibration,
            },
          ].map((item, index, arr) => (
            <View
              key={item.title}
              style={[
                styles.settingRow,
                {
                  borderColor: C.border,
                  borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                },
              ]}
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

        {/* App Settings */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>APP SETTINGS</Text>
        <View style={[styles.settingsCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { icon: '✉️', title: 'Email', value: currentUser?.email ?? '' },
            { icon: '🌐', title: 'Language', value: 'English' },
            { icon: 'ℹ️', title: 'About BananaGuard AI', value: '' },
            { icon: '📋', title: 'App Version', value: 'v1.0.0' },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.settingRow,
                {
                  borderColor: C.border,
                  borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{item.icon}</Text>
                <Text style={[styles.settingTitle, { color: C.text }]}>{item.title}</Text>
              </View>
              <View style={styles.settingRight}>
                {item.value ? (
                  <Text style={[styles.settingValue, { color: C.subtext }]}>{item.value}</Text>
                ) : null}
                <Text style={[styles.chevron, { color: C.subtext }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
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
    </View>
  );
}

function makeStyles(C: typeof Colors.light, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      backgroundColor: Colors.primary,
      paddingTop: 56,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerSub: {
      fontSize: 13,
      color: '#A7C4B0',
      marginTop: 2,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      marginBottom: 24,
      gap: 12,
    },
    avatarCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    profileInfo: { flex: 1 },
    profileName: {
      fontSize: 16,
      fontWeight: '700',
    },
    profileFarm: {
      fontSize: 13,
      fontWeight: '500',
      marginTop: 2,
    },
    profileRegion: {
      fontSize: 12,
      marginTop: 2,
    },
    editBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1.5,
    },
    editBtnText: {
      fontSize: 13,
      fontWeight: '600',
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      marginBottom: 8,
    },
    detailsCard: {
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 24,
      overflow: 'hidden',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    settingsCard: {
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 24,
      overflow: 'hidden',
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      minHeight: 64,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    settingIcon: { fontSize: 20 },
    settingTitle: {
      fontSize: 14,
      fontWeight: '600',
    },
    settingSub: {
      fontSize: 12,
      marginTop: 1,
    },
    settingRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    settingValue: {
      fontSize: 13,
    },
    chevron: {
      fontSize: 20,
      fontWeight: '300',
    },
    logoutBtn: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '700',
    },
    footer: {
      textAlign: 'center',
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 8,
    },
  });
}