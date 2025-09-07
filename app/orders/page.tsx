'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    id: string;
    restaurantId: string;
    restaurantName: string;
    items: OrderItem[];
    totalPrice: number;
    status: string;
    orderedAt: string;
    deliveryAddress: string;
}

export default function OrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (session?.user) {
            fetchOrders();
        }
    }, [status, session, router]);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            if (!response.ok) throw new Error('Siparişler alınamadı');
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            setError('Siparişler yüklenirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Sipariş iptal edilemedi');

            // Siparişleri yeniden yükle
            fetchOrders();
        } catch (err) {
            setError('Sipariş iptal edilirken bir hata oluştu');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'beklemede':
                return 'bg-yellow-100 text-yellow-800';
            case 'hazirlaniyor':
                return 'bg-blue-100 text-blue-800';
            case 'yolda':
                return 'bg-purple-100 text-purple-800';
            case 'tamamlandi':
                return 'bg-green-100 text-green-800';
            case 'iptal_edildi':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'beklemede':
                return 'Beklemede';
            case 'hazirlaniyor':
                return 'Hazırlanıyor';
            case 'yolda':
                return 'Yolda';
            case 'tamamlandi':
                return 'Teslim Edildi';
            case 'iptal_edildi':
                return 'İptal Edildi';
            default:
                return status;
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <>
                <Header2 />
                <main className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center min-h-[60vh]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7F0005]"></div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-6">Siparişlerim</h1>

                {error && (
                    <div className="bg-red-100  border-[#7F0005] text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">Henüz siparişiniz bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg shadow-md p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-semibold">
                                            {order.restaurantName}
                                        </h2>
                                        <p className="text-lg text-gray-600">
                                            {formatDate(order.orderedAt)}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-lg ${getStatusColor(
                                            order.status
                                        )}`}
                                    >
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between text-lg"
                                        >
                                            <span>
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span>
                                                {item.price.toLocaleString('tr-TR', {
                                                    style: 'currency',
                                                    currency: 'TRY',
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-lg text-gray-600">
                                                Teslimat Adresi:
                                            </p>
                                            <p className="text-lg">{order.deliveryAddress}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg text-gray-600"> Toplam </p>
                                            <p className="font-semibold">
                                                {order.totalPrice.toLocaleString('tr-TR', {
                                                    style: 'currency',
                                                    currency: 'TRY',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex space-x-2">
                                        {order.status.toLowerCase() === 'beklemede' && (
                                            <button
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="w-full px-4 py-2 text-[#7F0005] border-2 border-[#7F0005] rounded-4xl hover:bg-[#7F0005] hover:text-white transition-colors duration-300"
                                            >
                                                Siparişi İptal Et
                                            </button>
                                        )}

                                        {order.status.toLowerCase() === 'yolda' && (
                                            <button
                                                onClick={() => router.push(`/order-tracking?orderId=${order.id}`)}
                                                className="w-full px-4 py-2 bg-[#7F0005] text-white rounded-4xl hover:bg-opacity-90 transition-colors duration-300 flex items-center justify-center"
                                            >
                                                <span className="mr-2">Canlı Konumu Gör</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
} 