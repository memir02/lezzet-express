'use client';

import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, total, restaurantId } = useCart();
    const router = useRouter();

    if (items.length === 0) {
        return (
            <>
                <Header2 />
                <main className="container mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
                    <button
                        onClick={() => router.push('/restaurants')}
                        className="px-4 py-2 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        Restoranları Keşfet
                    </button>
                </main>
                <Footer />
            </>
        );
    }

    const handleCheckout = () => {
        if (!restaurantId) {
            alert('Sepetinizde ürün bulunmamaktadır.');
            return;
        }
        router.push(`/checkout?restaurantId=${restaurantId}`);
    };

    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Sepetiniz</h1>
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                            <div>
                                <h3 className="font-bold">{item.name}</h3>
                                <p className="text-gray-600">{item.price.toFixed(2)} ₺</p>
                                <p className="text-sm text-gray-500">{item.restaurantName}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Kaldır
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">Toplam:</span>
                        <span className="font-bold text-xl">{total.toFixed(2)} ₺</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="w-full px-4 py-2 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        Ödeme Yap
                    </button>
                </div>
            </main>
            <Footer />
        </>
    );
}