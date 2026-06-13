import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { FARM, ALERTS } from '@/constants/MockData';

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

export default function MapScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { userAlerts } = useAuth();

  // Use real alerts from context if available, fall back to mock
  const alertsToShow = userAlerts.length > 0
    ? userAlerts.map((a, i) => ({
        id: String(a.alert_id),
        lat: ALERTS[i % ALERTS.length]?.lat ?? 8.1234,
        lng: ALERTS[i % ALERTS.length]?.lng ?? 124.5678,
        detectionClass: 'Black Sigatoka',
        status: a.acknowledged ? 'resolved' : 'active',
        message: a.alert_message ?? 'Disease detected.',
        uavScanId: `Alert #${a.alert_id}`,
      }))
    : ALERTS;

  const activeCount = alertsToShow.filter((a) => a.status === 'active').length;

  const styles = makeStyles(C, isDark);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Farm Map</Text>
        <Text style={styles.headerSub}>
          {FARM.name} · {FARM.farmArea}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Map placeholder */}
        <View style={[styles.mapPlaceholder, { backgroundColor: isDark ? '#1C2B22' : '#E8F5E9', borderColor: C.border }]}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={[styles.mapPlaceholderTitle, { color: Colors.primary }]}>
            Interactive Map Coming Soon
          </Text>
          <Text style={[styles.mapPlaceholderSub, { color: C.subtext }]}>
            UAV heatmap integration is in progress.{'\n'}
            Alert pins will appear here once ready.
          </Text>
        </View>

        <View style={[styles.notice, { backgroundColor: isDark ? '#1C2B22' : '#F0FDF4', borderColor: Colors.primary }]}>
          <Text style={[styles.noticeText, { color: Colors.primary }]}>
            🛸 Full UAV heatmap integration coming soon. Detection coordinates will be plotted in real-time.
          </Text>
        </View>

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
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
    headerSub: { fontSize: 13, color: '#A7C4B0', marginTop: 2 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
    mapPlaceholder: {
      borderRadius: 16,
      borderWidth: 1,
      borderStyle: 'dashed',
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      marginBottom: 24,
      gap: 8,
    },
    mapEmoji: { fontSize: 48 },
    mapPlaceholderTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
    mapPlaceholderSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
    farmBoundary: {
      marginTop: 16,
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: 'center',
      width: '100%',
    },
    farmBoundaryLabel: { fontSize: 13, fontWeight: '700' },
    farmCoords: { fontSize: 12, marginTop: 2 },
    pinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' },
    pin: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    pinEmoji: { fontSize: 12 },
    pinText: { fontSize: 11, fontWeight: '600' },
    sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
    card: { borderRadius: 12, borderWidth: 1, marginBottom: 24, overflow: 'hidden' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    rowLabel: { fontSize: 14, fontWeight: '500' },
    rowValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
    alertPin: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
    pinHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    pinLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1 },
    pinCoord: { fontSize: 13, fontWeight: '600' },
    pinSub: { fontSize: 11, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    pinMessage: { fontSize: 13, lineHeight: 18 },
    notice: { borderRadius: 10, borderWidth: 1, padding: 14, marginTop: 4 },
    noticeText: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  });
}