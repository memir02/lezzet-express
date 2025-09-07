'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    HomeIcon,
    SettingsIcon,
    MenuIcon,
    ShoppingCartIcon,
    LogOutIcon,
    UtensilsCrossed,
    Star,
    Flag,
} from 'lucide-react';



// Tip tanımı
type ViewType = 'dashboard' | 'restaurants' | 'menu' | 'orders' | 'reviews';

interface Restaurant {
    id?: string;
    name: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    rating?: number;
    image?: string | null;
    menu?: {
        id: string;
        name: string;
        description: string | null;
        price: number;
        category: string;
        available: boolean;
    }[];
    Order?: {
        id: string;
        status: string;
        orderedAt: string;
        totalPrice: number;
        user: {
            name: string;
        };
        items: {
            id: string;
            quantity: number;
            menu: {
                name: string;
                price: number;
            };
        }[];
    }[];
    reviews?: {
        id: string;
        rating: number;
        comment: string;
        reportCount: number;
        createdAt: string;
        user: {
            name: string | null;
            email: string;
        };
        restaurant: {
            name: string;
        };
    }[];
}

interface Courier {
    id: string;
    name: string;
    phone: string;
    status: 'MUSAIT' | 'MESGUL' | 'OFFLINE';
}

interface Review {
    id: string;
    rating: number;
    comment: string;
    reportCount: number;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
    restaurant: {
        name: string;
    };
}

export default function RestaurantOwnerSPA() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
    const [showCourierModal, setShowCourierModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        if (session?.user) {
            fetchRestaurants();
            fetchCouriers();
            fetchReviews();
        }
    }, [session]);

    useEffect(() => {
        if (status === 'unauthenticated' || session?.user.role !== 'restaurant_owner') {
            router.push('/');
        }
    }, [status, session]);

    const fetchRestaurants = async () => {
        try {
            const res = await fetch('/api/restaurant-owner/restaurants');
            if (!res.ok) throw new Error('Veri çekilemedi');
            const data = await res.json();
            setRestaurants(data);
        } catch (err) {
            setError('Veri çekilirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCouriers = async () => {
        try {
            const res = await fetch('/api/restaurant-owner/couriers');
            if (!res.ok) throw new Error('Kuryeler getirilemedi');
            const data = await res.json();
            setCouriers(data);
        } catch (err) {
            console.error('Kuryeler getirilirken hata:', err);
        }
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/restaurant-owner/reviews');
            if (!res.ok) {
                throw new Error('Yorumlar yüklenirken bir hata oluştu');
            }
            const data = await res.json();
            const reviewsWithReportCount = data.map((review: any) => ({
                ...review,
                reportCount: review.reportCount || 0
            }));
            setReviews(reviewsWithReportCount);
            console.log('Reviews loaded with reportCount:', reviewsWithReportCount);
        } catch (error) {
            setError('Yorumlar yüklenirken bir hata oluştu');
            console.error('Yorumlar yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/');
    };

    const handleAssignCourier = async (orderId: string) => {
        if (!selectedCourier) return;

        try {
            console.log('Kurye atama isteği gönderiliyor:', { orderId, courierId: selectedCourier });

            const res = await fetch('/api/restaurant-owner/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    courierId: selectedCourier
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('API yanıtı:', data);
                throw new Error(data.error || data.details || 'Kurye atanamadı');
            }

            console.log('Kurye atama başarılı:', data);

            await fetchRestaurants();
            setShowCourierModal(false);
            setSelectedCourier(null);
            setSelectedOrderId(null);
        } catch (error) {
            console.error('Kurye atanırken hata:', error);
            alert(error instanceof Error ? error.message : 'Kurye atanırken bir hata oluştu');
        }
    };

    const sidebarItems: { view: ViewType; icon: React.ReactNode; label: string }[] = [
        { view: 'dashboard', icon: <HomeIcon size={18} />, label: 'Dashboard' },
        { view: 'restaurants', icon: <UtensilsCrossed size={18} />, label: 'Restoranlarım' },
        { view: 'menu', icon: <MenuIcon size={18} />, label: 'Menü Yönetimi' },
        { view: 'orders', icon: <ShoppingCartIcon size={18} />, label: 'Siparişler' },
        { view: 'reviews', icon: <Star size={18} />, label: 'Yorumlar' },
    ];

    const renderCurrentView = () => {
        if (loading) return <div>Yükleniyor...</div>;
        if (error) return <div className="text-red-500">{error}</div>;

        const renderDashboard = () => (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Hoş Geldiniz, {session?.user?.name}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Toplam Restoran</h3>
                        <p className="text-3xl font-bold">{restaurants.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Toplam Menü Öğesi</h3>
                        <p className="text-3xl font-bold">
                            {restaurants.reduce((acc, restaurant) => acc + (restaurant.menu?.length || 0), 0)}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Bekleyen Siparişler</h3>
                        <p className="text-3xl font-bold">
                            {restaurants.reduce(
                                (acc, restaurant) =>
                                    acc + (restaurant.Order?.filter((order) => order.status === "BEKLEMEDE").length || 0),
                                0
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );

        const renderRestaurants = () => (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Restoranlarım</h1>
                    <button
                        onClick={() => {
                            const newRestaurant = {
                                name: '',
                                description: '',
                                address: '',
                                phone: ''
                            };
                            setRestaurants([...restaurants, newRestaurant]);
                        }}
                        className="bg-[#7F0005] text-white px-4 py-2 rounded-lg hover:bg-[#6A0004]"
                    >
                        Yeni Restoran Ekle
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="space-y-4">
                            {restaurants.map((restaurant, index) => (
                                <div key={restaurant.id || index} className="border-b pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={restaurant.name}
                                                onChange={(e) => {
                                                    const newRestaurants = [...restaurants];
                                                    newRestaurants[index].name = e.target.value;
                                                    setRestaurants(newRestaurants);
                                                }}
                                                className="text-lg font-medium w-full p-2 border rounded"
                                                placeholder="Restoran Adı"
                                            />
                                            <textarea
                                                value={restaurant.description || ''}
                                                onChange={(e) => {
                                                    const newRestaurants = [...restaurants];
                                                    newRestaurants[index].description = e.target.value;
                                                    setRestaurants(newRestaurants);
                                                }}
                                                className="text-gray-600 w-full p-2 border rounded mt-2"
                                                placeholder="Açıklama"
                                            />
                                            <input
                                                type="text"
                                                value={restaurant.address || ''}
                                                onChange={(e) => {
                                                    const newRestaurants = [...restaurants];
                                                    newRestaurants[index].address = e.target.value;
                                                    setRestaurants(newRestaurants);
                                                }}
                                                className="text-sm text-gray-500 w-full p-2 border rounded mt-2"
                                                placeholder="Adres"
                                            />
                                            <input
                                                type="text"
                                                value={restaurant.phone || ''}
                                                onChange={(e) => {
                                                    const newRestaurants = [...restaurants];
                                                    newRestaurants[index].phone = e.target.value;
                                                    setRestaurants(newRestaurants);
                                                }}
                                                className="text-sm text-gray-500 w-full p-2 border rounded mt-2"
                                                placeholder="Telefon"
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        if (restaurant.id) {
                                                            await fetch('/api/restaurant-owner/restaurants', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify(restaurant),
                                                            });
                                                        } else {
                                                            const response = await fetch('/api/restaurant-owner/restaurants', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify(restaurant),
                                                            });
                                                            const newRestaurant = await response.json();
                                                            const newRestaurants = [...restaurants];
                                                            newRestaurants[index] = newRestaurant;
                                                            setRestaurants(newRestaurants);
                                                        }
                                                    } catch (error) {
                                                        console.error('Restoran kaydedilirken hata:', error);
                                                    }
                                                }}
                                                className="bg-[#7F0005] text-white px-4 py-2 rounded-lg hover:bg-[#6A0004]"
                                            >
                                                Kaydet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );

        const renderMenu = () => (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Menü Yönetimi</h1>
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="space-y-4">
                            {restaurants.map((restaurant) => (
                                <div key={restaurant.id} className="border-b pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium">{restaurant.name}</h3>
                                        <button
                                            onClick={() => {
                                                const newMenuItem = {
                                                    name: '',
                                                    description: '',
                                                    price: 0,
                                                    category: 'Ana Yemek',
                                                    restaurantId: restaurant.id,
                                                    available: true
                                                };
                                                try {
                                                    fetch('/api/restaurant-owner/menu', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify(newMenuItem),
                                                    }).then(() => {
                                                        fetchRestaurants();
                                                    });
                                                } catch (error) {
                                                    console.error('Menü öğesi eklenirken hata:', error);
                                                }
                                            }}
                                            className="bg-[#7F0005] text-white px-4 py-2 rounded-lg hover:bg-[#6A0004]"
                                        >
                                            Yeni Menü Öğesi Ekle
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {restaurant.menu?.map((item) => (
                                            <div key={item.id} className="border rounded-lg p-4">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={async (e) => {
                                                        try {
                                                            await fetch('/api/restaurant-owner/menu', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    id: item.id,
                                                                    name: e.target.value,
                                                                    description: item.description,
                                                                    price: item.price,
                                                                    category: item.category,
                                                                    available: item.available
                                                                }),
                                                            });
                                                            fetchRestaurants();
                                                        } catch (error) {
                                                            console.error('Menü öğesi güncellenirken hata:', error);
                                                        }
                                                    }}
                                                    className="font-medium w-full p-2 border rounded"
                                                    placeholder="Ürün Adı"
                                                />
                                                <textarea
                                                    value={item.description || ''}
                                                    onChange={async (e) => {
                                                        try {
                                                            await fetch('/api/restaurant-owner/menu', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    id: item.id,
                                                                    name: item.name,
                                                                    description: e.target.value,
                                                                    price: item.price,
                                                                    category: item.category,
                                                                    available: item.available
                                                                }),
                                                            });
                                                            fetchRestaurants();
                                                        } catch (error) {
                                                            console.error('Menü öğesi güncellenirken hata:', error);
                                                        }
                                                    }}
                                                    className="text-gray-600 w-full p-2 border rounded mt-2"
                                                    placeholder="Açıklama"
                                                />
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={async (e) => {
                                                        try {
                                                            await fetch('/api/restaurant-owner/menu', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    id: item.id,
                                                                    name: item.name,
                                                                    description: item.description,
                                                                    price: parseFloat(e.target.value),
                                                                    category: item.category,
                                                                    available: item.available
                                                                }),
                                                            });
                                                            fetchRestaurants();
                                                        } catch (error) {
                                                            console.error('Menü öğesi güncellenirken hata:', error);
                                                        }
                                                    }}
                                                    className="text-sm text-gray-500 w-full p-2 border rounded mt-2"
                                                    placeholder="Fiyat"
                                                />
                                                <select
                                                    value={item.category}
                                                    onChange={async (e) => {
                                                        try {
                                                            await fetch('/api/restaurant-owner/menu', {
                                                                method: 'PUT',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    id: item.id,
                                                                    name: item.name,
                                                                    description: item.description,
                                                                    price: item.price,
                                                                    category: e.target.value,
                                                                    available: item.available
                                                                }),
                                                            });
                                                            fetchRestaurants();
                                                        } catch (error) {
                                                            console.error('Menü öğesi güncellenirken hata:', error);
                                                        }
                                                    }}
                                                    className="text-sm text-gray-500 w-full p-2 border rounded mt-2"
                                                >
                                                    <option value="Ana Yemek">Ana Yemek</option>
                                                    <option value="Çorba">Çorba</option>
                                                    <option value="Salata">Salata</option>
                                                    <option value="Tatlı">Tatlı</option>
                                                    <option value="İçecek">İçecek</option>
                                                </select>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.available}
                                                            onChange={async (e) => {
                                                                try {
                                                                    await fetch('/api/restaurant-owner/menu', {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                            id: item.id,
                                                                            name: item.name,
                                                                            description: item.description,
                                                                            price: item.price,
                                                                            category: item.category,
                                                                            available: e.target.checked
                                                                        }),
                                                                    });
                                                                    fetchRestaurants();
                                                                } catch (error) {
                                                                    console.error('Menü öğesi güncellenirken hata:', error);
                                                                }
                                                            }}
                                                            className="mr-2"
                                                        />
                                                        <span className="text-sm">Mevcut</span>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await fetch('/api/restaurant-owner/menu', {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                            id: item.id,
                                                                            name: item.name,
                                                                            description: item.description,
                                                                            price: item.price,
                                                                            category: item.category,
                                                                            available: item.available
                                                                        }),
                                                                    });
                                                                    fetchRestaurants();
                                                                } catch (error) {
                                                                    console.error('Menü öğesi güncellenirken hata:', error);
                                                                }
                                                            }}
                                                            className="bg-[#7F0005] text-white px-3 py-1 rounded hover:bg-[#6A0004] text-sm"
                                                        >
                                                            Kaydet
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await fetch(`/api/restaurant-owner/menu?id=${item.id}`, {
                                                                        method: 'DELETE',
                                                                    });
                                                                    fetchRestaurants();
                                                                } catch (error) {
                                                                    console.error('Menü öğesi silinirken hata:', error);
                                                                }
                                                            }}
                                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );

        const renderCourierModal = () => {
            if (!showCourierModal) return null;

            return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">Kurye Seç</h3>
                        <div className="space-y-2">
                            {couriers
                                .filter(courier => courier.status === 'MUSAIT')
                                .map(courier => (
                                    <div
                                        key={courier.id}
                                        className={`p-2 border rounded cursor-pointer ${selectedCourier === courier.id ? 'border-[#7F0005] bg-red-50' : ''
                                            }`}
                                        onClick={() => setSelectedCourier(courier.id)}
                                    >
                                        <p className="font-medium">{courier.name}</p>
                                        <p className="text-sm text-gray-500">{courier.phone}</p>
                                    </div>
                                ))}
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowCourierModal(false);
                                    setSelectedCourier(null);
                                    setSelectedOrderId(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => selectedOrderId && handleAssignCourier(selectedOrderId)}
                                disabled={!selectedCourier}
                                className="px-4 py-2 bg-[#7F0005] text-white rounded hover:bg-[#6A0004] disabled:opacity-50"
                            >
                                Ata
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        const renderOrders = () => (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Siparişler</h1>
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="space-y-4">
                            {restaurants.flatMap((restaurant) =>
                                (restaurant.Order || [])
                                    .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime())
                                    .map((order) => (
                                        <div key={order.id} className="border-b pb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-medium">{restaurant.name}</h3>
                                                    <p className="text-gray-600">{order.user.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(order.orderedAt).toLocaleDateString("tr-TR")}
                                                    </p>
                                                    <div className="mt-2">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="text-sm">
                                                                {item.quantity}x {item.menu.name} - {item.menu.price} TL
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">{order.totalPrice} TL</p>
                                                    <p
                                                        className={`text-sm ${order.status === "BEKLEMEDE"
                                                            ? "text-orange-500"
                                                            : order.status === "TAMAMLANDI"
                                                                ? "text-green-500"
                                                                : order.status === "YOLDA"
                                                                    ? "text-blue-500"
                                                                    : "text-red-500"
                                                            }`}
                                                    >
                                                        {order.status === "BEKLEMEDE"
                                                            ? "Bekliyor"
                                                            : order.status === "TAMAMLANDI"
                                                                ? "Tamamlandı"
                                                                : order.status === "YOLDA"
                                                                    ? "Yolda"
                                                                    : "İptal Edildi"}
                                                    </p>
                                                    {order.status === "BEKLEMEDE" && (
                                                        <div className="space-y-2 mt-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOrderId(order.id);
                                                                    setShowCourierModal(true);
                                                                }}
                                                                className="text-blue-500 hover:text-blue-700"
                                                            >
                                                                Kurye Ata
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await fetch(`/api/restaurant-owner/orders?id=${order.id}`, {
                                                                            method: 'DELETE',
                                                                        });
                                                                        fetchRestaurants();
                                                                    } catch (error) {
                                                                        console.error('Sipariş iptal edilirken hata:', error);
                                                                    }
                                                                }}
                                                                className="text-red-500 hover:text-red-700 block"
                                                            >
                                                                İptal Et
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
                {renderCourierModal()}
            </div>
        );

        const renderReviews = () => (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                    <h2 className="text-xl font-semibold text-[#7F0005]">Restoran Yorumları</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {reviews.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            Henüz yorum bulunmamaktadır.
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center mb-1">
                                            <div className="flex">
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                    <Star
                                                        key={index}
                                                        className={index < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                                        size={18}
                                                    />
                                                ))}
                                            </div>
                                            <span className="ml-2 text-gray-700 font-medium">
                                                {review.user?.name || 'Misafir'} ({review.user.email})
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString('tr-TR')} - {review.restaurant.name}
                                        </p>
                                    </div>
                                    {review.reportCount > 0 && (
                                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                            <Flag size={12} />
                                            {review.reportCount} şikayet
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );

        switch (currentView) {
            case 'dashboard': return renderDashboard();
            case 'restaurants': return renderRestaurants();
            case 'menu': return renderMenu();
            case 'orders': return renderOrders();
            case 'reviews': return renderReviews();
            default: return null;
        }
    };

    if (status === 'loading') return <div>Yükleniyor...</div>;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-md transition-all duration-300`}>
                <div className="flex items-center justify-between p-4">
                    {isSidebarOpen && (
                        <div className="flex items-center space-x-2">
                            <Image src="/logo_1.png" alt="Logo" width={40} height={40} />
                            <span className="text-xl font-bold text-[#7F0005]">LezzetExpress</span>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-700">
                        {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </button>
                </div>

                <nav className="px-2 py-4 space-y-1">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => setCurrentView(item.view)}
                            className={`flex items-center w-full px-4 py-2 rounded hover:bg-gray-100 ${currentView === item.view ? 'bg-gray-100' : ''
                                } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                        >
                            {item.icon}
                            {isSidebarOpen && <span className="ml-3">{item.label}</span>}
                        </button>
                    ))}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-4 py-2 rounded text-red-600 hover:bg-gray-100 ${isSidebarOpen ? 'justify-start' : 'justify-center'
                            }`}
                    >
                        <LogOutIcon size={18} />
                        {isSidebarOpen && <span className="ml-3">Çıkış Yap</span>}
                    </button>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow sticky top-0 z-30 w-full">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-[#7F0005]">Restaurant Owner Panel</h1>
                        <div className="text-gray-700">{session?.user?.name}</div>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {renderCurrentView()}
                </main>
            </div>
        </div>
    );
}
