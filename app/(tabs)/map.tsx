import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Animated,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { FARM, ALERTS } from '@/constants/MockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Fixed spots on the fake map (x/y are % of the map size)
const PIN_SPOTS = [
  { x: 30, y: 30 },
  { x: 68, y: 52 },
  { x: 40, y: 72 },
  { x: 78, y: 24 },
  { x: 20, y: 56 },
  { x: 60, y: 78 },
];

const PLANT_ROWS = 7;
const PLANT_COLS = 11;
const PATH_COL = 5; // column left empty for the dirt path

// Pulsing red ring behind active pins
function PulseRing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.2, duration: 1600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export default function MapScreen() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
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

  const [selectedId, setSelectedId] = useState<string | null>(
    alertsToShow.find((a) => a.status === 'active')?.id ?? alertsToShow[0]?.id ?? null,
  );
  const selected = alertsToShow.find((a) => a.id === selectedId) ?? null;

  const fieldColor = isDark ? '#14261B' : '#D6EBD9';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(27,67,50,0.10)';
  const plantColor = isDark ? '#2F7D4F' : '#4CAF6A';
  const pathColor = isDark ? '#3A3226' : '#E7D9B8';

  const styles = makeStyles(C, isDark);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Farm Map</Text>
        <Text style={styles.headerSub}>
          {FARM.name} · {FARM.farmArea}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary strip */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.dot, { backgroundColor: Colors.alert }]} />
            <Text style={[styles.summaryText, { color: C.text }]}>{activeCount} active</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.dot, { backgroundColor: Colors.healthy }]} />
            <Text style={[styles.summaryText, { color: C.text }]}>
              {alertsToShow.length - activeCount} resolved
            </Text>
          </View>
        </View>

        {/* Fake map */}
        <View style={[styles.map, { backgroundColor: fieldColor, borderColor: C.border }]}>
          {/* grid lines */}
          {[20, 40, 60, 80].map((p) => (
            <View
              key={`h${p}`}
              style={[styles.gridH, { top: `${p}%`, backgroundColor: gridColor }]}
            />
          ))}
          {[20, 40, 60, 80].map((p) => (
            <View
              key={`v${p}`}
              style={[styles.gridV, { left: `${p}%`, backgroundColor: gridColor }]}
            />
          ))}

          {/* farm boundary */}
          <View style={[styles.boundary, { borderColor: Colors.primary }]} />

          {/* dirt path */}
          <View style={[styles.path, { backgroundColor: pathColor }]} />

          {/* banana plants */}
          {Array.from({ length: PLANT_ROWS }).map((_, r) =>
            Array.from({ length: PLANT_COLS }).map((__, c) =>
              c === PATH_COL ? null : (
                <View
                  key={`p${r}-${c}`}
                  style={[
                    styles.plant,
                    {
                      backgroundColor: plantColor,
                      left: `${6 + c * 8.4}%`,
                      top: `${10 + r * 11.5}%`,
                    },
                  ]}
                />
              ),
            ),
          )}

          {/* alert pins */}
          {alertsToShow.map((a, i) => {
            const spot = PIN_SPOTS[i % PIN_SPOTS.length];
            const isActive = a.status === 'active';
            const color = isActive ? Colors.alert : Colors.healthy;
            const isSelected = a.id === selectedId;
            return (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.8}
                onPress={() => setSelectedId(a.id)}
                style={[styles.pinWrap, { left: `${spot.x}%`, top: `${spot.y}%` }]}
              >
                {isActive && <PulseRing color={color} />}
                <View
                  style={[
                    styles.pinCircle,
                    {
                      backgroundColor: color,
                      borderColor: isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.25)',
                      borderWidth: isSelected ? 3 : 2,
                    },
                  ]}
                >
                  <Text style={styles.pinGlyph}>{isActive ? '!' : '✓'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* UAV marker */}
          <Text style={styles.uav}>🛸</Text>

          {/* compass */}
          <View style={[styles.compass, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.compassN, { color: Colors.alert }]}>N</Text>
            <Text style={{ color: C.text, fontSize: 12, lineHeight: 12 }}>▲</Text>
          </View>

          {/* scale bar */}
          <View style={styles.scale}>
            <View style={[styles.scaleBar, { backgroundColor: C.text }]} />
            <Text style={[styles.scaleText, { color: C.text }]}>50 m</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: plantColor }]} />
            <Text style={[styles.legendText, { color: C.subtext }]}>Banana plants</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.alert }]} />
            <Text style={[styles.legendText, { color: C.subtext }]}>Active</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.healthy }]} />
            <Text style={[styles.legendText, { color: C.subtext }]}>Resolved</Text>
          </View>
        </View>

        {/* Selected alert details */}
        {selected ? (
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: C.card,
                borderColor: selected.status === 'active' ? Colors.alert : C.border,
              },
            ]}
          >
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailCoords, { color: C.text }]}>
                  📍 {String(selected.lat)}, {String(selected.lng)}
                </Text>
                <Text style={[styles.detailSub, { color: C.subtext }]}>
                  {selected.uavScanId}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      selected.status === 'active'
                        ? '#FEF2F2'
                        : isDark ? '#1F2937' : '#F3F4F6',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: selected.status === 'active' ? Colors.alert : Colors.resolved },
                  ]}
                >
                  {selected.status === 'active' ? '● ACTIVE' : '✓ RESOLVED'}
                </Text>
              </View>
            </View>
            <Text style={[styles.detailClass, { color: Colors.accent }]}>
              🍌 {selected.detectionClass}
            </Text>
            <Text style={[styles.detailMessage, { color: C.subtext }]}>
              {selected.message}
            </Text>
          </View>
        ) : null}

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
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
    headerSub: { fontSize: 13, color: '#A7C4B0', marginTop: 2 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

    summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    summaryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    summaryText: { fontSize: 12, fontWeight: '600' },

    // Fake map
    map: {
      height: 340,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    gridH: { position: 'absolute', left: 0, right: 0, height: 1 },
    gridV: { position: 'absolute', top: 0, bottom: 0, width: 1 },
    boundary: {
      position: 'absolute',
      top: '4%',
      bottom: '4%',
      left: '3%',
      right: '3%',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 10,
    },
    path: {
      position: 'absolute',
      top: '4%',
      bottom: '4%',
      left: '49%',
      width: '4%',
    },
    plant: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    pinWrap: {
      position: 'absolute',
      width: 36,
      height: 36,
      marginLeft: -18,
      marginTop: -18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinGlyph: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    uav: { position: 'absolute', right: 14, bottom: 34, fontSize: 22 },
    compass: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 30,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compassN: { fontSize: 10, fontWeight: '800', lineHeight: 12 },
    scale: { position: 'absolute', left: 12, bottom: 10 },
    scaleBar: { width: 56, height: 3, borderRadius: 2 },
    scaleText: { fontSize: 10, fontWeight: '600', marginTop: 2 },

    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 10,
      marginBottom: 16,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, fontWeight: '500' },

    // Selected alert card
    detailCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
    detailHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    detailCoords: { fontSize: 13, fontWeight: '600' },
    detailSub: { fontSize: 11, marginTop: 2 },
    detailClass: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    detailMessage: { fontSize: 13, lineHeight: 18 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  });
}