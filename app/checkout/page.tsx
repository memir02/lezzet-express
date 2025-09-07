'use client';

import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    restaurantId: string;
    restaurantName: string;
}

interface AddressFormData {
    fullName: string;
    address: string;
    city: string;
    district: string;
    phone: string;
}

// Stripe public key'ini yükle
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ items, total, restaurantId }: { items: CartItem[], total: number, restaurantId: string | null }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [addressData, setAddressData] = useState<AddressFormData>({
        fullName: '',
        address: '',
        city: '',
        district: '',
        phone: ''
    });

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddressData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        // Adres bilgilerini kontrol et
        if (!addressData.fullName || !addressData.address || !addressData.city || !addressData.district || !addressData.phone) {
            setError('Lütfen tüm adres bilgilerini doldurun');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Önce siparişi kaydet
            const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: items,
                    totalAmount: total,
                    restaurantId: restaurantId,
                    deliveryAddress: {
                        fullName: addressData.fullName,
                        address: addressData.address,
                        city: addressData.city,
                        district: addressData.district,
                        phone: addressData.phone
                    }
                }),
            });

            if (!orderResponse.ok) {
                throw new Error('Sipariş kaydedilemedi');
            }

            // Sonra ödemeyi onayla
            const { error: submitError } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/thank-you`,
                },
            });

            if (submitError) {
                setError(submitError.message || 'Bir hata oluştu');
            }
        } catch (err) {
            console.error('Ödeme işlemi sırasında hata:', err);
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Adres Bilgileri */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Teslimat Bilgileri</h3>
                <div className="grid grid-cols-1 gap-4">
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Ad Soyad"
                        value={addressData.fullName}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                        required
                    />
                    <input
                        type="text"
                        name="address"
                        placeholder="Adres"
                        value={addressData.address}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="city"
                            placeholder="Şehir"
                            value={addressData.city}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                            required
                        />
                        <input
                            type="text"
                            name="district"
                            placeholder="İlçe"
                            value={addressData.district}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                            required
                        />
                    </div>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Telefon"
                        value={addressData.phone}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                        required
                    />
                </div>
            </div>

            {/* Ödeme Bilgileri */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ödeme Bilgileri</h3>
                <PaymentElement />
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || loading}
                className={`w-full px-4 py-2 rounded-lg text-white ${loading || !stripe
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#7F0005] hover:bg-opacity-90'
                    }`}
            >
                {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
            </button>
        </form>
    );
}

export default function CheckoutPage() {
    const { items, total, restaurantId } = useCart();
    const router = useRouter();
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        // Sepet boşsa veya URL'de restaurantId yoksa ana sayfaya yönlendir
        if (items.length === 0 || !restaurantId) {
            router.push('/');
            return;
        }

        // Ödeme niyeti oluştur
        const createPaymentIntent = async () => {
            try {
                const response = await fetch('/api/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: Math.round(total * 100), // Stripe kuruş cinsinden çalışır
                        items: items,
                        restaurantId: restaurantId
                    }),
                });

                if (!response.ok) {
                    throw new Error('Ödeme başlatılamadı');
                }

                const data = await response.json();
                setClientSecret(data.clientSecret);
            } catch (error) {
                console.error('Ödeme niyeti oluşturulurken hata:', error);
            }
        };

        createPaymentIntent();
    }, [items, restaurantId, router, total]);

    if (items.length === 0) {
        return null; // useEffect zaten yönlendirecek
    }

    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Ödeme</h1>

                    {/* Sipariş Özeti */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Sipariş Özeti</h2>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between">
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                                </div>
                            ))}
                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between font-bold">
                                    <span>Toplam</span>
                                    <span>{total.toFixed(2)} ₺</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ödeme Formu */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Ödeme Bilgileri</h2>
                        {clientSecret && (
                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret,
                                    appearance: {
                                        theme: 'stripe',
                                    },
                                }}
                            >
                                <CheckoutForm items={items} total={total} restaurantId={restaurantId} />
                            </Elements>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
} 