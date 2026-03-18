import { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useBillContext, BillItem, BillSummaryLine, BillResponse } from '../../contexts/BillContext';

// For Expo Web on this machine, localhost works. For a phone on Wi‑Fi, swap this to your PC's LAN IP.
const OCR_BASE_URL = 'http://192.168.1.9:8080';
type OcrItem =
  | { name: string; price: number; quantity: number }
  | { subtotal: number }
  | { tax: number }
  | { total: number };

interface OcrResponseBody {
  status?: string;
  message?: string;
  items?: OcrItem[];
  data?: string; // raw OCR text from /parse-receipt
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

  const mapStructuredOcrToBill = (body: OcrResponseBody): BillResponse => {
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

  const mapOcrTextToBill = (text: string): BillResponse => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const billItems: BillItem[] = [];
    const summaryLines: BillSummaryLine[] = [];

    // Skip lines that are receipt headers/footers or totals, not line items.
    const skipPatterns =
      /^(SUBTOTAL|TAX|TOTAL|CARD|TYPE|ENTRY|TIME|REF|STATUS|PHONE|WWW|RECEIPT|TABLE|SERVER|GUESTS|DATE|ADDRESS|TIP|THANK|PLEASE|DINEFINE|CULINARY|DOWNTOWN|INVALID)/i;

    // Match: optional "2X " quantity, then item name, then $price or price at end.
    // e.g. "2X CAESAR SALAD                    $24.00" or "GRILLED SALMON $22.00" or "CHEESECAKE 7.50"
    // Optional quantity: "2x " or "2 ", then item name, then price.
    const itemPattern = /^\s*(?:(\d+)\s*(?:[xX]\s+)?)?(.+?)\s+\$?(\d+\.\d{1,2})\s*$/;

    lines.forEach((line) => {
      const match = line.match(itemPattern);
      if (!match) {
        // Try to capture subtotal/tax/total for summary.
        const subMatch = line.match(/^\s*(SUBTOTAL|TAX|TOTAL)\s*:?\s*\$?(\d+\.\d{1,2})\s*$/i);
        if (subMatch) {
          const label = subMatch[1].charAt(0).toUpperCase() + subMatch[1].slice(1).toLowerCase();
          summaryLines.push({ label, value: parseFloat(subMatch[2]) });
        }
        return;
      }

      const quantity = match[1] ? parseInt(match[1], 10) : 1;
      const name = match[2].replace(/\s+/g, ' ').trim();
      const price = parseFloat(match[3]);

      if (!name || Number.isNaN(price) || quantity < 1) {
        return;
      }
      if (skipPatterns.test(name)) {
        return;
      }

      billItems.push({
        id: billItems.length,
        name: quantity > 1 ? `${quantity}x ${name}` : name,
        price,
        quantity,
        assignedTo: null,
      });
    });

    return {
      success: true,
      message: 'Receipt scanned',
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

      // Get image: on web use library picker; on native use camera.
      let uri: string | null = imageUri;
      if (Platform.OS === 'web') {
        if (!uri) {
          const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permissionResult.granted) {
            setError('Permission to access photos is required to scan.');
            return;
          }
          const pickResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (pickResult.canceled || !pickResult.assets[0]?.uri) {
            setError('No image selected.');
            return;
          }
          uri = pickResult.assets[0].uri;
          setImageUri(uri);
        }
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera permission is required to scan a receipt.');
          return;
        }
        const captured = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (captured.canceled || !captured.assets?.[0]?.uri) {
          setError('Scan cancelled.');
          return;
        }
        uri = captured.assets[0].uri;
        setImageUri(uri);
      }

      if (!uri) {
        setError('No image to scan.');
        return;
      }

      // Send image to OCR service (PaddleOCR) and parse response.
      const formData = new FormData();
      // Cast to any so React Native's file object shape is accepted by TS.
      formData.append('file', {
        uri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await fetch(`${OCR_BASE_URL}/parse-receipt`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`OCR service returned ${res.status}`);
      }

      const body = (await res.json()) as OcrResponseBody;

      if (body.items && body.items.length > 0) {
        const mapped = mapStructuredOcrToBill(body);
        setResponse(mapped);
      } else if (body.data) {
        const mapped = mapOcrTextToBill(body.data);
        setResponse(mapped);
      } else {
        throw new Error('OCR service did not return any usable data.');
      }

      router.push('/create-bill/billDetails');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Unable to reach the OCR service. ${message}`);
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
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Evenly</Text>
      </View>

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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: -20,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
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

