import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useBill } from '../context/BillContext';
import { parseReceiptItems } from '../utils/parseReceipt';
import { OCR_URL } from '../config';

export default function HomeScreen() {
  const router = useRouter();
  const { dispatch } = useBill();
  const [loading, setLoading] = useState(false);

  async function pickAndUpload(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to continue.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      const response = await fetch(OCR_URL, { method: 'POST', body: formData });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Server error ${response.status}`);
      }

      const data = (await response.json()) as {
        items: { id: string; name: string; price: number }[];
      };

      dispatch({ type: 'RESET' });
      dispatch({ type: 'SET_ITEMS', payload: parseReceiptItems(data.items) });
      router.push('/review');
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#2d1b69', '#11052c', '#0a0118']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.logo}>Evenly</Text>
          <Text style={styles.subtitle}>Split any receipt, fairly.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#c084fc" />
            <Text style={styles.loadingText}>Reading receipt…</Text>
          </View>
        ) : (
          <View style={styles.buttons}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => pickAndUpload(true)}>
              <LinearGradient
                colors={['#9333ea', '#6d28d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => pickAndUpload(false)}>
              <BlurView intensity={25} tint="light" style={styles.glassBtn}>
                <Text style={styles.glassBtnText}>Choose from Library</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 28, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  logo: {
    fontSize: 60,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -2,
    textShadowColor: 'rgba(192, 132, 252, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  loadingBox: { alignItems: 'center', gap: 14, paddingBottom: 12 },
  loadingText: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  buttons: { gap: 14 },
  primaryBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  glassBtn: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassBtnText: { color: 'rgba(255,255,255,0.9)', fontSize: 17, fontWeight: '600', letterSpacing: 0.3 },
});
