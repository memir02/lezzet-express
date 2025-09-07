'use client';

import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

export default function ThankYouPage() {
    const { clearCart } = useCart();
    const router = useRouter();

    useEffect(() => {
        // Sayfa yüklendiğinde sepeti temizle
        const clearCartAndRedirect = async () => {
            try {
                await clearCart();
                // Sepet temizlendikten sonra localStorage'ı da temizle
                localStorage.removeItem('cart');
                localStorage.removeItem('restaurantId');
            } catch (error) {
                console.error('Sepet temizlenirken hata:', error);
            }
        };

        clearCartAndRedirect();
    }, []); // Sadece bir kez çalışması için boş dependency array

    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-4">Siparişiniz Alındı!</h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Siparişiniz başarıyla oluşturuldu. Restoranımız en kısa sürede siparişinizi hazırlamaya başlayacak.
                    </p>
                    <button
                        onClick={() => router.push('/order-tracking')}
                        className="px-6 py-3 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        Siparişimi Takip Et
                    </button>
                </div>
            </main>
            <Footer />
        </>
    );
} 