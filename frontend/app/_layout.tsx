import { Stack } from 'expo-router';
import { BillProvider } from '../context/BillContext';

export default function RootLayout() {
  return (
    <BillProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a0b38' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700', color: '#fff' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ title: 'Review Items' }} />
        <Stack.Screen name="people" options={{ title: 'Add People & Assign' }} />
        <Stack.Screen name="summary" options={{ title: 'Summary' }} />
      </Stack>
    </BillProvider>
  );
}
