import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useBill } from '../context/BillContext';
import { calculateOwed } from '../utils/calculateOwed';
import SummaryCard from '../components/SummaryCard';

export default function SummaryScreen() {
  const router = useRouter();
  const { state, dispatch } = useBill();
  const owedList = calculateOwed(state.items, state.people);
  const grandTotal = state.items.reduce((sum, i) => sum + i.price, 0);

  function handleStartOver() {
    dispatch({ type: 'RESET' });
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Grand Total</Text>
          <Text style={styles.headerTotal}>${grandTotal.toFixed(2)}</Text>
        </View>

        {owedList.map((entry) => (
          <SummaryCard key={entry.person} entry={entry} />
        ))}

        {owedList.length === 0 && (
          <Text style={styles.empty}>No people or items found. Go back and start over.</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={handleStartOver}>
          <Text style={styles.btnText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, gap: 12, paddingBottom: 8 },
  header: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLabel: { color: '#C7D2FE', fontSize: 14, fontWeight: '500' },
  headerTotal: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 48, fontSize: 15 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
  btn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
