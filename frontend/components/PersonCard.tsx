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
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
  },
  name: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  remove: { fontSize: 13, color: '#818CF8', fontWeight: '700' },
});
