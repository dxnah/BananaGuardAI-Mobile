import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Colors = {
  primary: "#1B4332",
  accent: "#F4A522",
  healthy: "#22C55E",
  alert: "#EF4444",
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

const FEED_H = 300;
const ROWS = 6;
const COLS = 8;

// Hard-coded fake detections (x/y are % of the feed)
const DETECTIONS = [
  { x: 24, y: 34, conf: 94 },
  { x: 62, y: 52, conf: 88 },
  { x: 38, y: 66, conf: 91 },
  { x: 70, y: 28, conf: 86 },
];

type LogItem = { id: number; time: string; conf: number };

function fmt(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// One screen-height tile of banana plants. Two of these scroll to fake flight.
function PlantTile({ shade }: { shade: boolean }) {
  const dots = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c === 3 || c === 4) continue; // gap for the dirt path
      const size = 20 + ((r * 7 + c * 3) % 4) * 3;
      const sick = (r * 5 + c * 11) % 17 === 0;
      dots.push(
        <View
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            top: r * (FEED_H / ROWS) + 8 + (c % 2) * 6,
            left: `${c * (100 / COLS) + 2}%`,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: sick
              ? "#8A7A2E"
              : (r + c) % 2 === 0
                ? "#2E7D4A"
                : "#3A9159",
            opacity: shade ? 0.9 : 1,
          }}
        />,
      );
    }
  }
  return (
    <View style={{ height: FEED_H, backgroundColor: "#17301F" }}>
      <View style={styles.dirtPath} />
      {dots}
    </View>
  );
}

export default function LiveScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [log, setLog] = useState<LogItem[]>([]);

  // Scrolling ground animation
  const scroll = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (paused) {
      scroll.stopAnimation();
      return;
    }
    scroll.setValue(0);
    const loop = Animated.loop(
      Animated.timing(scroll, {
        toValue: -FEED_H,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [paused, scroll]);

  // Blinking REC dot
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  // 1-second clock drives timer, telemetry and detections
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const cycle = Math.floor(tick / 5);
  const phase = tick % 5;
  const detection = DETECTIONS[cycle % DETECTIONS.length];
  const showBox = !paused && phase >= 1 && phase <= 3;

  // Add to detection log when a new box appears
  useEffect(() => {
    if (phase === 1 && tick > 0) {
      setLog((prev) => {
        // Effects can re-run for the same tick (Fast Refresh / StrictMode),
        // so never add an entry whose id is already in the log.
        if (prev.some((l) => l.id === tick)) return prev;
        return [
          { id: tick, time: fmt(tick), conf: detection.conf },
          ...prev,
        ].slice(0, 6);
      });
    }
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fake telemetry
  const alt = 32 + ((tick * 7) % 5) * 0.4;
  const spd = 4 + ((tick * 3) % 6) * 0.1;
  const bat = Math.max(20, 78 - Math.floor(tick / 30));

  const styles2 = makeStyles(C);

  return (
    <View style={[styles2.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles2.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles2.headerTitle}>Live Drone Feed</Text>
        <Text style={styles2.headerSub}>UAV-01 · Demo stream</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles2.scrollContent}
      >
        {/* Video feed */}
        <View style={styles.feed}>
          <Animated.View style={{ transform: [{ translateY: scroll }] }}>
            <PlantTile shade={false} />
            <PlantTile shade />
          </Animated.View>

          {/* corner brackets */}
          <View
            style={[
              styles.corner,
              { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 },
            ]}
          />
          <View
            style={[
              styles.corner,
              { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 },
            ]}
          />
          <View
            style={[
              styles.corner,
              { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 },
            ]}
          />
          <View
            style={[
              styles.corner,
              {
                bottom: 8,
                right: 8,
                borderBottomWidth: 2,
                borderRightWidth: 2,
              },
            ]}
          />

          {/* crosshair */}
          <View style={styles.crossH} />
          <View style={styles.crossV} />

          {/* detection box */}
          {showBox && (
            <View
              style={[
                styles.detBox,
                { left: `${detection.x}%`, top: `${detection.y}%` },
              ]}
            >
              <View style={styles.detLabel}>
                <Text style={styles.detLabelText}>
                  Black Sigatoka {detection.conf}%
                </Text>
              </View>
            </View>
          )}

          {/* top HUD */}
          <View style={styles.hudTop}>
            <View style={styles.liveBadge}>
              <Animated.View
                style={[styles.recDot, { opacity: paused ? 1 : blink }]}
              />
              <Text style={styles.liveBadgeText}>
                {paused ? "PAUSED" : "LIVE"}
              </Text>
            </View>
            <Text style={styles.timer}>{fmt(tick)}</Text>
          </View>

          {/* telemetry */}
          <View style={styles.telemetry}>
            <Text style={styles.telText}>ALT {alt.toFixed(1)} m</Text>
            <Text style={styles.telText}>SPD {spd.toFixed(1)} m/s</Text>
            <Text style={styles.telText}>BAT {bat}%</Text>
            <Text style={styles.telText}>8.1234°N 124.5678°E</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles2.controls}>
          <TouchableOpacity
            style={[styles2.btn, { backgroundColor: Colors.primary }]}
            activeOpacity={0.8}
            onPress={() => setPaused((p) => !p)}
          >
            <Text style={styles2.btnText}>
              {paused ? "▶ Resume" : "⏸ Pause"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles2.btn,
              {
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: Colors.primary,
              },
            ]}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                "Screenshot saved",
                "Demo only — nothing was actually saved.",
              )
            }
          >
            <Text style={[styles2.btnText, { color: Colors.primary }]}>
              📸 Screenshot
            </Text>
          </TouchableOpacity>
        </View>

        {/* Detection log */}
        <Text style={[styles2.sectionLabel, { color: C.subtext }]}>
          DETECTIONS THIS FLIGHT
        </Text>
        {log.length === 0 ? (
          <View
            style={[
              styles2.logCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text style={{ color: C.subtext, fontSize: 13 }}>
              Scanning… no detections yet.
            </Text>
          </View>
        ) : (
          log.map((l) => (
            <View
              key={l.id}
              style={[
                styles2.logCard,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
            >
              <Text style={{ fontSize: 14 }}>🍌</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles2.logTitle, { color: C.text }]}>
                  Black Sigatoka detected
                </Text>
                <Text style={[styles2.logSub, { color: C.subtext }]}>
                  at {l.time} · confidence {l.conf}%
                </Text>
              </View>
              <Text style={[styles2.logBadge, { color: Colors.alert }]}>
                NEW
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// Feed styles (always dark, like a camera view)
const styles = StyleSheet.create({
  feed: {
    height: FEED_H,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  dirtPath: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "37%",
    width: "26%",
    backgroundColor: "#5B4B32",
    opacity: 0.55,
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "rgba(255,255,255,0.8)",
  },
  crossH: {
    position: "absolute",
    top: "50%",
    left: "47%",
    width: "6%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  crossV: {
    position: "absolute",
    left: "50%",
    top: "47%",
    height: "6%",
    width: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  detBox: {
    position: "absolute",
    width: 74,
    height: 62,
    borderWidth: 2,
    borderColor: "#EF4444",
    borderRadius: 4,
  },
  detLabel: {
    position: "absolute",
    top: -18,
    left: -2,
    backgroundColor: "#EF4444",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  detLabelText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  hudTop: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  liveBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  timer: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  telemetry: {
    position: "absolute",
    left: 16,
    bottom: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 1,
  },
  telText: {
    color: "#D1FAE5",
    fontSize: 10,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});

function makeStyles(C: typeof Colors.light) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      backgroundColor: Colors.primary,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
    headerSub: { fontSize: 13, color: "#A7C4B0", marginTop: 2 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
    controls: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
      marginBottom: 20,
    },
    btn: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    btnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1,
      marginBottom: 8,
    },
    logCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginBottom: 8,
    },
    logTitle: { fontSize: 13, fontWeight: "600" },
    logSub: { fontSize: 11, marginTop: 1 },
    logBadge: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  });
}