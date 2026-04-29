import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBill } from '../context/BillContext';
import PersonCard from '../components/PersonCard';

export default function PeopleScreen() {
  const router = useRouter();
  const { state, dispatch } = useBill();
  const [nameInput, setNameInput] = useState('');

  function addPerson() {
    const name = nameInput.trim();
    if (!name) return;
    if (state.people.includes(name)) {
      Alert.alert('Already added', `${name} is already in the list.`);
      return;
    }
    dispatch({ type: 'ADD_PERSON', payload: name });
    setNameInput('');
  }

  function handleContinue() {
    if (state.people.length === 0) {
      Alert.alert('Add people', 'Add at least one person to split the bill.');
      return;
    }
    const unassigned = state.items.filter((i) => i.assignedTo.length === 0);
    if (unassigned.length > 0) {
      Alert.alert(
        'Unassigned items',
        `${unassigned.length} item(s) have no one assigned. They won't be included in anyone's total. Continue anyway?`,
        [
          { text: 'Go back', style: 'cancel' },
          { text: 'Continue', onPress: () => router.push('/summary') },
        ],
      );
      return;
    }
    router.push('/summary');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Person's name"
          value={nameInput}
          onChangeText={setNameInput}
          onSubmitEditing={addPerson}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addPerson}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {state.items.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.people}>
              {state.people.length === 0 ? (
                <Text style={styles.noPeople}>Add people above to assign items.</Text>
              ) : (
                state.people.map((person) => {
                  const assigned = item.assignedTo.includes(person);
                  return (
                    <TouchableOpacity
                      key={person}
                      style={[styles.chip, assigned && styles.chipActive]}
                      onPress={() => dispatch({ type: 'TOGGLE_ASSIGN', payload: { itemId: item.id, person } })}
                    >
                      <Text style={[styles.chipText, assigned && styles.chipTextActive]}>
                        {person}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <FlatList
          horizontal
          data={state.people}
          keyExtractor={(p) => p}
          renderItem={({ item: person }) => (
            <PersonCard
              name={person}
              onRemove={() => dispatch({ type: 'REMOVE_PERSON', payload: person })}
            />
          )}
          contentContainerStyle={styles.personList}
          ListEmptyComponent={<Text style={styles.noPeople}>No people added yet.</Text>}
        />
        <TouchableOpacity style={styles.btn} onPress={handleContinue}>
          <Text style={styles.btnText}>See Summary →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  addRow: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  input: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  addBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 18, borderRadius: 10, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  scroll: { padding: 16, gap: 12, paddingBottom: 8 },
  itemBlock: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  chipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  noPeople: { fontSize: 13, color: '#9CA3AF' },
  footer: { borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff', paddingTop: 12, gap: 12, paddingBottom: 16, paddingHorizontal: 16 },
  personList: { gap: 8, paddingBottom: 4 },
  btn: { backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
