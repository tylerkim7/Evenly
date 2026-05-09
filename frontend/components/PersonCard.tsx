import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  name: string;
  onRemove: () => void;
}

export default function PersonCard({ name, onRemove }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.remove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147,51,234,0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.35)',
  },
  name: { fontSize: 14, fontWeight: '600', color: '#e9d5ff' },
  remove: { fontSize: 12, color: 'rgba(233,213,255,0.6)', fontWeight: '700' },
});
