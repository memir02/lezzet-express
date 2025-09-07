'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    restaurantId: string;
    restaurantName: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    restaurantId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Sayfa yüklendiğinde localStorage'dan sepet verilerini al
    useEffect(() => {
        if (isInitialized) return;

        try {
            const savedCart = localStorage.getItem('cart');
            const savedRestaurantId = localStorage.getItem('restaurantId');

            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                setItems(parsedCart);
            }
            if (savedRestaurantId) {
                setRestaurantId(savedRestaurantId);
            }
            setIsInitialized(true);
        } catch (error) {
            console.error('LocalStorage okuma hatası:', error);
            setIsInitialized(true);
        }
    }, [isInitialized]);

    // Sepet verileri değiştiğinde localStorage'a kaydet
    useEffect(() => {
        if (!isInitialized) return;

        try {
            localStorage.setItem('cart', JSON.stringify(items));
            if (restaurantId) {
                localStorage.setItem('restaurantId', restaurantId);
            } else {
                localStorage.removeItem('restaurantId');
            }
        } catch (error) {
            console.error('LocalStorage yazma hatası:', error);
        }
    }, [items, restaurantId, isInitialized]);

    const addToCart = useCallback((item: CartItem) => {
        if (items.length === 0 || items[0].restaurantId === item.restaurantId) {
            const existingItem = items.find(i => i.id === item.id);

            if (existingItem) {
                setItems(prevItems =>
                    prevItems.map(i =>
                        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                    )
                );
            } else {
                setItems(prevItems => [...prevItems, { ...item, quantity: 1 }]);
                setRestaurantId(item.restaurantId);
            }
        } else {
            alert('Sepetinizde başka bir restorandan ürün bulunmaktadır. Önce sepetinizi temizleyin.');
        }
    }, [items]);

    const removeFromCart = useCallback((id: string) => {
        setItems(prevItems => {
            const newItems = prevItems.filter(item => item.id !== id);
            if (newItems.length === 0) {
                setRestaurantId(null);
            }
            return newItems;
        });
    }, []);

    const updateQuantity = useCallback((id: string, quantity: number) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, quantity } : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        setRestaurantId(null);
    }, []);

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            total,
            restaurantId
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}