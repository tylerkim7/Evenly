import { Stack } from "expo-router";
import { BillProvider } from "../contexts/BillContext";

export default function RootLayout() {
  return (
    <BillProvider>
      <Stack />
    </BillProvider>
  );
}
