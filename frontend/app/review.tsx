import { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBill } from '../context/BillContext';
import ReceiptItem from '../components/ReceiptItem';

export default function ReviewScreen() {
  const router = useRouter();
  const { state, dispatch } = useBill();
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleUpdate(id: string, name: string, price: number) {
    dispatch({ type: 'UPDATE_ITEM', payload: { id, name, price } });
    setEditingId(null);
  }

  function handleDelete(id: string) {
    Alert.alert('Remove item?', 'This item will not be included in the split.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_ITEM', payload: id }) },
    ]);
  }

  function handleContinue() {
    if (state.items.length === 0) {
      Alert.alert('No items', 'Add at least one item before continuing.');
      return;
    }
    router.push('/people');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Tap an item to edit its name or price. Swipe left to delete.</Text>
      <FlatList
        data={state.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReceiptItem
            item={item}
            editing={editingId === item.id}
            onPress={() => setEditingId(editingId === item.id ? null : item.id)}
            onSave={handleUpdate}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No items found. Go back and try another photo.</Text>
        }
      />
      <View style={styles.footer}>
        <Text style={styles.total}>
          Total: $
          {state.items.reduce((sum, i) => sum + i.price, 0).toFixed(2)}
        </Text>
        <TouchableOpacity style={styles.btn} onPress={handleContinue}>
          <Text style={styles.btnText}>Add People →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 8 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 48, fontSize: 15 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    gap: 12,
  },
  total: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'right' },
  btn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
