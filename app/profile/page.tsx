'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

interface UserProfile {
    name: string;
    email: string;
    phone?: string;
    address?: string;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (session?.user) {
            // Kullanıcı bilgilerini getir
            fetchUserProfile();
        }
    }, [status, session, router]);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/user/profile');
            if (!response.ok) throw new Error('Profil bilgileri alınamadı');
            const data = await response.json();
            setProfile(data);
        } catch (err) {
            setError('Profil bilgileri yüklenirken bir hata oluştu');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profile),
            });

            if (!response.ok) throw new Error('Profil güncellenemedi');

            setSuccess('Profil başarıyla güncellendi');
            setIsEditing(false);
        } catch (err) {
            setError('Profil güncellenirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading') {
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
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Profil Bilgilerim</h1>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            {success}
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-md p-6">
                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ad Soyad
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        E-posta
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profile.phone || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Adres
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={profile.address || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7F0005]"
                                    />
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`flex-1 px-4 py-2 rounded-lg text-white ${isLoading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-[#7F0005] hover:bg-opacity-90'
                                            }`}
                                    >
                                        {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        İptal
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Ad Soyad</h3>
                                    <p className="mt-1">{profile.name}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">E-posta</h3>
                                    <p className="mt-1">{profile.email}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Telefon</h3>
                                    <p className="mt-1">{profile.phone || '-'}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Adres</h3>
                                    <p className="mt-1">{profile.address || '-'}</p>
                                </div>

                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full px-4 py-2 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90"
                                >
                                    Düzenle
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
} 