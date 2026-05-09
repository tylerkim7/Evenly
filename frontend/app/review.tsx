import { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
    <LinearGradient colors={['#1a0b38', '#11052c', '#0a0118']} style={styles.gradient}>
      <Text style={styles.hint}>Tap an item to edit its name or price.</Text>
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
      <BlurView intensity={40} tint="dark" style={styles.footer}>
        <Text style={styles.total}>
          Total{'  '}
          <Text style={styles.totalAmount}>
            ${state.items.reduce((sum, i) => sum + i.price, 0).toFixed(2)}
          </Text>
        </Text>
        <TouchableOpacity activeOpacity={0.85} onPress={handleContinue}>
          <LinearGradient
            colors={['#9333ea', '#6d28d9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Add People</Text>
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  hint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  list: { paddingHorizontal: 16, paddingBottom: 8 },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 60, fontSize: 15 },
  footer: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  total: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '500', textAlign: 'right' },
  totalAmount: { fontSize: 20, color: '#fff', fontWeight: '800' },
  btn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
