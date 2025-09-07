'use client';

import React, { useEffect, useState } from 'react';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

interface Restaurant {
    id: string;
    name: string;
    description: string;
    phone: string;
    rating: number;
    image?: string;

}

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState<boolean>(true);  // Yükleniyor durumu için state

    useEffect(() => {
        async function fetchRestaurants() {
            try {
                const res = await fetch('/api/restaurants');
                if (!res.ok) {
                    throw new Error('Veri alınamadı');
                }
                const data = await res.json();
                setRestaurants(data);
            } catch (error) {
                console.error('Veri çekerken bir hata oluştu:', error);
            } finally {
                setLoading(false); // Veriler yüklendikten sonra loading'i false yap
            }
        }

        fetchRestaurants();
    }, []);

    if (loading) {
        return (
            <div>Loading...</div>  // Yükleniyor mesajı
        );
    }

    return (
        <>
            <Header2 />
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 m-8">
                    {restaurants.map((restaurant) => (
                        <div
                            key={restaurant.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden group cursor-pointer restaurant-card"
                            onClick={() => window.location.href = `/restaurants/${restaurant.id}`}
                        >
                            <div className="relative">
                                <img
                                    className="restaurant-image w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    src={restaurant.image || '/default-image.jpg'} // Varsayılan bir fotoğraf ekleyebilirsiniz
                                    alt={restaurant.name}
                                />
                                <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="restaurant-name font-bold text-lg mb-2">{restaurant.name}</h3>
                                <p className="restaurant-details text-gray-600 text-sm mb-2">{restaurant.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="restaurant-phone text-sm text-gray-500">{restaurant.phone}</span>
                                    <span className="restaurant-rating text-sm font-medium text-[#7F0005]">{`${restaurant.rating} (${restaurant})`}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
}
