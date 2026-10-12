import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Highlighted LIVE button in the middle of the tab bar
function LiveTabButton({ onPress, accessibilityState }: any) {
  const focused = accessibilityState?.selected;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.liveWrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.livePill, focused && styles.livePillFocused]}
      >
        <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
        <Text style={styles.liveText}>LIVE</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1B4332',
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#1C2B22' : '#FFFFFF',
          borderTopColor: isDark ? '#2D3D33' : '#E5E7EB',
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Farm Map',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarButton: (props: any) => <LiveTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  liveWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 4,
  },
  livePillFocused: { borderColor: '#FCA5A5' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  liveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});