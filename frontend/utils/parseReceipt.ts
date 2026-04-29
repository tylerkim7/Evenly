import { ReceiptItem } from '../context/BillContext';

export function parseReceiptItems(rawItems: { id: string; name: string; price: number }[]): ReceiptItem[] {
  return rawItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    assignedTo: [],
  }));
}
