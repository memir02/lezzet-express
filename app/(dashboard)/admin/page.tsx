'use client';

import { useEffect, useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, UtensilsCrossed, ChefHat, MessageSquare } from 'lucide-react';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
}

interface Restaurant {
    id: string;
    name: string;
    description: string;
    phone: string;
    rating: number;
    image?: string;
    reviews?: {
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        user: {
            name: string;
        };
    }[];
}

interface Order {
    id: string;
    userId: string;
    restaurantId: string;
    status: string;
    totalPrice: number;
    createdAt: string;
}

interface Review {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    userId: string;
    restaurantId: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    restaurant: {
        id: string;
        name: string;
        rating: number;
    };
    reportCount: number;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [editableUsers, setEditableUsers] = useState<User[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [editableRestaurants, setEditableRestaurants] = useState<Restaurant[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'users' | 'restaurants' | 'orders' | 'reviews'>('users');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session?.user?.role !== 'admin') {
            router.push('/');
            return;
        }

        if (status === 'authenticated' && session?.user?.role === 'admin') {
            fetchUsers();
            fetchRestaurants();
            fetchOrders();
            fetchReviews();
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Kullanıcılar yüklenirken hata oluştu');

            const data = await response.json();
            setUsers(data);
            setEditableUsers(data.map((user: User) => ({ ...user })));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const fetchRestaurants = async () => {
        try {
            const response = await fetch('/api/admin/restaurants', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Restoranlar yüklenirken hata oluştu');

            const data = await response.json();
            setRestaurants(data);
            setEditableRestaurants(data.map((restaurant: Restaurant) => ({ ...restaurant })));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/admin/orders', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Siparişler yüklenirken hata oluştu');

            const data = await response.json();
            setOrders(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await fetch('/api/admin/reviews', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Yorumlar yüklenirken hata oluştu');

            const data = await response.json();
            const reviewsWithReportCount = data.map((review: any) => ({
                ...review,
                reportCount: review.reportCount || 0
            }));
            setReviews(reviewsWithReportCount);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        }
    };

    const handleUserInputChange = (index: number, field: keyof User, value: string) => {
        setEditableUsers(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleRestaurantInputChange = (index: number, field: keyof Restaurant, value: string) => {
        setEditableRestaurants(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleUpdateUser = async (user: User) => {
        try {
            const response = await fetch('/api/admin/users/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });

            if (!response.ok) throw new Error('Güncelleme başarısız');

            setUsers(prev => {
                const updated = [...prev];
                const index = updated.findIndex(u => u.id === user.id);
                if (index !== -1) updated[index] = user;
                return updated;
            });

            alert('Kullanıcı başarıyla güncellendi');
        } catch (err) {
            alert('Güncelleme sırasında bir hata oluştu');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Silme işlemi başarısız oldu');

            setUsers(prev => prev.filter(u => u.id !== userId));
            setEditableUsers(prev => prev.filter(u => u.id !== userId));
            alert('Kullanıcı başarıyla silindi');
        } catch (err) {
            alert('Kullanıcı silinirken hata oluştu');
        }
    };

    const handleUpdateRestaurant = async (restaurant: Restaurant) => {
        try {
            const response = await fetch('/api/admin/restaurants/update-restaurant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(restaurant),
            });

            if (!response.ok) throw new Error('Güncelleme başarısız');

            setRestaurants(prev => {
                const updated = [...prev];
                const index = updated.findIndex(r => r.id === restaurant.id);
                if (index !== -1) updated[index] = restaurant;
                return updated;
            });

            alert('Restoran başarıyla güncellendi');
        } catch (err) {
            alert('Güncelleme sırasında bir hata oluştu');
        }
    };

    const handleDeleteRestaurant = async (restaurantId: string) => {
        if (!confirm('Bu restoranı silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/admin/restaurants/${restaurantId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Silme işlemi başarısız oldu');

            setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
            setEditableRestaurants(prev => prev.filter(r => r.id !== restaurantId));
            alert('Restoran başarıyla silindi');
        } catch (err) {
            alert('Restoran silinirken hata oluştu');
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('İptal işlemi başarısız oldu');

            setOrders(prev => prev.filter(o => o.id !== orderId));
            alert('Sipariş başarıyla iptal edildi');
        } catch (err) {
            alert('Sipariş iptal edilirken hata oluştu');
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/admin/reviews?id=${reviewId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Silme işlemi başarısız oldu');

            setReviews(prev => prev.filter(r => r.id !== reviewId));
            alert('Yorum başarıyla silindi');
        } catch (err) {
            alert('Yorum silinirken hata oluştu');
        }
    };

    // Null reportCount değerlerini düzeltme işlemi
    const fixReportCounts = async () => {
        try {
            const response = await fetch('/api/admin/fix-report-counts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                // Yorumları yeniden yükle
                fetchReviews();
            } else {
                alert(data.error || 'Bir hata oluştu');
            }
        } catch (err) {
            alert('Veritabanı düzeltme işlemi sırasında bir hata oluştu');
            console.error('Veritabanı düzeltme hatası:', err);
        }
    };

    const renderUserManagement = () => (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                        <th className="px-6 py-3">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {editableUsers.map((user, index) => (
                        <tr key={user.id}>
                            <td className="px-6 py-4">
                                <input
                                    type="text"
                                    value={user.name || ''}
                                    onChange={(e) => handleUserInputChange(index, 'name', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                />
                            </td>
                            <td className="px-6 py-4">
                                <input
                                    type="email"
                                    value={user.email}
                                    onChange={(e) => handleUserInputChange(index, 'email', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                />
                            </td>
                            <td className="px-6 py-4">
                                <select
                                    value={user.role || ''}
                                    onChange={(e) => handleUserInputChange(index, 'role', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value="customer">Müşteri</option>
                                    <option value="restaurant_owner">Restoran Sahibi</option>
                                    <option value="admin">Admin</option>
                                    <option value="courier">Kurye</option>
                                </select>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                                <button
                                    onClick={() => handleUpdateUser(user)}
                                    className="bg-emerald-900 hover:bg-emerald-700 text-white px-3 py-1 rounded"
                                >
                                    Kaydet
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-[#7F0005] hover:bg-red-700 text-white px-3 py-1 rounded"
                                >
                                    Sil
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderRestaurantManagement = () => (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restoran Adı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                        <th className="px-6 py-3">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {editableRestaurants.map((restaurant, index) => (
                        <tr key={restaurant.id}>
                            <td className="px-6 py-4">
                                <input
                                    type="text"
                                    value={restaurant.name}
                                    onChange={(e) => handleRestaurantInputChange(index, 'name', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                />
                            </td>
                            <td className="px-6 py-4">
                                <input
                                    type="text"
                                    value={restaurant.description}
                                    onChange={(e) => handleRestaurantInputChange(index, 'description', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                />
                            </td>
                            <td className="px-6 py-4">
                                <input
                                    type="text"
                                    value={restaurant.phone}
                                    onChange={(e) => handleRestaurantInputChange(index, 'phone', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                />
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                                <button
                                    onClick={() => handleUpdateRestaurant(restaurant)}
                                    className="bg-emerald-900 hover:bg-emerald-700 text-white px-3 py-1 rounded"
                                >
                                    Kaydet
                                </button>
                                <button
                                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                                    className="bg-[#7F0005] hover:bg-red-700 text-white px-3 py-1 rounded"
                                >
                                    Sil
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderOrderManagement = () => (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sipariş ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restoran ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Fiyat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                        <th className="px-6 py-3">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td className="px-6 py-4">{order.id}</td>
                            <td className="px-6 py-4">{order.userId}</td>
                            <td className="px-6 py-4">{order.restaurantId}</td>
                            <td className="px-6 py-4">{order.status}</td>
                            <td className="px-6 py-4">{order.totalPrice} TL</td>
                            <td className="px-6 py-4">{new Date(order.createdAt).toLocaleString()}</td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="bg-[#7F0005] hover:bg-red-700 text-white px-3 py-1 rounded"
                                >
                                    İptal Et
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderReviewManagement = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                {/* <h1 className="text-3xl font-bold text-[#7F0005] mb-6">Yorum Yönetimi</h1> */}
                <button
                    onClick={fixReportCounts}
                    className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded"
                >
                    Şikayet Sayılarını Düzelt
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restoran</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yorum</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şikayet</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                            <th className="px-6 py-3">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reviews.map((review) => (
                            <tr key={review.id} className={review.reportCount > 0 ? "bg-red-50" : ""}>
                                <td className="px-6 py-4">{review.user.name || 'İsimsiz'} ({review.user.email})</td>
                                <td className="px-6 py-4">{review.restaurant.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                        <span className="ml-1 text-sm">{review.rating}/5</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate">{review.comment}</td>
                                <td className="px-6 py-4">
                                    {review.reportCount > 0 ? (
                                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {review.reportCount} şikayet
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Şikayet yok</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">{new Date(review.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleDeleteReview(review.id)}
                                        className="bg-[#7F0005] hover:bg-red-700 text-white px-3 py-1 rounded"
                                    >
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r">
                <div className="p-4 font-bold text-xl text-[#7F0005]">Admin Panel</div>
                <nav className="mt-4 space-y-1">
                    <button
                        onClick={() => setView('users')}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 ${view === 'users' ? 'bg-gray-100' : ''}`}
                    >
                        <Users size={18} /> Kullanıcılar
                    </button>
                    <button
                        onClick={() => setView('restaurants')}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 ${view === 'restaurants' ? 'bg-gray-100' : ''}`}
                    >
                        <UtensilsCrossed size={18} /> Restoranlar
                    </button>
                    <button
                        onClick={() => setView('orders')}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 ${view === 'orders' ? 'bg-gray-100' : ''}`}
                    >
                        <ChefHat size={18} /> Siparişler
                    </button>
                    <button
                        onClick={() => setView('reviews')}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 ${view === 'reviews' ? 'bg-gray-100' : ''}`}
                    >
                        <MessageSquare size={18} /> Yorumlar
                    </button>
                </nav>
            </div>

            {/* Main content */}
            <main className="flex-1 p-6">
                <AdminHeader />
                <h1 className="text-3xl font-bold text-[#7F0005] mb-6">
                    {view === 'users'
                        ? 'Kullanıcı Yönetimi'
                        : view === 'restaurants'
                            ? 'Restoran Yönetimi'
                            : view === 'orders'
                                ? 'Sipariş Yönetimi'
                                : 'Yorum Yönetimi'}
                </h1>

                {view === 'users' && renderUserManagement()}
                {view === 'restaurants' && renderRestaurantManagement()}
                {view === 'orders' && renderOrderManagement()}
                {view === 'reviews' && renderReviewManagement()}
            </main>
        </div>
    );
}
