import { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useBillContext, BillItem, BillSummaryLine, BillResponse } from '../../contexts/BillContext';

const OCR_BASE_URL = 'http://192.168.1.11:8080';

type OcrItem =
  | { name: string; price: number; quantity: number }
  | { subtotal: number }
  | { tax: number }
  | { total: number };

interface OcrResponseBody {
  status?: string;
  message?: string;
  items?: OcrItem[];
}

export default function CreateBillScreen() {
  const router = useRouter();
  const { setResponse, resetBill, setPeople } = useBillContext();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      setIsPicking(true);
      setError(null);

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setError('Permission to access media library is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0]?.uri;
        if (uri) {
          setImageUri(uri);
        }
      }
    } catch (e) {
      setError('Something went wrong while picking the image.');
    } finally {
      setIsPicking(false);
    }
  };

  const mapOcrResponseToBill = (body: OcrResponseBody): BillResponse => {
    const rawItems = body.items ?? [];

    const billItems: BillItem[] = [];
    const summaryLines: BillSummaryLine[] = [];

    rawItems.forEach((entry, index) => {
      if ('name' in entry && typeof entry.price === 'number') {
        billItems.push({
          id: index,
          name: entry.name,
          price: entry.price,
          quantity: entry.quantity ?? 1,
          assignedTo: null,
        });
      } else if ('subtotal' in entry && typeof entry.subtotal === 'number') {
        summaryLines.push({ label: 'Subtotal', value: entry.subtotal });
      } else if ('tax' in entry && typeof entry.tax === 'number') {
        summaryLines.push({ label: 'Tax', value: entry.tax });
      } else if ('total' in entry && typeof entry.total === 'number') {
        summaryLines.push({ label: 'Total', value: entry.total });
      }
    });

    return {
      success: (body.status ?? '').toLowerCase() === 'success',
      message: body.message ?? 'Receipt processed',
      items: billItems,
      nextId: billItems.length,
      summary: summaryLines,
    };
  };

  const handleScanReceipt = async () => {
    try {
      setIsScanning(true);
      setError(null);

      // Reset any previous bill state when starting a new scan.
      resetBill();
      setPeople([]);

      const res = await fetch(`${OCR_BASE_URL}/test-api`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error(`OCR service returned ${res.status}`);
      }

      const body = (await res.json()) as OcrResponseBody;
      const mapped = mapOcrResponseToBill(body);

      setResponse(mapped);
      router.push('/create-bill/billDetails');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(
        `Unable to reach the OCR service. ${message} Make sure your PC's IP is correct and port 8080 is allowed in Windows Firewall.`
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualStart = () => {
    resetBill();
    setPeople([]);

    const empty: BillResponse = {
      success: true,
      message: 'Manual entry',
      items: [],
      nextId: 0,
      summary: [],
    };

    setResponse(empty);
    router.push('/create-bill/billDetails');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Bill</Text>
      <Text style={styles.subtitle}>
        Start by scanning a receipt or jump straight into adding items manually.
      </Text>

      <TouchableOpacity style={styles.card} onPress={handlePickImage} disabled={isPicking || isScanning}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap to choose a receipt photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, (isScanning || isPicking) && styles.disabledButton]}
        onPress={handleScanReceipt}
        disabled={isScanning || isPicking}
      >
        {isScanning ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Scan Receipt</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleManualStart} disabled={isScanning}>
        <Text style={styles.secondaryButtonText}>Skip scan, enter items manually</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 16,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    marginTop: 12,
    color: '#b91c1c',
  },
});

