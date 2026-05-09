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
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoFocus
        />
        <View style={styles.editRow}>
          <Text style={styles.dollar}>$</Text>
          <TextInput
            style={styles.priceInput}
            value={priceText}
            onChangeText={setPriceText}
            keyboardType="decimal-pad"
            placeholderTextColor="rgba(255,255,255,0.3)"
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cardEditing: {
    flexDirection: 'column',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.11)',
  },
  itemName: { fontSize: 15, color: '#fff', fontWeight: '500', flex: 1 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#c084fc', marginLeft: 8 },
  nameInput: {
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dollar: { fontSize: 15, color: 'rgba(255,255,255,0.5)' },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  saveBtn: {
    backgroundColor: 'rgba(147,51,234,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.3)',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  deleteBtnText: { color: '#fca5a5', fontWeight: '600', fontSize: 14 },
});
