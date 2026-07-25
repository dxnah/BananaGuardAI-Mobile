import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { useAuth } from '@/context/AuthContext';

const Colors = {
  primary: "#1B4332",
  accent: "#F4A522",
  healthy: "#22C55E",
  alert: "#EF4444",
  resolved: "#6B7280",
  light: {
    background: "#F9F7F2",
    card: "#FFFFFF",
    text: "#111714",
    subtext: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    background: "#111714",
    card: "#1C2B22",
    text: "#F9F7F2",
    subtext: "#9CA3AF",
    border: "#2D3D33",
  },
};

type FilterType = "all" | "active" | "resolved";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AlertsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { userAlerts, refreshAlerts, acknowledgeAlert } = useAuth();

  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;

  const activeAlerts = userAlerts.filter((a) => !a.acknowledged);
  const resolvedAlerts = userAlerts.filter((a) => a.acknowledged);

  const filtered = userAlerts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "active") return !a.acknowledged;
    return a.acknowledged;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAlerts();
    setRefreshing(false);
  }, [refreshAlerts]);

  const handleAcknowledge = async (alert_id: number) => {
    await acknowledgeAlert(alert_id);
    showToast("✓ Marked as resolved");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(""));
  };

  const styles = makeStyles(C, isDark);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={Colors.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSub}>
          {activeAlerts.length} active · {resolvedAlerts.length} resolved
        </Text>
      </View>

      {/* Active alert banner */}
      {activeAlerts.length > 0 && (
        <View
          style={[
            styles.pushBanner,
            { backgroundColor: isDark ? "#2A1010" : "#FEF2F2" },
          ]}
        >
          <Text style={styles.pushIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pushTitle, { color: Colors.alert }]}>
              {activeAlerts.length} unresolved alert
              {activeAlerts.length > 1 ? "s" : ""} on your farm
            </Text>
            <Text style={[styles.pushSub, { color: C.subtext }]}>
              Tap an alert to view it on the map.
            </Text>
          </View>
        </View>
      )}

      {/* Filter chips */}
      <View style={[styles.filterRow, { borderBottomColor: C.border }]}>
        {(["all", "active", "resolved"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f && { backgroundColor: Colors.primary },
              filter !== f && {
                backgroundColor: isDark ? "#1C2B22" : "#F3F4F6",
              },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filter === f ? "#FFFFFF" : C.subtext },
              ]}
            >
              {f === "all"
                ? `All (${userAlerts.length})`
                : f === "active"
                  ? `Active (${activeAlerts.length})`
                  : `Resolved (${resolvedAlerts.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alert list */}
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
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={[styles.emptyTitle, { color: C.text }]}>
              No alerts here
            </Text>
            <Text style={[styles.emptySub, { color: C.subtext }]}>
              {filter === "active"
                ? "No active alerts. Your farm looks healthy!"
                : filter === "resolved"
                  ? "No resolved alerts yet."
                  : "You have no alerts assigned yet."}
            </Text>
          </View>
        ) : (
          filtered.map((alert) => (
            <View
              key={alert.alert_id}
              style={[
                styles.alertCard,
                {
                  backgroundColor: C.card,
                  borderColor: !alert.acknowledged ? Colors.alert : C.border,
                  borderLeftWidth: !alert.acknowledged ? 4 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.msgRow}>
                  <Text style={styles.pinIcon}>🍌</Text>
                  <Text
                    style={[styles.alertMessage, { color: C.text }]}
                    numberOfLines={3}
                  >
                    {alert.alert_message ?? "Disease alert from UAV scan."}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: !alert.acknowledged
                        ? isDark
                          ? "#2A1010"
                          : "#FEF2F2"
                        : isDark
                          ? "#1F2937"
                          : "#F3F4F6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: !alert.acknowledged
                          ? Colors.alert
                          : Colors.resolved,
                      },
                    ]}
                  >
                    {!alert.acknowledged ? "● ACTIVE" : "✓ RESOLVED"}
                  </Text>
                </View>
              </View>

              <View style={[styles.metaRow, { borderColor: C.border }]}>
                <Text style={[styles.scanIdText, { color: C.subtext }]}>
                  🆔 Alert #{alert.alert_id}
                </Text>
                <Text style={[styles.dateText, { color: C.subtext }]}>
                  {formatDate(alert.alert_sent_at)}
                </Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: Colors.primary }]}
                  activeOpacity={0.7}
                  onPress={() => router.push("/(tabs)/map" as any)}
                >
                  <Text
                    style={[styles.btnOutlineText, { color: Colors.primary }]}
                  >
                    🗺 View on Map
                  </Text>
                </TouchableOpacity>
                {!alert.acknowledged && (
                  <TouchableOpacity
                    style={[
                      styles.btnFilled,
                      { backgroundColor: Colors.primary },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleAcknowledge(alert.alert_id)}
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
      {toast !== "" && (
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
    headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
    headerSub: { fontSize: 13, color: "#A7C4B0", marginTop: 2 },
    pushBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2D3D33" : "#E5E7EB",
    },
    pushIcon: { fontSize: 20 },
    pushTitle: { fontSize: 13, fontWeight: "700" },
    pushSub: { fontSize: 12, marginTop: 1 },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
    },
    filterChipText: { fontSize: 13, fontWeight: "600" },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 8,
    },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: 18, fontWeight: "700" },
    emptySub: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
    alertCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
      gap: 8,
    },
    msgRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      flex: 1,
    },
    pinIcon: { fontSize: 14, marginTop: 2 },
    alertMessage: { fontSize: 13, fontWeight: "500", flex: 1, lineHeight: 18 },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      flexShrink: 0,
    },
    statusText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
    },
    scanIdText: { fontSize: 12 },
    dateText: { fontSize: 11 },
    actions: { flexDirection: "row", gap: 8 },
    btnOutline: {
      flex: 1,
      height: 40,
      borderRadius: 8,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    btnOutlineText: { fontSize: 13, fontWeight: "600" },
    btnFilled: {
      flex: 1,
      height: 40,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    btnFilledText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
    toast: {
      position: "absolute",
      bottom: 100,
      alignSelf: "center",
      backgroundColor: Colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    toastText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  });
}
