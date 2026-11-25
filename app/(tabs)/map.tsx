import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Marker, Polygon, UrlTile } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  alertsAPI,
  getDetections,
  getScans,
  usersAPI,
  type AlertOut,
  type DetectionOut,
  type ScanOut,
  type UserOut,
} from "@/services/api";
import { formatDateTime } from "@/utils/dates";

const Colors = {
  primary: "#1B4332",
  accent: "#F4A522",
  healthy: "#22C55E",
  alert: "#EF4444",
  light: { background: "#F9F7F2", card: "#FFFFFF", text: "#111714", subtext: "#6B7280", border: "#E5E7EB" },
  dark: { background: "#111714", card: "#1C2B22", text: "#F9F7F2", subtext: "#9CA3AF", border: "#2D3D33" },
};

// The farm's own boundary (fixed place on the map, not mock data).
// Change these points if your real farm is somewhere else.
const FARM_ZONE = [
  { latitude: 8.454, longitude: 124.631 },
  { latitude: 8.456, longitude: 124.631 },
  { latitude: 8.456, longitude: 124.633 },
  { latitude: 8.454, longitude: 124.633 },
];
const FARM_CENTER = {
  latitude: FARM_ZONE.reduce((a, c) => a + c.latitude, 0) / FARM_ZONE.length,
  longitude: FARM_ZONE.reduce((a, c) => a + c.longitude, 0) / FARM_ZONE.length,
};
const REGION = { ...FARM_CENTER, latitudeDelta: 0.01, longitudeDelta: 0.01 };

type Tone = "ok" | "warn" | "muted";

function StatusPill({ label, tone, isDark }: { label: string; tone: Tone; isDark: boolean }) {
  const map: Record<Tone, { bg: string; fg: string }> = {
    ok: { bg: "#E9F5EE", fg: Colors.primary },
    warn: { bg: "#FEF3DC", fg: "#B45309" },
    muted: { bg: isDark ? "#1F2937" : "#F3F4F6", fg: "#6B7280" },
  };
  const c = map[tone];
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ color: c.fg, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, children, C }: any) {
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <Ionicons name={icon} size={14} color={C.subtext} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, color: C.subtext }}>{label}</Text>
        <View style={{ marginTop: 2 }}>{children}</View>
      </View>
    </View>
  );
}

export default function MapScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const s = makeStyles(C);

  const [me, setMe] = useState<UserOut | null>(null);
  const [latest, setLatest] = useState<DetectionOut | null>(null);
  const [latestScan, setLatestScan] = useState<ScanOut | null>(null);
  const [openAlerts, setOpenAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        try {
          const [user, dets, scans, alerts] = await Promise.all([
            usersAPI.getMe(),
            getDetections(),
            getScans().catch(() => [] as ScanOut[]),
            alertsAPI.getMine(false).catch(() => [] as AlertOut[]),
          ]);
          if (cancelled) return;
          const newest =
            dets.length > 0 ? dets.reduce((a, b) => (b.detection_id > a.detection_id ? b : a)) : null;
          setMe(user);
          setLatest(newest);
          setLatestScan(newest ? scans.find((sc) => sc.scan_id === newest.scan_id) ?? null : null);
          setOpenAlerts(alerts.length);
          setError(false);
        } catch {
          if (!cancelled) setError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      load();
      return () => { cancelled = true; };
    }, []),
  );

  const isDisease = !!latest?.anomaly_detected;
  const zoneColor = isDisease ? Colors.accent : Colors.primary;
  const zoneFill = isDisease ? "rgba(254,243,220,0.6)" : "rgba(233,245,238,0.6)";
  const confidence = latest?.tier2_confidence != null ? Math.round(latest.tier2_confidence * 100) : null;

  return (
    <View style={[s.container, { backgroundColor: C.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerTitle}>Farm Map</Text>
        <Text style={s.headerSub}>{me ? `${me.full_name}'s farm` : "Your farm"}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color="#B45309" style={{ marginTop: 1 }} />
            <Text style={s.errorText}>Can't reach the BananaGuard server. Showing what we have.</Text>
          </View>
        )}

        <View style={[s.mapCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <MapView
            style={s.map}
            initialRegion={REGION}
            mapType={Platform.OS === "android" ? "none" : "standard"}
            onPress={() => setSelected(false)}
          >
            <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
            <Polygon
              coordinates={FARM_ZONE}
              strokeColor={zoneColor}
              fillColor={zoneFill}
              strokeWidth={2}
              tappable
              onPress={() => setSelected(true)}
            />
            <Marker
              coordinate={FARM_CENTER}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={() => setSelected(true)}
            >
              <View style={[s.markerDot, { backgroundColor: zoneColor }]} />
            </Marker>
          </MapView>

          <View style={[s.legend, { borderTopColor: C.border }]}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: C.subtext }}>Legend:</Text>
            {[
              { color: Colors.primary, label: "Healthy" },
              { color: Colors.accent, label: "Disease detected" },
            ].map((l) => (
              <View key={l.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: l.color }]} />
                <Text style={{ fontSize: 11, color: C.subtext }}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
        ) : selected ? (
          <View style={[s.panel, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[s.panelHeader, { backgroundColor: isDark ? "#14261B" : "#E9F5EE" }]}>
              <View style={s.stripLeft}>
                <Ionicons name="location-outline" size={14} color={isDark ? "#A7C4B0" : Colors.primary} />
                <Text style={[s.panelTitle, { color: isDark ? "#A7C4B0" : Colors.primary }]}>Farm Details</Text>
              </View>
              <Ionicons
                name="close"
                size={18}
                color={isDark ? "#A7C4B0" : Colors.primary}
                onPress={() => setSelected(false)}
                style={{ padding: 4 }}
              />
            </View>

            <View style={{ padding: 16, gap: 16 }}>
              {me && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={s.avatar}>
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                      {me.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: C.text, fontSize: 14, fontWeight: "600" }}>{me.full_name}</Text>
                    <Text style={{ color: C.subtext, fontSize: 12 }}>@{me.username}</Text>
                  </View>
                </View>
              )}

              <View style={[s.thumb, { backgroundColor: !latest ? (isDark ? "#1F2937" : "#F3F4F6") : isDisease ? "#FFFBEB" : isDark ? "#14261B" : "#E9F5EE" }]}>
                <Ionicons
                  name={!latest ? "scan-outline" : isDisease ? "warning-outline" : "shield-checkmark-outline"}
                  size={28}
                  color={!latest ? C.subtext : isDisease ? "#F59E0B" : Colors.primary}
                />
                <Text style={{ fontSize: 12, fontWeight: "600", color: !latest ? C.subtext : isDisease ? "#B45309" : Colors.primary }}>
                  {!latest ? "No scan yet" : isDisease ? "Disease Detected" : "Farm is Healthy"}
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                <InfoRow icon="calendar-outline" label="Last UAV Scan" C={C}>
                  <Text style={{ fontSize: 12, color: C.text }}>
                    {latestScan ? formatDateTime(latestScan.timestamp) : "No scan yet"}
                  </Text>
                </InfoRow>
                <InfoRow icon="notifications-outline" label="Notification Status" C={C}>
                  <StatusPill
                    isDark={isDark}
                    tone={openAlerts > 0 ? "warn" : "ok"}
                    label={openAlerts > 0 ? `${openAlerts} new alert${openAlerts > 1 ? "s" : ""}` : "No Alert"}
                  />
                </InfoRow>
                <InfoRow icon="airplane-outline" label="Detection Class" C={C}>
                  <StatusPill
                    isDark={isDark}
                    tone={!latest ? "muted" : isDisease ? "warn" : "ok"}
                    label={!latest ? "None" : isDisease ? latest.detected_class || "Disease" : "Healthy"}
                  />
                </InfoRow>
              </View>

              {confidence !== null && (
                <View style={[s.confBox, { backgroundColor: isDark ? "#14261B" : "#F9FAFB" }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: C.subtext }}>Confidence Score</Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: C.text }}>{confidence}%</Text>
                  </View>
                  <View style={[s.barTrack, { backgroundColor: isDark ? "#2D3D33" : "#E5E7EB" }]}>
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        width: `${confidence}%`,
                        backgroundColor: isDisease ? Colors.accent : Colors.primary,
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : (
          <Text style={{ textAlign: "center", color: C.subtext, fontSize: 12, marginTop: 14 }}>
            Tap your farm on the map to see its details.
          </Text>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(C: typeof Colors.light) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { backgroundColor: Colors.primary, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
    headerSub: { fontSize: 13, color: "#A7C4B0", marginTop: 2 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
    stripLeft: { flexDirection: "row", alignItems: "center", gap: 6 },

    errorBox: {
      flexDirection: "row", gap: 8, backgroundColor: "#FFFBEB", borderWidth: 1,
      borderColor: "#FDE68A", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
    },
    errorText: { color: "#B45309", fontSize: 12, flex: 1 },

    mapCard: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
    map: { height: 380, width: "100%" },
    markerDot: {
      width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#fff",
      shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3,
    },
    legend: {
      flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12,
      paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: "#fff" },

    panel: { borderWidth: 1, borderRadius: 14, overflow: "hidden", marginTop: 14 },
    panelHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 10,
    },
    panelTitle: { fontSize: 14, fontWeight: "600" },
    avatar: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
      alignItems: "center", justifyContent: "center",
    },
    thumb: { height: 112, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 6 },
    confBox: { borderRadius: 10, padding: 12 },
    barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  });
}