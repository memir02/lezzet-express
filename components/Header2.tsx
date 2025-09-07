'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/app/context/CartContext';
import { ShoppingCart, Settings, Package, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Header2() {
    const { data: session } = useSession();
    const { items } = useCart();
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-[#fdfcfc] py-6 shadow-lg sticky top-0 z-40 w-full">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="pl-4 md:pl-0 px-2 sm:px-4 md:px-6 flex items-center space-x-2">
                        <Image src="/logo_1.png" alt="Logo" width={56} height={56} className="w-10 md:w-12 lg:w-14 h-auto" />
                        <Link href="/">
                            <span className="font-sigmar text-2xl sm:text-3xl text-[#7F0005]">LezzetExpress</span>
                        </Link>
                    </div>

                    {/* Arama Çubuğu */}
                    <div className="flex-1 max-w-xl px-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Restoran veya mutfak ara..."
                                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7F0005] focus:border-[#7F0005] outline-none"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Sağ Taraf */}
                    <div className="flex items-center space-x-6 px-8">
                        {/* Sepet */}
                        <Link href="/cart" className="relative group">
                            <Image src="/basket.png" alt="Sepet" width={32} height={32} className="w-4 md:w-6 lg:w-8 h-auto" />
                            {itemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#7F0005] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        {/* Profil */}
                        {session ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-[#7F0005] transition-colors"
                                >
                                    <Image src="/people.png" alt="Profil" width={32} height={32} className="w-4 md:w-6 lg:w-8 h-auto" />
                                    <span className="hidden md:inline">{session.user?.name}</span>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-50">
                                        <Link
                                            href="/profile"
                                            className="flex items-center px-5 py-3 text-base text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Profil Bilgilerim
                                        </Link>
                                        <Link
                                            href="/orders"
                                            className="flex items-center px-5 py-3 text-base text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <Package className="h-4 w-4 mr-2" />
                                            Siparişlerim
                                        </Link>
                                        <button
                                            onClick={() => signOut()}
                                            className="flex items-center w-full px-5 py-3 text-base text-[#7F0005] hover:bg-gray-100"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Çıkış Yap
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="text-gray-700 hover:text-[#7F0005] transition-colors">
                                Giriş Yap
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
