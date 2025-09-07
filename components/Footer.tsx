'use client';

import React from 'react'
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-[#601013] text-white py-12">
            <div className="container mx-auto px-4">
                {/* Footer Grid: Mobile'de 2 sütun, md ve büyük ekranlarda 4 sütun */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {/* LezzetExpress */}
                    <div>
                        <h3 className="font-sigmar text-2xl mb-4">LezzetExpress</h3>
                        <p className="text-gray-300 text-lg">Türkiye'nin en lezzetli online yemek sipariş platformu</p>
                    </div>

                    {/* Hızlı Linkler */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">Hızlı Linkler</h4>
                        <ul className="space-y-2 text-gray-300 text-lg">
                            <li><Link href="#" className="hover:text-white transition duration-300">Restoranlar</Link></li>
                            <li><Link href="#" className="hover:text-white transition duration-300">Kampanyalar</Link></li>
                            <li><Link href="#" className="hover:text-white transition duration-300">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Yardım */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">Yardım</h4>
                        <ul className="space-y-2 text-gray-300 text-lg">
                            <li><Link href="#" className="hover:text-white transition duration-300">SSS</Link></li>
                            <li><Link href="#" className="hover:text-white transition duration-300">İletişim</Link></li>
                            <li><Link href="#" className="hover:text-white transition duration-300">Gizlilik Politikası</Link></li>
                        </ul>
                    </div>

                    {/* İletişim */}
                    <div>
                        <h4 className="font-bold mb-4 text-lg">İletişim</h4>
                        <ul className="space-y-2 text-gray-300 text-lg">

                            <a href="mailto:info@lezzetexpress.com">info@lezzetexpress.com</a>
                            <li>+90 (555) 555 55 55</li>
                            <li>Konya, Türkiye</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-300">
                    <p>&copy; 2025 LezzetExpress. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer