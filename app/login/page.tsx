'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Login() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
                return;
            }

            if (result?.ok) {
                const response = await fetch('/api/auth/session');
                const session = await response.json();

                if (session?.user?.role === 'customer') {
                    const userResponse = await fetch('/api/user/profile');
                    const userData = await userResponse.json();

                    if (userData.address && userData.address.trim() !== '') {
                        router.push('/restaurants');
                    } else {
                        router.push('/konum');
                    }
                } else if (session?.user?.role === 'restaurant_owner') {
                    router.push('/restaurant_owner');
                } else if (session?.user?.role === 'admin') {
                    router.push('/admin');
                } else if (session?.user?.role === 'courier') {
                    router.push('/courier');
                } else {
                    router.push('/');
                }
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
                            Hesabınıza giriş yapın
                        </h2>
                    </div>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email adresi
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                    placeholder="lezzetexpress@gmail.com"
                                />
                            </div>
                            <div className="mt-4">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Şifre
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none transition-all"
                                    placeholder="Şifreniz"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#7F0005] text-white py-2 px-4 rounded-lg hover:bg-[#940008] transition duration-300 disabled:opacity-50"
                            >
                                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Hesabınız yok mu?{' '}
                            <a href="/register" className="text-[#7F0005] hover:underline">
                                Kayıt Ol
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
