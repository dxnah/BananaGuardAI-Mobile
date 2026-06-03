import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
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

const ALERTS = [
  {
    id: '1',
    lat: '8.1234° N',
    lng: '124.5678° E',
    detectionClass: 'Black Sigatoka',
    dateReceived: 'Jun 1, 2025 · 8:30 AM',
    status: 'active',
    uavScanId: 'UAV-20250601-001',
    message: 'Leaf removal advised immediately.',
  },
  {
    id: '2',
    lat: '8.1290° N',
    lng: '124.5701° E',
    detectionClass: 'Black Sigatoka',
    dateReceived: 'May 28, 2025 · 2:15 PM',
    status: 'resolved',
    uavScanId: 'UAV-20250528-003',
    message: 'Fungicide application advised.',
  },
  {
    id: '3',
    lat: '8.1210° N',
    lng: '124.5655° E',
    detectionClass: 'Black Sigatoka',
    dateReceived: 'May 25, 2025 · 10:00 AM',
    status: 'resolved',
    uavScanId: 'UAV-20250525-002',
    message: 'Affected leaves removed.',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getCurrentDate() {
  return new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { currentUser } = useAuth();

  const firstName = currentUser?.name.split(' ')[0] ?? 'Farmer';
  const initials = currentUser?.initials ?? '??';

  const [alerts, setAlerts] = useState(ALERTS);
  const [refreshing, setRefreshing] = useState(false);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const markResolved = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a))
    );
  };

  const styles = makeStyles(C, isDark);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}! 👋
            </Text>
            <Text style={styles.farmName}>🌱 {FARM.name}</Text>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* Summary Cards */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>FARM SUMMARY</Text>
        <View style={styles.cardsRow}>
          <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.summaryNumber, { color: C.text }]}>{alerts.length}</Text>
            <Text style={[styles.summaryTitle, { color: C.subtext }]}>Total Alerts</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: Colors.accent, borderWidth: 1.5 }]}>
            <Text style={[styles.summaryNumber, { color: Colors.accent }]}>{activeAlerts.length}</Text>
            <Text style={[styles.summaryTitle, { color: C.subtext }]}>Active</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: Colors.healthy, borderWidth: 1.5 }]}>
            <Text style={[styles.summaryNumber, { color: Colors.healthy }]}>{resolvedAlerts.length}</Text>
            <Text style={[styles.summaryTitle, { color: C.subtext }]}>Resolved</Text>
          </View>
        </View>

        {/* Farm Status Banner */}
        {activeAlerts.length === 0 ? (
          <View style={[styles.healthyBanner, { backgroundColor: isDark ? '#0F2A1A' : '#DCFCE7' }]}>
            <Text style={styles.healthyEmoji}>🌿</Text>
            <View>
              <Text style={[styles.healthyTitle, { color: Colors.healthy }]}>Your farm is healthy!</Text>
              <Text style={[styles.healthySubtext, { color: C.subtext }]}>No active alerts at the moment.</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.warningBanner, { backgroundColor: isDark ? '#2A1010' : '#FEF2F2' }]}>
            <Text style={styles.healthyEmoji}>⚠️</Text>
            <View>
              <Text style={[styles.warningTitle, { color: Colors.alert }]}>
                {activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''} detected
              </Text>
              <Text style={[styles.healthySubtext, { color: C.subtext }]}>UAV scan requires your attention.</Text>
            </View>
          </View>
        )}

        {/* Recent Alerts */}
        <Text style={[styles.sectionLabel, { color: C.subtext }]}>RECENT ALERTS</Text>

        {alerts.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              {
                backgroundColor: C.card,
                borderColor: alert.status === 'active' ? Colors.alert : C.border,
                borderLeftWidth: alert.status === 'active' ? 4 : 1,
              },
            ]}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertCoords}>
                <Text style={styles.coordsIcon}>📍</Text>
                <View>
                  <Text style={[styles.coordsText, { color: C.text }]}>
                    {alert.lat}, {alert.lng}
                  </Text>
                  <Text style={[styles.scanId, { color: C.subtext }]}>{alert.uavScanId}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      alert.status === 'active'
                        ? '#FEF2F2'
                        : isDark ? '#1F2937' : '#F3F4F6',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: alert.status === 'active' ? Colors.alert : Colors.resolved },
                  ]}
                >
                  {alert.status === 'active' ? '● ACTIVE' : '✓ RESOLVED'}
                </Text>
              </View>
            </View>

            <View style={[styles.detectionRow, { borderColor: C.border }]}>
              <View style={[styles.diseaseBadge, { backgroundColor: isDark ? '#2A1A0A' : '#FFF7ED' }]}>
                <Text style={[styles.diseaseText, { color: Colors.accent }]}>
                  🍌 {alert.detectionClass}
                </Text>
              </View>
              <Text style={[styles.dateText2, { color: C.subtext }]}>{alert.dateReceived}</Text>
            </View>

            <Text style={[styles.alertMessage, { color: C.subtext }]}>{alert.message}</Text>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.btnSecondary, { borderColor: Colors.primary }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnSecondaryText, { color: Colors.primary }]}>
                  🗺 View on Map
                </Text>
              </TouchableOpacity>
              {alert.status === 'active' && (
                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: Colors.primary }]}
                  activeOpacity={0.7}
                  onPress={() => markResolved(alert.id)}
                >
                  <Text style={styles.btnPrimaryText}>✓ Mark Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

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
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    greeting: {
      fontSize: 22,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    farmName: {
      fontSize: 14,
      color: '#A7C4B0',
      marginTop: 2,
      fontWeight: '500',
    },
    dateText: {
      fontSize: 12,
      color: '#6B9E7E',
      marginTop: 2,
    },
    avatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      marginBottom: 10,
      marginTop: 4,
    },
    cardsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
      alignItems: 'center',
    },
    summaryNumber: {
      fontSize: 28,
      fontWeight: '700',
    },
    summaryTitle: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
      textAlign: 'center',
    },
    healthyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    healthyEmoji: { fontSize: 28 },
    healthyTitle: { fontSize: 15, fontWeight: '700' },
    warningTitle: { fontSize: 15, fontWeight: '700' },
    healthySubtext: { fontSize: 12, marginTop: 2 },
    alertCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
      marginBottom: 12,
    },
    alertHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    alertCoords: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      flex: 1,
    },
    coordsIcon: { fontSize: 14, marginTop: 1 },
    coordsText: { fontSize: 13, fontWeight: '600' },
    scanId: { fontSize: 11, marginTop: 1 },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    detectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
    },
    diseaseBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    diseaseText: { fontSize: 12, fontWeight: '600' },
    dateText2: { fontSize: 11 },
    alertMessage: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
    cardActions: { flexDirection: 'row', gap: 8 },
    btnSecondary: {
      flex: 1,
      height: 40,
      borderRadius: 8,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnSecondaryText: { fontSize: 13, fontWeight: '600' },
    btnPrimary: {
      flex: 1,
      height: 40,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPrimaryText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  });
}