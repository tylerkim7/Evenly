import { Stack } from 'expo-router';
import { BillProvider } from '../context/BillContext';

export default function RootLayout() {
  return (
    <BillProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#4F46E5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Evenly' }} />
        <Stack.Screen name="review" options={{ title: 'Review Items' }} />
        <Stack.Screen name="people" options={{ title: 'Add People & Assign' }} />
        <Stack.Screen name="summary" options={{ title: 'Summary' }} />
      </Stack>
    </BillProvider>
  );
}
