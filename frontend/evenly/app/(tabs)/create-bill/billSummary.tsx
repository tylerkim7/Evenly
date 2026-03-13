import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useBillContext, BillItem, Person } from '../../../contexts/BillContext';
import { useRouter } from 'expo-router';

export default function BillSummary() {
  const router = useRouter();
  const { response, setResponse, people, setPeople, resetBill } = useBillContext();

  const items = response?.items ?? [];

  const [newPersonName, setNewPersonName] = useState('');

  const addPerson = () => {
    const trimmed = newPersonName.trim();
    if (!trimmed) return;

    const nextId = people.length ? Math.max(...people.map((p) => p.id)) + 1 : 1;
    const newPerson: Person = { id: nextId, name: trimmed };
    setPeople([...people, newPerson]);
    setNewPersonName('');
  };

  const removePerson = (personId: number) => {
    const remaining = people.filter((p) => p.id !== personId);
    setPeople(remaining);

    if (!response) return;

    const updatedItems = response.items.map((item) =>
      item.assignedTo === personId ? { ...item, assignedTo: null } : item
    );

    setResponse({
      ...response,
      items: updatedItems,
    });
  };

  const assignItemToPerson = (itemId: number, personId: number | null) => {
    if (!response) return;

    const updatedItems: BillItem[] = response.items.map((item) =>
      item.id === itemId ? { ...item, assignedTo: personId } : item
    );

    setResponse({
      ...response,
      items: updatedItems,
    });
  };

  const totalsByPerson = useMemo(() => {
    const totals = new Map<number, number>();
    let unassignedTotal = 0;

    items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      if (item.assignedTo == null) {
        unassignedTotal += lineTotal;
      } else {
        const current = totals.get(item.assignedTo) ?? 0;
        totals.set(item.assignedTo, current + lineTotal);
      }
    });

    return { totals, unassignedTotal };
  }, [items]);

  const handleStartOver = () => {
    resetBill();
    router.push('/createBill');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Split Summary</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>People</Text>
        <View style={styles.addPersonRow}>
          <TextInput
            style={styles.input}
            value={newPersonName}
            onChangeText={setNewPersonName}
            placeholder="Add a name (e.g. Alex)"
          />
          <TouchableOpacity style={styles.addButton} onPress={addPerson}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chipRow}>
          {people.map((person) => (
            <View key={person.id} style={styles.personChip}>
              <Text style={styles.personChipText}>{person.name}</Text>
              <TouchableOpacity onPress={() => removePerson(person.id)}>
                <Text style={styles.personChipRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {people.length === 0 && (
            <Text style={styles.helperText}>Add people to start assigning items.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assign Items</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  ${item.price.toFixed(2)} {item.quantity > 1 ? `× ${item.quantity}` : ''}
                </Text>
              </View>
              <View style={styles.assignmentRow}>
                <TouchableOpacity
                  style={[
                    styles.assignmentChip,
                    item.assignedTo == null && styles.assignmentChipSelected,
                  ]}
                  onPress={() => assignItemToPerson(item.id, null)}
                >
                  <Text
                    style={[
                      styles.assignmentChipText,
                      item.assignedTo == null && styles.assignmentChipTextSelected,
                    ]}
                  >
                    Unassigned
                  </Text>
                </TouchableOpacity>
                {people.map((person) => {
                  const selected = item.assignedTo === person.id;
                  return (
                    <TouchableOpacity
                      key={person.id}
                      style={[styles.assignmentChip, selected && styles.assignmentChipSelected]}
                      onPress={() => assignItemToPerson(item.id, person.id)}
                    >
                      <Text
                        style={[
                          styles.assignmentChipText,
                          selected && styles.assignmentChipTextSelected,
                        ]}
                      >
                        {person.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Totals</Text>
        {people.map((person) => {
          const total = totalsByPerson.totals.get(person.id) ?? 0;
          return (
            <View key={person.id} style={styles.totalRow}>
              <Text style={styles.totalName}>{person.name}</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
            </View>
          );
        })}
        <View style={styles.totalRow}>
          <Text style={styles.totalName}>Unassigned</Text>
          <Text style={styles.totalAmount}>${totalsByPerson.unassignedTotal.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startOverButton} onPress={handleStartOver}>
        <Text style={styles.startOverText}>Start a new bill</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  addPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    gap: 4,
  },
  personChipText: {
    fontSize: 13,
  },
  personChipRemove: {
    fontSize: 12,
    color: '#6b7280',
  },
  helperText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemInfo: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 13,
    color: '#6b7280',
  },
  assignmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignmentChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  assignmentChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  assignmentChipText: {
    fontSize: 12,
    color: '#111827',
  },
  assignmentChipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalName: {
    fontSize: 14,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  startOverButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startOverText: {
    color: '#2563eb',
    fontWeight: '500',
  },
});

