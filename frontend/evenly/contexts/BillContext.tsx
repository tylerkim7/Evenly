import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BillItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  assignedTo?: number | null;
}

export interface BillSummaryLine {
  label: string;
  value: number;
}

export interface BillResponse {
  success: boolean;
  message: string;
  items: BillItem[];
  nextId: number;
  summary?: BillSummaryLine[];
}

export interface Person {
  id: number;
  name: string;
}

interface BillContextValue {
  response: BillResponse | null;
  setResponse: (response: BillResponse | null) => void;
  people: Person[];
  setPeople: (people: Person[]) => void;
  resetBill: () => void;
}

const BillContext = createContext<BillContextValue | undefined>(undefined);

export function BillProvider({ children }: { children: ReactNode }) {
  const [response, setResponse] = useState<BillResponse | null>(null);
  const [people, setPeople] = useState<Person[]>([]);

  const resetBill = () => {
    setResponse(null);
    setPeople([]);
  };

  return (
    <BillContext.Provider
      value={{
        response,
        setResponse,
        people,
        setPeople,
        resetBill,
      }}
    >
      {children}
    </BillContext.Provider>
  );
}

export function useBillContext() {
  const ctx = useContext(BillContext);
  if (!ctx) {
    throw new Error('useBillContext must be used within a BillProvider');
  }
  return ctx;
}

