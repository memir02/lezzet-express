"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function KonumPage() {
    const router = useRouter();
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [cities, setCities] = useState<string[]>([]);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Şehirleri yükleme (API kullanıyorsan burada fetch edebilirsin)
    useEffect(() => {
        setCities(["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın",
            "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum",
            "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep",
            "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük",
            "Karaman", "Kastamonu", "Kayseri", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin",
            "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa",
            "Siirt", "Sinop", "Sivas", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova",
            "Yozgat", "Zonguldak"]);
    }, []);

    const handleConfirm = async () => {
        if (!address || !city) {
            setError('Lütfen adres ve şehir bilgilerini doldurun.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Açık adres ve şehir bilgilerini birleştir
            const fullAddress = `${address}, ${city}`;

            // Adresi kullanıcı profilinde kaydet
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: fullAddress
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Adres bilgileriniz başarıyla kaydedildi. Yönlendiriliyorsunuz...');

                // Konum bilgilerini localStorage'a da kaydet (opsiyonel)
                localStorage.setItem('userLocation', JSON.stringify({
                    address: address,
                    city: city,
                    coordinates: coordinates
                }));

                // 2 saniye sonra restoranlar sayfasına yönlendir
                setTimeout(() => {
                    router.push('/restaurants');
                }, 2000);
            } else {
                setError(data.error || 'Adres kaydedilirken bir hata oluştu.');
            }
        } catch (err) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            console.error("Adres kaydetme hatası:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMapClick = (lat: number, lng: number) => {
        setCoordinates({ lat, lng });
    };

    return (
        <>
            <Header />
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
                <div className="bg-white rounded-lg w-full max-w-xl p-6 shadow-lg">
                    <h2 className="text-2xl font-bold text-[#7F0005] mb-4 text-center">Konumunuzu Seçin</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                            {success}
                        </div>
                    )}

                    {/* Adres Formu */}
                    <div className="mb-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                                <select className="w-full px-3 py-2 border rounded-lg" value="TR" disabled>
                                    <option value="TR">Türkiye</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="">Şehir Seçin</option>
                                    {cities.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Açık Adres</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Mahalle, sokak, bina no"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Harita Alanı (Harita API'si Entegre Edilebilir)
                    <div
                        className="w-full h-[300px] mb-4 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden"
                        onClick={() => handleMapClick(41.0082, 28.9784)} // Örnek: İstanbul'un koordinatları
                    >
                        <iframe
                            src="https://storage.googleapis.com/maps-solutions-l6jxf9cpsf/locator-plus/agb4/locator-plus.html"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            title="Google Maps"
                        ></iframe>
                    </div> */}

                    {/* Buton */}
                    <div className="flex justify-end">
                        <button
                            id="confirmLocation"
                            className={`px-6 py-2 bg-[#7F0005] text-white rounded-lg hover:bg-opacity-90 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? 'Kaydediliyor...' : 'Onayla'}
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
