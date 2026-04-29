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
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  total: { fontSize: 20, fontWeight: '800', color: '#4F46E5' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingVertical: 2,
  },
  itemName: { fontSize: 14, color: '#6B7280', flex: 1, marginRight: 8 },
  itemShare: { fontSize: 14, color: '#374151', fontWeight: '500' },
  nothing: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
});
