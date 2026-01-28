import { create } from 'zustand';

interface LiveState {
    prices: Record<string, number>;
    notifications: any[];
    updatePrice: (symbol: string, price: number) => void;
    addNotification: (notification: any) => void;
    clearNotifications: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
    prices: {},
    notifications: [],
    updatePrice: (symbol, price) =>
        set((state) => ({
            prices: { ...state.prices, [symbol]: price }
        })),
    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications].slice(0, 5)
        })),
    clearNotifications: () => set({ notifications: [] }),
}));
