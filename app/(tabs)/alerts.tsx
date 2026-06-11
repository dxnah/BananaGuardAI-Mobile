import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Animated,
} from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';

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
    message: 'Black Sigatoka detected at 8.1234° N, 124.5678° E — Leaf removal advised immediately.',
  },
  {
    id: '2',
    lat: '8.1290° N',
    lng: '124.5701° E',
    detectionClass: 'Black Sigatoka',
    dateReceived: 'May 28, 2025 · 2:15 PM',
    status: 'resolved',
    uavScanId: 'UAV-20250528-003',
    message: 'Black Sigatoka detected at 8.1290° N, 124.5701° E — Fungicide application advised.',
  },
  {
    id: '3',
    lat: '8.1210° N',
    lng: '124.5655° E',
    detectionClass: 'Black Sigatoka',
    dateReceived: 'May 25, 2025 · 10:00 AM',
    status: 'resolved',
    uavScanId: 'UAV-20250525-002',
    message: 'Black Sigatoka detected at 8.1210° N, 124.5655° E — Affected leaves removed.',
  },
  {
    id: '4',
    lat: '8.1245° N',
    lng: '124.5690° E',
    detectionClass: 'Black Sigatoka',
    dateReceived: 'May 20, 2025 · 9:45 AM',
    status: 'active',
    uavScanId: 'UAV-20250520-001',
    message: 'Black Sigatoka detected at 8.1245° N, 124.5690° E — Immediate action required.',
  },
];

type FilterType = 'all' | 'active' | 'resolved';

export default function AlertsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const [filter, setFilter] = useState<FilterType>('all');
  const [alerts, setAlerts] = useState(ALERTS);
  const [toast, setToast] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;

  const filtered = alerts.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const markResolved = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a))
    );
    showToast('✓ Marked as resolved');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(''));
  };

  const styles = makeStyles(C, isDark);

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSub}>
          {activeCount} active · {resolvedCount} resolved
        </Text>
      </View>

      {/* Push Notification Banner */}
      {activeCount > 0 && (
        <View style={[styles.pushBanner, { backgroundColor: isDark ? '#2A1010' : '#FEF2F2' }]}>
          <Text style={styles.pushIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pushTitle, { color: Colors.alert }]}>
              Alert: Black Sigatoka detected
            </Text>
            <Text style={[styles.pushSub, { color: C.subtext }]}>
              Tap any active alert to view on map.
            </Text>
          </View>
        </View>
      )}

      {/* Filter Chips */}
      <View style={[styles.filterRow, { borderBottomColor: C.border }]}>
        {(['all', 'active', 'resolved'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f && styles.filterChipActive,
              filter === f && { backgroundColor: Colors.primary },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filter === f ? '#FFFFFF' : C.subtext },
              ]}
            >
              {f === 'all' ? `All (${alerts.length})` : f === 'active' ? `Active (${activeCount})` : `Resolved (${resolvedCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alert List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No alerts here</Text>
            <Text style={[styles.emptySub, { color: C.subtext }]}>
              {filter === 'active'
                ? 'No active alerts. Your farm looks healthy!'
                : 'No resolved alerts yet.'}
            </Text>
          </View>
        ) : (
          filtered.map((alert) => (
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
              <View style={styles.cardHeader}>
                <View style={styles.coordsRow}>
                  <Text style={styles.pinIcon}>📍</Text>
                  <View>
                    <Text style={[styles.coordsText, { color: C.text }]}>
                      {alert.lat}, {alert.lng}
                    </Text>
                    <Text style={[styles.scanId, { color: C.subtext }]}>
                      {alert.uavScanId}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        alert.status === 'active'
                          ? isDark ? '#2A1010' : '#FEF2F2'
                          : isDark ? '#1F2937' : '#F3F4F6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          alert.status === 'active'
                            ? Colors.alert
                            : Colors.resolved,
                      },
                    ]}
                  >
                    {alert.status === 'active' ? '● ACTIVE' : '✓ RESOLVED'}
                  </Text>
                </View>
              </View>

              <View style={[styles.metaRow, { borderColor: C.border }]}>
                <View style={[styles.diseasePill, { backgroundColor: isDark ? '#2A1A0A' : '#FFF7ED' }]}>
                  <Text style={[styles.diseaseText, { color: Colors.accent }]}>
                    🍌 {alert.detectionClass}
                  </Text>
                </View>
                <Text style={[styles.dateText, { color: C.subtext }]}>
                  {alert.dateReceived}
                </Text>
              </View>

              <Text style={[styles.messageText, { color: C.subtext }]}>
                {alert.message}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: Colors.primary }]}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/map' as any)}
                >
                  <Text style={[styles.btnOutlineText, { color: Colors.primary }]}>
                    🗺 View on Map
                  </Text>
                </TouchableOpacity>
                {alert.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.btnFilled, { backgroundColor: Colors.primary }]}
                    activeOpacity={0.7}
                    onPress={() => markResolved(alert.id)}
                  >
                    <Text style={styles.btnFilledText}>✓ Mark Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Toast */}
      {toast !== '' && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
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
    pushBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2D3D33' : '#E5E7EB',
    },
    pushIcon: { fontSize: 20 },
    pushTitle: { fontSize: 13, fontWeight: '700' },
    pushSub: { fontSize: 12, marginTop: 1 },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: isDark ? '#1C2B22' : '#F3F4F6',
    },
    filterChipActive: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    filterChipText: { fontSize: 13, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      gap: 8,
    },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
    alertCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    coordsRow: { flexDirection: 'row', gap: 6, flex: 1 },
    pinIcon: { fontSize: 14, marginTop: 1 },
    coordsText: { fontSize: 13, fontWeight: '600' },
    scanId: { fontSize: 11, marginTop: 1 },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
    },
    diseasePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    diseaseText: { fontSize: 12, fontWeight: '600' },
    dateText: { fontSize: 11 },
    messageText: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
    actions: { flexDirection: 'row', gap: 8 },
    btnOutline: {
      flex: 1,
      height: 40,
      borderRadius: 8,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnOutlineText: { fontSize: 13, fontWeight: '600' },
    btnFilled: {
      flex: 1,
      height: 40,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnFilledText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
    toast: {
      position: 'absolute',
      bottom: 100,
      alignSelf: 'center',
      backgroundColor: Colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  });
}