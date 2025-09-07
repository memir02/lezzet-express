'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    HomeIcon,
    ShoppingCartIcon,
    LogOutIcon,
    MapPinIcon,
    UserIcon,
    PhoneIcon,
} from 'lucide-react';

interface Order {
    id: string;
    status: string;
    totalPrice: number;
    orderedAt: string;
    user: {
        name: string;
        phoneNumber: string;
        address: string;
    };
    restaurant: {
        name: string;
        address: string;
    };
    items: {
        id: string;
        quantity: number;
        menu: {
            name: string;
            price: number;
        };
    }[];
}

interface Location {
    lat: number;
    lng: number;
}

export default function CourierPanel() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [locationTracking, setLocationTracking] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [locationAddress, setLocationAddress] = useState<string | null>(null);
    const [showManualLocationModal, setShowManualLocationModal] = useState(false);
    const [manualAddress, setManualAddress] = useState('');
    const [loadingManualLocation, setLoadingManualLocation] = useState(false);
    const watchPositionRef = useRef<number | null>(null);
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const geocoderRef = useRef<any>(null);

    useEffect(() => {
        if (session?.user) {
            fetchOrders();
            // Konum izni kontrolü
            checkLocationPermission();
        }
    }, [session]);

    useEffect(() => {
        if (status === 'loading') return; // Henüz oturum bilgisi gelmedi, bekle

        if (status === 'unauthenticated' || session?.user.role !== 'courier') {
            router.replace('/');
        }
    }, [status, session]);

    // Google Maps Geocoder yükleme
    useEffect(() => {
        if (!window.google?.maps?.Geocoder && currentLocation) {
            loadGoogleMapsScript().then(() => {
                if (window.google?.maps?.Geocoder) {
                    // @ts-ignore
                    geocoderRef.current = new window.google.maps.Geocoder();
                    reverseGeocode(currentLocation);
                }
            });
        }
    }, [currentLocation]);

    // Google Maps script yükleme
    const loadGoogleMapsScript = () => {
        if (window.google?.maps) return Promise.resolve();

        const googleMapsApiKey = 'AIzaSyAjOrMz9DvNQo7DZXkNYt2PYiVYt8DAuSI';

        return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Google Maps yüklenemedi'));
            document.head.appendChild(script);
        });
    };

    // Reverse geocoding - koordinatları adrese dönüştürme
    const reverseGeocode = async (location: Location) => {
        if (!window.google?.maps || !location) return;

        try {
            if (!geocoderRef.current) {
                // @ts-ignore
                geocoderRef.current = new window.google.maps.Geocoder();
            }

            const latlng = { lat: location.lat, lng: location.lng };

            geocoderRef.current.geocode({ 'location': latlng }, (results: any, status: any) => {
                if (status === 'OK' && results && results.length > 0) {
                    const formattedAddress = results[0].formatted_address;
                    // Geocoding sonucunda dönen koordinatları al - bu haritada gösterilen koordinatlarla daha tutarlı olacak
                    const geocodedLocation = {
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng()
                    };
                    console.log('Reverse Geocoding sonucu (adres):', formattedAddress);
                    console.log('Reverse Geocoding sonucu (konum):', geocodedLocation);

                    setLocationAddress(formattedAddress);
                    // Geocoding sonucunda dönen koordinatları kullan - bu haritada gösterilen konum ile aynı olacak
                    setCurrentLocation(geocodedLocation);

                    // Sipariş ID'si varsa sunucuya da yeni koordinatları gönder
                    if (selectedOrderId) {
                        sendLocationToServer(selectedOrderId, geocodedLocation);
                    }
                } else {
                    console.error('Reverse Geocoding hatası:', status);
                    setLocationAddress(null);
                }
            });
        } catch (error) {
            console.error('Reverse Geocoding işlemi sırasında hata:', error);
            setLocationAddress(null);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/courier/orders');
            if (!res.ok) throw new Error('Veri çekilemedi');
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            setError('Veri çekilirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const checkLocationPermission = () => {
        if ('permissions' in navigator) {
            // @ts-ignore
            navigator.permissions.query({ name: 'geolocation' })
                .then(permissionStatus => {
                    setLocationPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');

                    permissionStatus.onchange = () => {
                        setLocationPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
                    };
                })
                .catch(error => {
                    console.error('Konum izni kontrolü hatası:', error);
                });
        }
    };

    const requestLocationPermission = () => {
        if ('geolocation' in navigator) {
            // Konum alınırken bilgi mesajı göster
            alert('Konum alınıyor. Lütfen bekleyin ve izin penceresinde "İzin ver" seçeneğini seçin. Doğru konum için GPS özelliğinizi açmanız önerilir.');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationPermission('granted');
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCurrentLocation(newLocation);
                    reverseGeocode(newLocation);

                    console.log('Konum doğruluğu:', position.coords.accuracy, 'metre');
                    if (position.coords.accuracy > 100) {
                        alert('Konum düşük doğrulukla alındı. Doğru konum için WiFi/Mobil veri açık olmalı ve GPS etkin olmalıdır.');
                    }
                },
                (error) => {
                    console.error('Konum izni reddedildi:', error);
                    setLocationPermission('denied');
                    alert('Konum alınamadı. Lütfen tarayıcı ayarlarınızdan konum erişimine izin verin ve sayfayı yenileyin.');
                },
                {
                    enableHighAccuracy: true, // Yüksek doğruluk modunu etkinleştir (GPS kullan)
                    timeout: 10000, // 10 saniye içinde konum alınamazsa hata ver
                    maximumAge: 0 // Her zaman en güncel konumu al
                }
            );
        } else {
            alert('Tarayıcınız konum servislerini desteklemiyor. Lütfen farklı bir tarayıcı deneyin.');
        }
    };

    const startLocationTracking = (orderId: string) => {
        if (locationPermission !== 'granted') {
            requestLocationPermission();
            return;
        }

        if (watchPositionRef.current) {
            // Zaten izleme yapılıyorsa durdur ve yeniden başlat
            stopLocationTracking();
        }

        // Konum izleme başladığını bildir
        alert('Konum takibi başlatılıyor. Doğru konum için Wi-Fi bağlantınızın açık ve GPS özelliğinizin etkin olduğundan emin olun.');

        // Konum izleme başlat
        setLocationTracking(true);
        setSelectedOrderId(orderId);

        // Konum değişikliklerini izle
        watchPositionRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const rawLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                console.log('Ham konum:', rawLocation);
                console.log('Konum doğruluğu:', position.coords.accuracy, 'metre');

                // Önce ham konum verilerini kullan
                setCurrentLocation(rawLocation);
                // Sonra geocoding işlemi ile daha doğru konum bilgisini al
                reverseGeocode(rawLocation);
            },
            (error) => {
                console.error('Konum izleme hatası:', error);
                alert('Konum takibi sırasında hata oluştu. Lütfen tarayıcı izinlerinizi kontrol edin ve GPS özelliğinizin açık olduğundan emin olun.');
                stopLocationTracking();
            },
            {
                enableHighAccuracy: true, // Yüksek doğruluk modunu etkinleştir (GPS kullan)
                timeout: 10000, // 10 saniye içinde konum alınamazsa hata ver
                maximumAge: 0 // Her zaman en güncel konumu al
            }
        );

        // Konum verilerini sunucuya gönder (15 saniyede bir)
        locationIntervalRef.current = setInterval(() => {
            if (currentLocation) {
                sendLocationToServer(orderId, currentLocation);
            }
        }, 15000);

        // İlk konum gönderme
        if (currentLocation) {
            sendLocationToServer(orderId, currentLocation);
        }
    };

    const stopLocationTracking = () => {
        if (watchPositionRef.current) {
            navigator.geolocation.clearWatch(watchPositionRef.current);
            watchPositionRef.current = null;
        }

        if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }

        setLocationTracking(false);
        setSelectedOrderId(null);
    };

    const sendLocationToServer = async (orderId: string, location: { lat: number, lng: number }) => {
        try {
            const response = await fetch('/api/courier/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    location
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                console.error('Konum güncellemesi başarısız:', data.error);
            }
        } catch (error) {
            console.error('Konum gönderirken hata:', error);
        }
    };

    const handleCompleteOrder = async (orderId: string) => {
        try {
            // Eğer konum izleme aktifse, durdur
            if (locationTracking && selectedOrderId === orderId) {
                stopLocationTracking();
            }

            const res = await fetch('/api/courier/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    action: 'complete'
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Sipariş tamamlanamadı');
            }

            await fetchOrders();
        } catch (error) {
            console.error('Sipariş tamamlanırken hata:', error);
            alert(error instanceof Error ? error.message : 'Sipariş tamamlanırken bir hata oluştu');
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrderId || !cancelReason.trim()) {
            alert('Lütfen iptal sebebini belirtin');
            return;
        }

        try {
            // Eğer konum izleme aktifse, durdur
            if (locationTracking) {
                stopLocationTracking();
            }

            const res = await fetch('/api/courier/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: selectedOrderId,
                    action: 'cancel',
                    reason: cancelReason
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Sipariş iptal edilemedi');
            }

            await fetchOrders();
            setShowCancelModal(false);
            setSelectedOrderId(null);
            setCancelReason('');
        } catch (error) {
            console.error('Sipariş iptal edilirken hata:', error);
            alert(error instanceof Error ? error.message : 'Sipariş iptal edilirken bir hata oluştu');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/');
    };

    // Konum bilgisini manuel olarak güncelle (adres üzerinden)
    const updateLocationManually = async () => {
        if (!manualAddress.trim()) {
            alert('Lütfen bir adres girin');
            return;
        }

        setLoadingManualLocation(true);

        try {
            if (!window.google?.maps) {
                await loadGoogleMapsScript();
            }

            if (!geocoderRef.current) {
                // @ts-ignore
                geocoderRef.current = new window.google.maps.Geocoder();
            }

            // Adresin Türkiye'de aranmasını sağla
            const fullAddress = manualAddress.toLowerCase().includes('türkiye') ||
                manualAddress.toLowerCase().includes('turkey') ?
                manualAddress : `${manualAddress}, Türkiye`;

            geocoderRef.current.geocode({ 'address': fullAddress }, (results: any, status: any) => {
                setLoadingManualLocation(false);

                if (status === 'OK' && results && results.length > 0) {
                    const geocodedLocation = {
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng()
                    };
                    const formattedAddress = results[0].formatted_address;

                    console.log('Manuel konum güncellendi:', geocodedLocation);
                    console.log('Adres:', formattedAddress);

                    setCurrentLocation(geocodedLocation);
                    setLocationAddress(formattedAddress);

                    // Eğer takip aktifse, sunucuya yeni konumu gönder
                    if (locationTracking && selectedOrderId) {
                        sendLocationToServer(selectedOrderId, geocodedLocation);
                    }

                    setShowManualLocationModal(false);
                    setManualAddress('');
                } else {
                    console.error('Geocoding hatası:', status);
                    alert('Adres bulunamadı. Lütfen daha spesifik bir adres girin.');
                }
            });
        } catch (error) {
            console.error('Manuel konum güncellemesi sırasında hata:', error);
            setLoadingManualLocation(false);
            alert('Konum güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    const renderCancelModal = () => {
        if (!showCancelModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                    <h3 className="text-lg font-semibold mb-4">Siparişi İptal Et</h3>
                    <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                        placeholder="İptal sebebini yazın..."
                        rows={4}
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => {
                                setShowCancelModal(false);
                                setSelectedOrderId(null);
                                setCancelReason('');
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={handleCancelOrder}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            İptal Et
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Manuel konum giriş modalı
    const renderManualLocationModal = () => {
        if (!showManualLocationModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                    <h3 className="text-lg font-semibold mb-4">Manuel Konum Girişi</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Adres
                        </label>
                        <input
                            type="text"
                            value={manualAddress}
                            onChange={(e) => setManualAddress(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Örn: Konya, Selçuklu, Fevzi Çakmak Mah."
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setShowManualLocationModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            disabled={loadingManualLocation}
                        >
                            İptal
                        </button>
                        <button
                            onClick={updateLocationManually}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            disabled={loadingManualLocation}
                        >
                            {loadingManualLocation ? 'Güncelleniyor...' : 'Konumu Güncelle'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Yardımcı bilgi bileşeni
    const LocationHelpInfo = () => {
        return (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm border border-blue-200">
                <h4 className="font-medium mb-1 text-blue-700">Konum Alınamıyor mu?</h4>
                <ul className="list-disc pl-5 text-blue-800 space-y-1">
                    <li>Cihazınızda GPS özelliğinin açık olduğundan emin olun</li>
                    <li>Wi-Fi veya mobil veri bağlantınızın aktif olduğunu kontrol edin</li>
                    <li>Tarayıcı ayarlarınızdan konum izinlerini kontrol edin</li>
                    <li>Varsa, daha iyi GPS alıcısı olan başka bir cihaz (örn. cep telefonu) kullanın</li>
                    <li>Bina içindeyseniz pencere kenarına veya açık alana gidin</li>
                </ul>
            </div>
        );
    };

    // Konum bilgisini gösteren yardımcı bileşen
    const LocationDisplay = () => {
        if (!currentLocation) return null;

        return (
            <div className="mt-2 text-xs text-gray-600">
                <p className="flex items-center mb-1">
                    <MapPinIcon className="w-3 h-3 mr-1 text-blue-500" />
                    <span>Haritadaki Konum: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                </p>
                {locationAddress && (
                    <p className="pl-4 text-gray-700">
                        <span className="font-medium">Adres:</span> {locationAddress}
                    </p>
                )}
                <button
                    onClick={() => setShowManualLocationModal(true)}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-700 flex items-center"
                >
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    Manuel Konum Gir
                </button>
            </div>
        );
    };

    const renderOrders = () => (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Aktif Siparişlerim</h1>

            {/* Konum yardım bilgisi - her zaman göster */}
            <LocationHelpInfo />

            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="space-y-4">
                        {orders
                            .filter(order => order.status === 'YOLDA')
                            .map((order) => (
                                <div key={order.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-medium">{order.restaurant.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.orderedAt).toLocaleDateString("tr-TR")}
                                            </p>
                                        </div>
                                        <p className="font-semibold">{order.totalPrice} TL</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded">
                                            <h4 className="font-medium mb-2">Müşteri Bilgileri</h4>
                                            <div className="space-y-1">
                                                <p className="flex items-center">
                                                    <UserIcon className="w-4 h-4 mr-2" />
                                                    {order.user.name}
                                                </p>
                                                <p className="flex items-center">
                                                    <PhoneIcon className="w-4 h-4 mr-2" />
                                                    {order.user.phoneNumber}
                                                </p>
                                                <p className="flex items-center">
                                                    <MapPinIcon className="w-4 h-4 mr-2" />
                                                    {order.user.address}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-3 rounded">
                                            <h4 className="font-medium mb-2">Sipariş Detayları</h4>
                                            <div className="space-y-1">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="text-sm">
                                                        {item.quantity}x {item.menu.name} - {item.menu.price} TL
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Konum İzleme Butonu */}
                                        <div className="bg-blue-50 p-3 rounded">
                                            <h4 className="font-medium mb-2">Konum Takibi</h4>
                                            <div className="text-sm">
                                                {locationPermission === 'denied' ? (
                                                    <p className="text-red-500">
                                                        Konum izni reddedildi. Konum takibi için lütfen tarayıcı ayarlarınızdan izin verin.
                                                    </p>
                                                ) : locationTracking && selectedOrderId === order.id ? (
                                                    <div>
                                                        <p className="text-green-600 mb-2">
                                                            Konumunuz takip ediliyor ve müşteri ile paylaşılıyor.
                                                        </p>
                                                        <button
                                                            onClick={() => stopLocationTracking()}
                                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                        >
                                                            Takibi Durdur
                                                        </button>

                                                        {currentLocation && <LocationDisplay />}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="mb-2">
                                                            Konum takibini başlatarak müşteriye canlı konum bilgisi sağlayabilirsiniz.
                                                        </p>
                                                        <button
                                                            onClick={() => startLocationTracking(order.id)}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                                        >
                                                            Konum Takibini Başlat
                                                        </button>

                                                        {currentLocation && <LocationDisplay />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrderId(order.id);
                                                    setShowCancelModal(true);
                                                }}
                                                className="px-4 py-2 text-red-500 hover:text-red-700"
                                            >
                                                İptal Et
                                            </button>
                                            <button
                                                onClick={() => handleCompleteOrder(order.id)}
                                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Teslim Edildi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
            {renderCancelModal()}
            {renderManualLocationModal()}
        </div>
    );

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
                        <h1 className="text-xl font-semibold text-[#7F0005]">Kurye Paneli</h1>
                        <div className="text-gray-700">{session?.user?.name}</div>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {loading ? (
                        <div>Yükleniyor...</div>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        renderOrders()
                    )}
                </main>
            </div>
        </div>
    );
}