'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

const AdminHeader = () => {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    return (
        <nav className="bg-[#fdfcfc] py-6 shadow-lg sticky top-0 z-40 w-full">
            <div className="container mx-auto px-4 flex flex-wrap justify-between items-center">
                {/* Logo */}
                <div className="pl-4 md:pl-0 px-2 sm:px-4 md:px-6 flex items-center space-x-2">
                    <Image src="/logo_1.png" alt="Logo" width={50} height={50} className="w-10 md:w-12 lg:w-14 h-auto" />
                    <div className="flex items-center space-x-2">
                        <Link href="/" className="text-2xl sm:text-3xl text-[#7F0005]">
                            LezzetExpress
                        </Link>
                        <span className="text-2xl sm:text-3xl text-[#7F0005]">|</span>
                        <span className="text-2xl sm:text-3xl text-[#7F0005]">Admin Paneli</span>
                    </div>
                </div>

                {/* Çıkış Yap Butonu */}
                <div className="pr-4">
                    <button
                        onClick={handleLogout}
                        className="bg-[#7F0005] text-white text-xl px-4 py-2 rounded-lg hover:bg-[#940008] transition duration-300"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default AdminHeader; 