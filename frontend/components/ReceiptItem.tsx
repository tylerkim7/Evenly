import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReceiptItem as ReceiptItemType } from '../context/BillContext';

interface Props {
  item: ReceiptItemType;
  editing: boolean;
  onPress: () => void;
  onSave: (id: string, name: string, price: number) => void;
  onDelete: () => void;
}

export default function ReceiptItem({ item, editing, onPress, onSave, onDelete }: Props) {
  const [name, setName] = useState(item.name);
  const [priceText, setPriceText] = useState(item.price.toFixed(2));

  function save() {
    const price = parseFloat(priceText);
    if (isNaN(price) || price < 0) return;
    onSave(item.id, name.trim() || item.name, price);
  }

  if (editing) {
    return (
      <View style={[styles.card, styles.cardEditing]}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Item name"
          autoFocus
        />
        <View style={styles.editRow}>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            style={styles.priceInput}
            value={priceText}
            onChangeText={setPriceText}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardEditing: {
    flexDirection: 'column',
    gap: 10,
  },
  itemName: { fontSize: 15, color: '#111827', flex: 1 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#4F46E5', marginLeft: 8 },
  nameInput: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111827',
  },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dollar: { fontSize: 15, color: '#6B7280' },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111827',
  },
  saveBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  deleteBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
});
