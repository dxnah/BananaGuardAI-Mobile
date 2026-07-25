import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Animated,
  ScrollView,
  Modal,
} from 'react-native';
import MapView, { Marker, Polygon, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useState, useRef, useEffect } from 'react';

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

const FARM_CENTER = { latitude: 8.1240, longitude: 124.5680 };

const FARM_POLYGON = [
  { latitude: 8.1210, longitude: 124.5650 },
  { latitude: 8.1270, longitude: 124.5650 },
  { latitude: 8.1270, longitude: 124.5710 },
  { latitude: 8.1210, longitude: 124.5710 },
];

const ALERT_ZONES = [
  {
    id: '1',
    latitude: 8.1234,
    longitude: 124.5678,
    detectionClass: 'Black Sigatoka',
    dateReceived: 'Jun 1, 2025 · 8:30 AM',
    status: 'active',
    uavScanId: 'UAV-20250601-001',
    message: 'Leaf removal advised immediately.',
  },
  {
    id: '2',
    latitude: 8.1250,
    longitude: 124.5695,
    detectionClass: 'Black Sigatoka',
    dateReceived: 'May 28, 2025 · 2:15 PM',
    status: 'resolved',
    uavScanId: 'UAV-20250528-003',
    message: 'Fungicide application advised.',
  },
  {
    id: '3',
    latitude: 8.1220,
    longitude: 124.5660,
    detectionClass: 'Black Sigatoka',
    dateReceived: 'May 25, 2025 · 10:00 AM',
    status: 'active',
    uavScanId: 'UAV-20250525-002',
    message: 'Immediate action required.',
  },
];

export default function MapScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const [zones, setZones] = useState(ALERT_ZONES);
  const [selectedZone, setSelectedZone] = useState<typeof ALERT_ZONES[0] | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [toast, setToast] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(''));
  };

  const markResolved = (id: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, status: 'resolved' } : z))
    );
    setShowSheet(false);
    setSelectedZone(null);
    showToast('✓ Marked as resolved — Admin notified');
  };

  const centerOnFarm = () => {
    mapRef.current?.animateToRegion({
      ...FARM_CENTER,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 800);
  };

  const getZoneColor = (status: string) => {
    if (status === 'active') return Colors.alert;
    if (status === 'resolved') return Colors.resolved;
    return Colors.healthy;
  };

  const styles = makeStyles(C, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Farm Map</Text>
        <Text style={styles.headerSub}>Talakagc Banana Farm · Bukidnon</Text>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...FARM_CENTER,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        mapType="satellite"
      >
        {/* Farm boundary polygon */}
        <Polygon
          coordinates={FARM_POLYGON}
          strokeColor={Colors.accent}
          strokeWidth={2}
          fillColor="rgba(244, 165, 34, 0.1)"
        />

        {/* Heatmap circles */}
        {showHeatmap &&
          zones.map((zone) => (
            <Circle
              key={`heat-${zone.id}`}
              center={{ latitude: zone.latitude, longitude: zone.longitude }}
              radius={30}
              fillColor={
                zone.status === 'active'
                  ? 'rgba(239, 68, 68, 0.35)'
                  : 'rgba(107, 114, 128, 0.25)'
              }
              strokeColor={
                zone.status === 'active'
                  ? 'rgba(239, 68, 68, 0.6)'
                  : 'rgba(107, 114, 128, 0.4)'
              }
              strokeWidth={1}
            />
          ))}

        {/* Markers */}
        {zones.map((zone) => (
          <Marker
            key={zone.id}
            coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
            onPress={() => {
              setSelectedZone(zone);
              setShowSheet(true);
            }}
            pinColor={getZoneColor(zone.status)}
          />
        ))}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: C.card }]}
          onPress={centerOnFarm}
          activeOpacity={0.8}
        >
          <Text style={styles.controlIcon}>🎯</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.controlBtn,
            { backgroundColor: showHeatmap ? Colors.primary : C.card },
          ]}
          onPress={() => setShowHeatmap(!showHeatmap)}
          activeOpacity={0.8}
        >
          <Text style={styles.controlIcon}>🌡</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: C.card }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.healthy }]} />
          <Text style={[styles.legendText, { color: C.subtext }]}>Healthy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.alert }]} />
          <Text style={[styles.legendText, { color: C.subtext }]}>Black Sigatoka</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.resolved }]} />
          <Text style={[styles.legendText, { color: C.subtext }]}>Resolved</Text>
        </View>
      </View>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowSheet(false)}
        />
        {selectedZone && (
          <View style={[styles.bottomSheet, { backgroundColor: C.card }]}>
            {/* Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: C.border }]} />

            {/* Status */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetCoords}>
                <Text style={styles.sheetPin}>📍</Text>
                <View>
                  <Text style={[styles.sheetCoordsText, { color: C.text }]}>
                    {selectedZone.latitude.toFixed(4)}° N,{' '}
                    {selectedZone.longitude.toFixed(4)}° E
                  </Text>
                  <Text style={[styles.sheetScanId, { color: C.subtext }]}>
                    {selectedZone.uavScanId}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      selectedZone.status === 'active'
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
                        selectedZone.status === 'active'
                          ? Colors.alert
                          : Colors.resolved,
                    },
                  ]}
                >
                  {selectedZone.status === 'active' ? '● ACTIVE' : '✓ RESOLVED'}
                </Text>
              </View>
            </View>

            {/* Details */}
            <View style={[styles.sheetDetails, { borderColor: C.border }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: C.subtext }]}>Disease</Text>
                <Text style={[styles.detailValue, { color: Colors.accent }]}>
                  🍌 {selectedZone.detectionClass}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: C.subtext }]}>Detected</Text>
                <Text style={[styles.detailValue, { color: C.text }]}>
                  {selectedZone.dateReceived}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: C.subtext }]}>Message</Text>
                <Text style={[styles.detailValue, { color: C.text }]}>
                  {selectedZone.message}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.btnClose, { borderColor: C.border }]}
                onPress={() => setShowSheet(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnCloseText, { color: C.subtext }]}>Close</Text>
              </TouchableOpacity>
              {selectedZone.status === 'active' && (
                <TouchableOpacity
                  style={[styles.btnResolve, { backgroundColor: Colors.primary }]}
                  onPress={() => markResolved(selectedZone.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnResolveText}>✓ Mark as Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Modal>

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
    map: { flex: 1 },
    controls: {
      position: 'absolute',
      right: 16,
      top: 160,
      gap: 8,
    },
    controlBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    controlIcon: { fontSize: 20 },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 4,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: 12,
      fontWeight: '500',
    },
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bottomSheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    sheetCoords: {
      flexDirection: 'row',
      gap: 8,
      flex: 1,
    },
    sheetPin: { fontSize: 16, marginTop: 2 },
    sheetCoordsText: {
      fontSize: 15,
      fontWeight: '700',
    },
    sheetScanId: {
      fontSize: 12,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    sheetDetails: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      paddingVertical: 12,
      marginBottom: 16,
      gap: 10,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    detailLabel: {
      fontSize: 13,
      fontWeight: '500',
      width: 80,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
      textAlign: 'right',
    },
    sheetActions: {
      flexDirection: 'row',
      gap: 10,
    },
    btnClose: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnCloseText: {
      fontSize: 14,
      fontWeight: '600',
    },
    btnResolve: {
      flex: 2,
      height: 48,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnResolveText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
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
    toastText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  });
}