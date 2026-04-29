import { ReceiptItem } from '../context/BillContext';

export interface PersonOwed {
  person: string;
  total: number;
  items: { name: string; share: number }[];
}

export function calculateOwed(items: ReceiptItem[], people: string[]): PersonOwed[] {
  return people.map((person) => {
    const personItems: { name: string; share: number }[] = [];
    let total = 0;

    for (const item of items) {
      if (item.assignedTo.includes(person)) {
        const share = item.price / item.assignedTo.length;
        personItems.push({ name: item.name, share });
        total += share;
      }
    }

    return { person, total, items: personItems };
  });
}
