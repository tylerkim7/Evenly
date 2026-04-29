import React, { createContext, useContext, useReducer } from 'react';

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[];
}

interface BillState {
  items: ReceiptItem[];
  people: string[];
}

type BillAction =
  | { type: 'SET_ITEMS'; payload: ReceiptItem[] }
  | { type: 'UPDATE_ITEM'; payload: { id: string; name: string; price: number } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'ADD_PERSON'; payload: string }
  | { type: 'REMOVE_PERSON'; payload: string }
  | { type: 'TOGGLE_ASSIGN'; payload: { itemId: string; person: string } }
  | { type: 'RESET' };

const initialState: BillState = { items: [], people: [] };

function billReducer(state: BillState, action: BillAction): BillState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload };

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, name: action.payload.name, price: action.payload.price }
            : item,
        ),
      };

    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };

    case 'ADD_PERSON':
      if (state.people.includes(action.payload)) return state;
      return { ...state, people: [...state.people, action.payload] };

    case 'REMOVE_PERSON':
      return {
        ...state,
        people: state.people.filter((p) => p !== action.payload),
        items: state.items.map((item) => ({
          ...item,
          assignedTo: item.assignedTo.filter((p) => p !== action.payload),
        })),
      };

    case 'TOGGLE_ASSIGN': {
      const { itemId, person } = action.payload;
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== itemId) return item;
          const already = item.assignedTo.includes(person);
          return {
            ...item,
            assignedTo: already
              ? item.assignedTo.filter((p) => p !== person)
              : [...item.assignedTo, person],
          };
        }),
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface BillContextValue {
  state: BillState;
  dispatch: React.Dispatch<BillAction>;
}

const BillContext = createContext<BillContextValue | undefined>(undefined);

export function BillProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(billReducer, initialState);
  return <BillContext.Provider value={{ state, dispatch }}>{children}</BillContext.Provider>;
}

export function useBill(): BillContextValue {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error('useBill must be used inside BillProvider');
  return ctx;
}
