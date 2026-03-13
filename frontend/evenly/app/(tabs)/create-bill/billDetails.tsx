import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button } from 'react-native';
import { useBillContext, BillItem } from '../../../contexts/BillContext';
import { useRouter } from 'expo-router';


export default function BillDetails() {
  const router = useRouter();

  const { response, setResponse } = useBillContext();
  const items = response?.items || [];
  const itemsWithAdd = [...items, { id: -1, name: 'Add Item', price: 0, quantity: 1 }];

  const [selectedItem, setSelectedItem] = useState<BillItem | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState('');

  const openEditModal = (item: BillItem) => {
    setSelectedItem(item);
    setEditedName(item.name);
    setEditedPrice(item.price.toString());
  };

  const saveEdits = () => {
    if (!response || !selectedItem) return;

    const isNewItem = !response.items.some((item) => item.id === selectedItem.id);

    if (isNewItem) {
      console.log(`Adding new item: ${selectedItem.id}`);
    } else {
      console.log(`Saving edits for item: ${selectedItem.id}`);
    }

    const updatedItems = isNewItem
      ? [...response.items, {
        id: selectedItem.id,
        name: editedName,
        price: parseFloat(editedPrice),
        quantity: 1
        }]
      : items.map((item) => 
        item.id === selectedItem.id
          ? { ...item, name: editedName, price: parseFloat(editedPrice) }
          : item
        );

    setResponse({
      success: response.success,
      message: response.message,
      nextId: isNewItem ? response.nextId + 1 : response.nextId,
      items: updatedItems,
      summary: response.summary
    });
    setSelectedItem(null); // close modal
  };

  const handleAddNewItem = () => {
    if (!response) return;
    const newItem: BillItem = {
      id: response.nextId,
      name: '',
      price: 0,
      quantity: 1,
    };

    setSelectedItem(newItem);
    setEditedName('New Item');
    setEditedPrice('0');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bill Details</Text>

      <FlatList
        data={itemsWithAdd}
        keyExtractor={(item: BillItem) => item.id.toString()}
        renderItem={({ item }) => {
          if (item.id === -1) {
            return (
              <TouchableOpacity onPress={handleAddNewItem}>
                <View style={[styles.itemRow, styles.addItemRow]}>
                  <Text style={styles.addItemText}>+ Add Item</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
          )
        }}
      />

      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Edit Item</Text>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              selectTextOnFocus={true}
              placeholder="Name"
            />
            <TextInput
              style={styles.input}
              value={editedPrice}
              onChangeText={setEditedPrice}
              selectTextOnFocus={true}
              placeholder="Price"
              keyboardType="numeric"
            />
            <Button title="Save" onPress={saveEdits} />
            <Button
              title="Cancel"
              color="red"
              onPress={() => setSelectedItem(null)}
            />
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.continueButton} onPress={() => router.push('/create-bill/billSummary')}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1
  },
  header: {
    fontSize: 24,
    marginBottom: 16
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc'
  },
  itemName: {
    fontSize: 16
  },
  itemPrice: {
    fontSize: 16
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    margin: 32,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    elevation: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 8,
    borderRadius: 4
  },
  continueButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24
  },
  continueText: {
    color: 'white',
    fontSize: 18
  },
  addItemRow: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#ccc'
  },
  addItemText: {
    fontSize: 16,
    color: '#007bff'
  }
});