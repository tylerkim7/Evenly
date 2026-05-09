import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
    <LinearGradient colors={['#1a0b38', '#11052c', '#0a0118']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={['rgba(147,51,234,0.6)', 'rgba(109,40,217,0.4)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <View style={styles.totalCardInner}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalAmount}>${grandTotal.toFixed(2)}</Text>
          </View>
        </LinearGradient>

        {owedList.map((entry) => (
          <SummaryCard key={entry.person} entry={entry} />
        ))}

        {owedList.length === 0 && (
          <Text style={styles.empty}>No people or items found. Go back and start over.</Text>
        )}
      </ScrollView>

      <BlurView intensity={40} tint="dark" style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleStartOver}>
          <LinearGradient
            colors={['rgba(220,38,38,0.85)', 'rgba(153,27,27,0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Start Over</Text>
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 8 },
  totalCard: {
    borderRadius: 22,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.3)',
    overflow: 'hidden',
  },
  totalCardInner: {
    padding: 28,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  totalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' },
  totalAmount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    textShadowColor: 'rgba(192,132,252,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 60, fontSize: 15 },
  footer: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  btn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
