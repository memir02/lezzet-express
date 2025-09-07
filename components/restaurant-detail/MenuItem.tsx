'use client';

import { useCart } from '@/app/context/CartContext';

interface MenuItemProps {
    item: {
        id: string;
        name: string;
        price: number;
        description: string | null;
        image: string | null;
        category: string;
        available: boolean;
    };
    restaurant: {
        id: string;
        name: string;
    };
}

export default function MenuItem({ item, restaurant }: MenuItemProps) {
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        if (!item.available) {
            alert('Bu ürün şu anda mevcut değil.');
            return;
        }

        addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {item.image && (
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                {item.description && (
                    <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{item.price.toFixed(2)} ₺</span>
                    <button
                        onClick={handleAddToCart}
                        disabled={!item.available}
                        className={`px-4 py-2 rounded-lg transition-colors ${item.available
                            ? 'bg-[#7F0005] text-white hover:bg-opacity-90'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {item.available ? 'Sepete Ekle' : 'Mevcut Değil'}
                    </button>
                </div>
            </div>
        </div>
    );
}
