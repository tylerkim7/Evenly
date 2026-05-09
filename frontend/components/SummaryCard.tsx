import { StyleSheet, Text, View } from 'react-native';
import { PersonOwed } from '../utils/calculateOwed';

interface Props {
  entry: PersonOwed;
}

export default function SummaryCard({ entry }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{entry.person}</Text>
        <Text style={styles.total}>${entry.total.toFixed(2)}</Text>
      </View>
      {entry.items.map((item, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemShare}>${item.share.toFixed(2)}</Text>
        </View>
      ))}
      {entry.items.length === 0 && (
        <Text style={styles.nothing}>No items assigned.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: '#fff' },
  total: {
    fontSize: 22,
    fontWeight: '800',
    color: '#c084fc',
    textShadowColor: 'rgba(192,132,252,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingVertical: 1,
  },
  itemName: { fontSize: 14, color: 'rgba(255,255,255,0.55)', flex: 1, marginRight: 8 },
  itemShare: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  nothing: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' },
});
