import { create } from 'zustand';

interface CaseStore {
  currentCase: any | null;
  setCurrentCase: (c: any) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  activeFilters: any;
  setFilters: (f: Partial<any>) => void;
}

export const useCaseStore = create<CaseStore>((set) => ({
  currentCase: null,
  setCurrentCase: (c) => set({ currentCase: c }),
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { theme: newTheme };
  }),
  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  activeFilters: {},
  setFilters: (f) => set((state) => ({ activeFilters: { ...state.activeFilters, ...f } }))
}));
