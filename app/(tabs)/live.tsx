import Ionicons from "@expo/vector-icons/Ionicons";
import * as FileSystem from "expo-file-system/legacy"; // on older SDKs: "expo-file-system"
import * as MediaLibrary from "expo-media-library";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { getDetections, getLiveStream, getScans } from "@/services/api";
import { parseServerDate } from "@/utils/dates";

const Colors = {
  primary: "#1B4332",
  accent: "#F4A522",
  healthy: "#22C55E",
  alert: "#EF4444",
  light: { background: "#F9F7F2", card: "#FFFFFF", text: "#111714", subtext: "#6B7280", border: "#E5E7EB" },
  dark: { background: "#111714", card: "#1C2B22", text: "#F9F7F2", subtext: "#9CA3AF", border: "#2D3D33" },
};

const FEED_H = 300;
const POLL_MS = 5000;
const CONNECT_TIMEOUT_MS = 15000;
const NEW_FOR_MS = 30000;

type Status = "idle" | "connecting" | "live" | "failed";

const STATUS_BADGE: Record<string, { label: string; dot: string; blink: boolean }> = {
  connecting: { label: "CONNECTING", dot: "#FBBF24", blink: true },
  live: { label: "LIVE", dot: "#EF4444", blink: true },
  failed: { label: "OFFLINE", dot: "#9CA3AF", blink: false },
};

const isVideoUrl = (url: string) => /\.(m3u8|mp4|webm|ogg)(\?|$)/i.test(url);

function fmt(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// The feed runs inside a WebView so MJPEG streams and videos behave like on the web.
function buildHtml(url: string) {
  const safe = url.replace(/"/g, "&quot;");
  const media = isVideoUrl(url)
    ? `<video id="m" src="${safe}" autoplay muted playsinline crossorigin="anonymous"></video>`
    : `<img id="m" src="${safe}" crossorigin="anonymous" />`;
  const evt = isVideoUrl(url) ? "playing" : "load";
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>html,body{margin:0;height:100%;background:#000}#m{width:100%;height:100%;object-fit:contain}</style>
</head><body>${media}
<script>
  var m=document.getElementById('m');
  function send(t,d){window.ReactNativeWebView.postMessage(JSON.stringify({type:t,data:d}))}
  m.addEventListener('${evt}',function(){send('live')});
  m.addEventListener('error',function(){send('failed')});
  window.snap=function(){
    try{
      var c=document.createElement('canvas');
      c.width=m.naturalWidth||m.videoWidth;c.height=m.naturalHeight||m.videoHeight;
      c.getContext('2d').drawImage(m,0,0);
      send('shot',c.toDataURL('image/jpeg',0.92).split(',')[1]);
    }catch(e){send('shotfail')}
  };
  true;
</script></body></html>`;
}

export default function LiveScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const s = makeStyles(C);

  // The link is set by the admin on the web. Farmers only watch.
  const [activeUrl, setActiveUrl] = useState("");
  const [nonce, setNonce] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [flight, setFlight] = useState<any[]>([]);
  const [serverError, setServerError] = useState(false);
  const [toast, setToast] = useState("");

  const webRef = useRef<WebView>(null);
  const urlRef = useRef("");
  const baselineRef = useRef<number | null>(null);
  const arrivedRef = useRef<Record<string, number>>({});
  const blink = useRef(new Animated.Value(1)).current;

  // blinking dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  // ask the server which stream the admin connected
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { stream_url } = await getLiveStream();
        if (cancelled) return;
        setServerError(false);
        const next = (stream_url || "").trim();
        if (next === urlRef.current) return;
        urlRef.current = next;
        baselineRef.current = null;
        arrivedRef.current = {};
        setFlight([]);
        setElapsed(0);
        setPaused(false);
        setStatus(next ? "connecting" : "idle");
        setNonce((n) => n + 1);
        setActiveUrl(next);
      } catch {
        if (!cancelled) setServerError(true);
      }
    }

    check();
    const id = setInterval(check, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  function reconnect() {
    setPaused(false);
    setStatus("connecting");
    setNonce((n) => n + 1);
  }

  // give up if first frame never arrives
  useEffect(() => {
    if (status !== "connecting" || !activeUrl) return;
    const id = setTimeout(() => setStatus("failed"), CONNECT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [status, activeUrl, nonce]);

  // flight timer
  useEffect(() => {
    if (status !== "live" || paused) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status, paused]);

  // poll model results
  useEffect(() => {
    if (!activeUrl) return;
    let cancelled = false;

    async function poll() {
      try {
        const [dets, scans] = await Promise.all([getDetections(), getScans().catch(() => [])]);
        if (cancelled) return;
        setServerError(false);

        const newest = dets.reduce((m: number, d: any) => Math.max(m, d.detection_id), 0);
        if (baselineRef.current === null) {
          baselineRef.current = newest;
          return;
        }
        const scanById: Record<string, any> = {};
        scans.forEach((sc: any) => { scanById[sc.scan_id] = sc; });

        const fresh = dets
          .filter((d: any) => d.detection_id > (baselineRef.current as number))
          .sort((a: any, b: any) => b.detection_id - a.detection_id)
          .slice(0, 20)
          .map((d: any) => {
            if (!arrivedRef.current[d.detection_id]) arrivedRef.current[d.detection_id] = Date.now();
            return { ...d, when: parseServerDate(scanById[d.scan_id]?.timestamp) };
          });
        setFlight(fresh);
      } catch {
        if (!cancelled) setServerError(true);
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [activeUrl]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  function takeScreenshot() {
    if (status !== "live" || paused) {
      setToast("Nothing to capture yet. Wait for the live video.");
      return;
    }
    webRef.current?.injectJavaScript("window.snap(); true;");
  }

  async function onMessage(e: any) {
    let msg: any;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg.type === "live") setStatus("live");
    else if (msg.type === "failed") setStatus("failed");
    else if (msg.type === "shotfail") setToast("This stream does not allow screenshots from the app. Use your phone's screenshot buttons instead.");
    else if (msg.type === "shot") {
      try {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (!perm.granted) { setToast("Allow photo access to save screenshots."); return; }
        const path = `${FileSystem.cacheDirectory}bananaguard-${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(path, msg.data, { encoding: "base64" as any });
        await MediaLibrary.saveToLibraryAsync(path);
        setToast("Screenshot saved to your gallery.");
      } catch {
        setToast("Could not capture this frame.");
      }
    }
  }

  const diseased = flight.filter((d) => d.anomaly_detected).length;
  const healthy = flight.length - diseased;
  const badge = paused ? { label: "PAUSED", dot: "#9CA3AF", blink: false } : STATUS_BADGE[status];
  const canControl = status === "live";

  return (
    <View style={[s.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerTitle}>Live Drone Feed</Text>
        <Text style={s.headerSub}>Live from the drone</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Feed */}
        <View style={s.feed}>
          {activeUrl && !paused && (
            <WebView
              key={nonce}
              ref={webRef}
              originWhitelist={["*"]}
              source={{ html: buildHtml(activeUrl) }}
              onMessage={onMessage}
              onError={() => setStatus("failed")}
              onHttpError={() => setStatus("failed")}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              scrollEnabled={false}
              mixedContentMode="always"
              style={StyleSheet.absoluteFill}
            />
          )}

          {!activeUrl && (
            <View style={[s.overlay, { backgroundColor: "#10201A" }]}>
              <Ionicons name="videocam-off-outline" size={34} color="rgba(167,243,208,0.6)" style={{ marginBottom: 10 }} />
              <Text style={s.overlayTitle}>No live video right now</Text>
              <Text style={s.overlaySub}>
                The drone is not streaming. The video will appear here by itself when it starts.
              </Text>
            </View>
          )}
          {activeUrl && status === "connecting" && !paused && (
            <View style={[s.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]} pointerEvents="none">
              <Text style={s.overlayTitle}>Loading the drone video…</Text>
            </View>
          )}
          {activeUrl && status === "failed" && !paused && (
            <View style={[s.overlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
              <Ionicons name="alert-circle-outline" size={30} color="#FCA5A5" style={{ marginBottom: 6 }} />
              <Text style={s.overlayTitle}>Could not show the drone video</Text>
              <Text style={s.overlaySub}>The stream may have stopped. Try again in a moment.</Text>
              <TouchableOpacity style={s.retryBtn} onPress={reconnect} activeOpacity={0.8}>
                <Text style={s.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}
          {activeUrl && paused && (
            <View style={[s.overlay, { backgroundColor: "#10201A" }]}>
              <Text style={s.overlayTitle}>Paused</Text>
            </View>
          )}

          {activeUrl && (
            <>
              <View pointerEvents="none" style={[s.corner, { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 }]} />
              <View pointerEvents="none" style={[s.corner, { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 }]} />
              <View pointerEvents="none" style={[s.corner, { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
              <View pointerEvents="none" style={[s.corner, { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 }]} />

              <View style={s.hudTop} pointerEvents="none">
                <View style={s.liveBadge}>
                  <Animated.View
                    style={[s.recDot, { backgroundColor: badge.dot, opacity: badge.blink ? blink : 1 }]}
                  />
                  <Text style={s.liveBadgeText}>{badge.label}</Text>
                </View>
                {status === "live" && <Text style={s.timer}>{fmt(elapsed)}</Text>}
              </View>
            </>
          )}
        </View>

        {/* Controls */}
        {!!activeUrl && (
          <View style={s.controls}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: Colors.primary, opacity: !paused && !canControl ? 0.4 : 1 }]}
              activeOpacity={0.8}
              disabled={!paused && !canControl}
              onPress={() => (paused ? reconnect() : setPaused(true))}
            >
              <Ionicons name={paused ? "play" : "pause"} size={16} color="#FFFFFF" />
              <Text style={s.btnText}>{paused ? "Resume" : "Pause"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: "transparent", borderWidth: 1.5, borderColor: isDark ? "#A7C4B0" : Colors.primary }]}
              activeOpacity={0.8}
              onPress={takeScreenshot}
            >
              <Ionicons name="camera-outline" size={18} color={isDark ? "#A7C4B0" : Colors.primary} />
              <Text style={[s.btnText, { color: isDark ? "#A7C4B0" : Colors.primary }]}>Screenshot</Text>
            </TouchableOpacity>
          </View>
        )}
        {!!toast && (
          <Text style={[s.toast, { color: C.subtext, backgroundColor: isDark ? "#1C2B22" : "#F3F4F6" }]}>{toast}</Text>
        )}

        {/* Model results */}
        <View style={s.resultsHeader}>
          <Text style={[s.sectionLabel, { color: C.subtext }]}>DETECTIONS THIS FLIGHT</Text>
          {flight.length > 0 && (
            <Text style={{ fontSize: 11, color: C.subtext }}>
              <Text style={{ color: Colors.alert, fontWeight: "600" }}>{diseased}</Text> diseased ·{" "}
              <Text style={{ color: Colors.healthy, fontWeight: "600" }}>{healthy}</Text> healthy
            </Text>
          )}
        </View>

        {serverError && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color="#B45309" style={{ marginTop: 1 }} />
            <Text style={s.errorText}>
              Can't reach the BananaGuard server. Results will show up again once this phone is online.
            </Text>
          </View>
        )}

        {!activeUrl ? (
          <View style={[s.logCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={{ color: C.subtext, fontSize: 13 }}>Results will appear here when the drone starts streaming.</Text>
          </View>
        ) : flight.length === 0 ? (
          <View style={[s.logCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={{ color: C.subtext, fontSize: 13, flex: 1 }}>
              Scanning… no results yet. Black Sigatoka and healthy leaves will appear here as the model checks the video.
            </Text>
          </View>
        ) : (
          flight.map((d) => {
            const disease = !!d.anomaly_detected;
            const isNew = Date.now() - (arrivedRef.current[d.detection_id] || 0) < NEW_FOR_MS;
            const time = (d.when || new Date(arrivedRef.current[d.detection_id] || Date.now()))
              .toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            return (
              <View key={d.detection_id} style={[s.logCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <Ionicons
                  name={disease ? "leaf-outline" : "shield-checkmark-outline"}
                  size={18}
                  color={disease ? Colors.alert : Colors.healthy}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.logTitle, { color: C.text }]}>
                    {disease ? `${d.detected_class || "Disease"} detected` : "Healthy leaf"}
                  </Text>
                  <Text style={[s.logSub, { color: C.subtext }]}>
                    at {time}
                    {d.tier2_confidence != null && ` · confidence ${(d.tier2_confidence * 100).toFixed(0)}%`}
                  </Text>
                </View>
                {isNew && (
                  <Text style={[s.logBadge, { color: disease ? Colors.alert : Colors.healthy }]}>NEW</Text>
                )}
              </View>
            );
          })
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

    feed: { height: FEED_H, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center", justifyContent: "center", paddingHorizontal: 28,
    },
    overlayTitle: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" },
    overlaySub: { color: "rgba(209,250,229,0.65)", fontSize: 12, marginTop: 4, textAlign: "center" },
    retryBtn: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: "#fff" },
    retryText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
    corner: { position: "absolute", width: 20, height: 20, borderColor: "rgba(255,255,255,0.8)" },
    hudTop: {
      position: "absolute", top: 14, left: 16, right: 16,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    },
    liveBadge: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    },
    recDot: { width: 8, height: 8, borderRadius: 4 },
    liveBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
    timer: {
      color: "#fff", fontSize: 12, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: "hidden",
      fontVariant: ["tabular-nums"],
    },

    controls: { flexDirection: "row", gap: 10, marginTop: 14 },
    btn: { flex: 1, height: 44, borderRadius: 10, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
    btnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    toast: { marginTop: 12, fontSize: 13, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, overflow: "hidden" },

    resultsHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      marginTop: 20, marginBottom: 8,
    },
    sectionLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1 },
    errorBox: {
      flexDirection: "row", gap: 8, backgroundColor: "#FFFBEB", borderWidth: 1,
      borderColor: "#FDE68A", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
    },
    errorText: { color: "#B45309", fontSize: 12, flex: 1 },
    logCard: {
      flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12,
      borderWidth: 1, padding: 12, marginBottom: 8,
    },
    logTitle: { fontSize: 13, fontWeight: "600" },
    logSub: { fontSize: 11, marginTop: 1 },
    logBadge: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  });
}