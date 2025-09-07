'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- Router importu
import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter(); // <-- Router kullanımı

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenuAndNavigate = () => {
        setMenuOpen(false);
    };

    return (
        <>
            <nav className="bg-[#fdfcfc] py-6 shadow-lg sticky top-0 z-40 w-full">
                <div className="container mx-auto px-4 flex flex-wrap justify-between items-center">

                    {/* Logo */}
                    <div className="pl-4 md:pl-0 px-2 sm:px-4 md:px-6 flex items-center space-x-2">
                        <Image src="/logo_1.png" alt="Logo" width={50} height={50} className="w-10 md:w-12 lg:w-14 h-auto" />
                        <Link href="/" className="text-2xl sm:text-3xl text-[#7F0005]">
                            LezzetExpress
                        </Link>
                    </div>

                    {/* Mobile Menu */}
                    <div className="block md:hidden pr-4" onClick={toggleMenu}>
                        <div className="space-y-1 cursor-pointer">
                            <div className="w-8 h-1 rounded-full bg-[#7F0005]"></div>
                            <div className="w-8 h-1 rounded-full bg-[#7F0005]"></div>
                            <div className="w-8 h-1 rounded-full bg-[#7F0005]"></div>
                        </div>
                    </div>

                    {/* Mobile Menu İçeriği */}
                    {menuOpen && (
                        <div className="bg-[#7F0008] text-white p-4 absolute top-16 space-y-4 w-full left-0">
                            <ul>
                                <li className="border-b border-white last:border-none">
                                    <Link href="/hakkimizda" className="block py-2 text-2xl hover:text-[#940008] transition duration-300" onClick={closeMenuAndNavigate}>
                                        Hakkımızda
                                    </Link>
                                </li>
                                <li className="border-b border-white last:border-none">
                                    <Link href="/iletisim" className="block py-2 text-2xl hover:text-[#940008] transition duration-300" onClick={closeMenuAndNavigate}>
                                        İletişim
                                    </Link>
                                </li>
                                <li className="border-b border-white last:border-none">
                                    <Link href="/giris" className="block py-2 text-2xl hover:text-[#940008] transition duration-300" onClick={closeMenuAndNavigate}>
                                        Giriş Yap
                                    </Link>
                                </li>
                                <li className="border-b border-white last:border-none">
                                    <Link href="/kayit" className="block py-2 text-2xl hover:text-[#940008] transition duration-300" onClick={closeMenuAndNavigate}>
                                        Kayıt Ol
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Menü Linkleri */}
                    <div className="hidden md:flex space-x-2 sm:space-x-4 md:space-x-6">
                        <Link href="/hakkimizda" className="hover:text-[#7F0005] text-2xl transition duration-300">Hakkımızda</Link>
                        <Link href="/iletisim" className="hover:text-[#7F0005] text-2xl transition duration-300">İletişim</Link>
                    </div>

                    {/* Butonlar */}
                    <div className="hidden md:flex space-x-2 sm:space-x-4 md:space-x-6 px-auto">
                        <button
                            onClick={() => router.push('/login')} // yönlendirme
                            className="bg-[#7F0005] text-white text-xl px-4 py-2 rounded-lg hover:bg-[#940008] transition duration-300"
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => router.push('/register')} // yönlendirme
                            className="bg-[#7F0005] text-white text-xl px-4 py-2 rounded-lg hover:bg-[#940008] transition duration-300"
                        >
                            Kayıt Ol
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Header;
