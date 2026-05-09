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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
    <LinearGradient colors={['#1a0b38', '#11052c', '#0a0118']} style={styles.gradient}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BlurView intensity={25} tint="dark" style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Person's name"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={nameInput}
            onChangeText={setNameInput}
            onSubmitEditing={addPerson}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addPerson}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </BlurView>

        <ScrollView contentContainerStyle={styles.scroll}>
          {state.items.map((item) => (
            <View key={item.id} style={styles.itemBlock}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.chips}>
                {state.people.length === 0 ? (
                  <Text style={styles.dimText}>Add people above to assign items.</Text>
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

        <BlurView intensity={40} tint="dark" style={styles.footer}>
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
            ListEmptyComponent={<Text style={styles.dimText}>No people added yet.</Text>}
          />
          <TouchableOpacity activeOpacity={0.85} onPress={handleContinue}>
            <LinearGradient
              colors={['#9333ea', '#6d28d9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>See Summary</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  inner: { flex: 1 },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#fff',
  },
  addBtn: {
    backgroundColor: 'rgba(147, 51, 234, 0.8)',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scroll: { padding: 16, gap: 12, paddingBottom: 8 },
  itemBlock: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1, marginRight: 8 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#c084fc' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  chipActive: {
    backgroundColor: 'rgba(147, 51, 234, 0.7)',
    borderColor: 'rgba(192, 132, 252, 0.5)',
  },
  chipText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  dimText: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  footer: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  personList: { gap: 8, paddingBottom: 4 },
  btn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
