import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useBill } from '../context/BillContext';
import { parseReceiptItems } from '../utils/parseReceipt';

const OCR_URL = 'http://192.168.68.52:8000/ocr';

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
    <View style={styles.container}>
      <Text style={styles.logo}>Evenly</Text>
      <Text style={styles.subtitle}>Split any receipt, fairly.</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Reading receipt…</Text>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={() => pickAndUpload(true)}>
            <Text style={styles.btnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => pickAndUpload(false)}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 48,
  },
  buttons: {
    width: '100%',
    gap: 16,
  },
  btn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  btnTextSecondary: {
    color: '#4F46E5',
  },
  loadingBox: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
