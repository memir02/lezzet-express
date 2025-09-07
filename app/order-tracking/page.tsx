'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header2 from '@/components/Header2';
import Footer from '@/components/Footer';

// Google tipi bildirimi
declare global {
    interface Window {
        google?: any;
    }
}

// Basit tip tanımlamaları
interface GoogleMap {
    panTo(latLng: Location): void;
}

interface GoogleMapMarker {
    setPosition(latLng: Location): void;
    getAnimation(): any;
    setAnimation(animation: any): void;
    setMap(map: GoogleMap | null): void;
}

interface Location {
    lat: number;
    lng: number;
}

interface Courier {
    name: string;
    phone: string;
}

interface OrderData {
    id: string;
    status: string;
    courier: Courier;
    restaurant: {
        name: string;
        address: string;
        location: Location;
    };
    user: {
        name: string;
        address: string;
    };
}

interface DeliveryData {
    id: string;
    location: Location;
    updatedAt: string;
    status: string;
}

interface TrackingData {
    order: OrderData;
    delivery: DeliveryData;
}

// Hata tipini tanımlayalım
interface ErrorWithMessage {
    message: string;
}

// Debug bilgisi için tip tanımı
interface DebugInfo {
    status?: number;
    statusText?: string;
    url?: string;
    responseData?: any;
    testResponse?: any;
    error?: string;
    courierLocationData?: any;
    restaurantLocationData?: any;
    mapCreationError?: string;
    positionUpdateError?: string;
    simulationProgress?: number;
}

export default function OrderTrackingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<GoogleMap | null>(null);
    const markerRef = useRef<GoogleMapMarker | null>(null);
    const restaurantMarkerRef = useRef<GoogleMapMarker | null>(null);
    const destinationMarkerRef = useRef<GoogleMapMarker | null>(null);
    const deliveryPointMarkerRef = useRef<GoogleMapMarker | null>(null);
    const routePathRef = useRef<any>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [simulationRunning, setSimulationRunning] = useState(false);
    const [simulationProgress, setSimulationProgress] = useState(0);
    const [targetLocation, setTargetLocation] = useState<Location | null>(null);
    const geocoderRef = useRef<any>(null);

    // Adres metnini koordinatlara dönüştüren fonksiyon
    const geocodeAddress = async (address: string): Promise<Location | null> => {
        if (!window.google?.maps || !address) return null;

        try {
            // Eğer geocoder örneği yoksa oluştur
            if (!geocoderRef.current) {
                // @ts-ignore
                geocoderRef.current = new window.google.maps.Geocoder();
            }

            // Adresin tam olması için Türkiye'yi ekle (eğer yoksa)
            const fullAddress = address.toLowerCase().includes('türkiye') ||
                address.toLowerCase().includes('turkey') ?
                address : `${address}, Türkiye`;

            console.log('Geocoding için gönderilen adres:', fullAddress);

            return new Promise((resolve, reject) => {
                geocoderRef.current.geocode({ 'address': fullAddress }, (results: any, status: any) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const location = {
                            lat: results[0].geometry.location.lat(),
                            lng: results[0].geometry.location.lng()
                        };
                        console.log('Geocoding sonucu:', location, results[0].formatted_address);
                        resolve(location);
                    } else {
                        console.error('Geocoding hatası:', status);
                        resolve(null);
                    }
                });
            });
        } catch (error) {
            console.error('Geocoding işlemi sırasında hata:', error);
            return null;
        }
    };

    // Google Maps script yükleme
    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (window.google?.maps) return Promise.resolve();

            const googleMapsApiKey = 'AIzaSyAjOrMz9DvNQo7DZXkNYt2PYiVYt8DAuSI'; // Google Maps API anahtarınızı buraya ekleyin

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

        loadGoogleMapsScript()
            .then(() => {
                if (orderId) {
                    fetchTrackingData();
                    startPolling();
                } else {
                    setError('Sipariş ID bulunamadı');
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error('Google Maps yükleme hatası:', err);
                setError('Harita yüklenirken bir hata oluştu');
                setLoading(false);
            });

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [orderId]);

    // Polling işlemi başlat
    const startPolling = () => {
        // Her 10 saniyede bir konum bilgisini güncelle
        pollIntervalRef.current = setInterval(fetchTrackingData, 10000);
    };

    // Takip verilerini getir
    const fetchTrackingData = async () => {
        if (!orderId) {
            setError(`Sipariş ID bulunamadı. URL parametresi: ${window.location.search}`);
            setLoading(false);
            return;
        }

        try {
            console.log(`Konum verisi alınıyor: /api/courier/location?orderId=${orderId}`);
            const response = await fetch(`/api/courier/location?orderId=${orderId}`);
            const responseData = await response.json();

            setDebugInfo({
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                responseData
            });

            if (response.status === 401) {
                router.push('/login');
                return;
            }

            if (response.status === 403) {
                setError('Bu siparişi görüntüleme yetkiniz bulunmuyor');
                setLoading(false);
                return;
            }

            if (response.status === 404) {
                // Test API kullanarak sipariş bilgilerini kontrol et
                try {
                    const testResponse = await fetch(`/api/test-delivery?orderId=${orderId}`);
                    const testData = await testResponse.json();
                    updateDebugInfo({
                        testResponse: testData
                    });

                    if (testResponse.ok && testData.createdOrUpdatedDelivery) {
                        // Test veri oluşturulduysa yeniden dene
                        setTimeout(() => fetchTrackingData(), 1000);
                        return;
                    }
                } catch (error) {
                    const err = error as ErrorWithMessage;
                    console.error('Test API hatası:', err);
                }

                setError(`Kurye henüz konumunu paylaşmamış veya sipariş bulunamadı. Sipariş ID: ${orderId}`);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error(responseData.error || 'Sipariş takip bilgisi alınamadı');
            }

            setTrackingData(responseData);
            setLoading(false);

            // İlk yükleme veya güncellemede haritayı oluştur
            if (responseData.delivery && responseData.delivery.location) {
                initializeOrUpdateMap(responseData);
            }
        } catch (error) {
            const err = error as ErrorWithMessage;
            console.error('Takip verisi alınırken hata:', err);
            setError('Sipariş takip verileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            setLoading(false);
        }
    };

    // Hata ayıklama bilgilerini güncellemek için yardımcı fonksiyon
    const updateDebugInfo = (newInfo: Partial<DebugInfo>) => {
        setDebugInfo((prev: DebugInfo | null) => ({
            ...prev || {},
            ...newInfo
        }));
    };

    // Verileri işledikten sonra adres geocoding işlemi yapacak
    useEffect(() => {
        const processDeliveryLocation = async () => {
            if (trackingData && trackingData.order && trackingData.order.user && trackingData.order.user.address) {
                const customerAddress = trackingData.order.user.address;

                console.log('Müşteri adresi için geocoding yapılıyor:', customerAddress);

                const coordinates = await geocodeAddress(customerAddress);

                if (coordinates) {
                    console.log('Geocoding başarılı:', coordinates);
                    setTargetLocation(coordinates);

                    // Eğer teslimat adresi marker'ı zaten oluşturulmuşsa konumunu güncelle
                    if (destinationMarkerRef.current && googleMapRef.current) {
                        destinationMarkerRef.current.setPosition(coordinates);
                    }
                } else {
                    console.log('Geocoding başarısız, varsayılan Konya koordinatları kullanılıyor');
                    setTargetLocation({ lat: 37.8728, lng: 32.4922 }); // Konya koordinatları
                }
            }
        };

        processDeliveryLocation();
    }, [trackingData]);

    // Harita başlatma veya güncelleme
    const initializeOrUpdateMap = (data: TrackingData) => {
        const { delivery, order } = data;

        if (!window.google?.maps || !mapRef.current) return;

        const courierLocation = delivery.location;
        const restaurantLocation = order.restaurant.location;
        const customerAddress = order.user.address;

        // Teslimat noktası için koordinatları kullan (geocoding sonucu veya varsayılan)
        // targetLocation henüz ayarlanmamışsa varsayılan değer kullan
        const deliveryLocation = targetLocation || { lat: 37.8728, lng: 32.4922 }; // Konya koordinatları

        // Log konum bilgilerini hata ayıklama için
        console.log('Kurye Konumu:', courierLocation);
        console.log('Restoran Konumu:', restaurantLocation);
        console.log('Müşteri Adresi:', customerAddress);
        console.log('Teslimat Konumu:', deliveryLocation);

        // Konum verilerinin doğruluğunu kontrol et
        if (!courierLocation || typeof courierLocation.lat !== 'number' || typeof courierLocation.lng !== 'number') {
            console.error('Geçersiz kurye konum bilgisi:', courierLocation);
            updateDebugInfo({
                error: 'Kurye konum bilgisi geçersiz',
                courierLocationData: courierLocation
            });
            return;
        }

        if (!restaurantLocation || typeof restaurantLocation.lat !== 'number' || typeof restaurantLocation.lng !== 'number') {
            console.error('Geçersiz restoran konum bilgisi:', restaurantLocation);
            updateDebugInfo({
                error: 'Restoran konum bilgisi geçersiz',
                restaurantLocationData: restaurantLocation
            });
            return;
        }

        // Harita yoksa oluştur
        if (!googleMapRef.current) {
            const mapOptions = {
                center: courierLocation,
                zoom: 15,
                mapTypeId: "roadmap",
                mapTypeControl: false,
            };

            try {
                // @ts-ignore
                googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

                // Kurye işaretçisi
                try {
                    // @ts-ignore
                    markerRef.current = new window.google.maps.Marker({
                        position: courierLocation,
                        map: googleMapRef.current,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: '#FFFFFF',
                            strokeWeight: 4
                        },
                        title: 'Kurye',
                        animation: window.google.maps.Animation.BOUNCE,
                        zIndex: 1000
                    });
                    console.log('Kurye işaretçisi oluşturuldu');
                } catch (error) {
                    const err = error as ErrorWithMessage;
                    console.error('Kurye işaretçisi oluşturulurken hata:', err);
                }

                // Restoran işaretçisi
                try {
                    // @ts-ignore
                    restaurantMarkerRef.current = new window.google.maps.Marker({
                        position: restaurantLocation,
                        map: googleMapRef.current,
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                            // @ts-ignore
                            scaledSize: new window.google.maps.Size(40, 40)
                        },
                        title: order.restaurant.name,
                    });
                    console.log('Restoran işaretçisi oluşturuldu');
                } catch (error) {
                    const err = error as ErrorWithMessage;
                    console.error('Restoran işaretçisi oluşturulurken hata:', err);
                }

                // Teslimat adresi işaretçisi - geocoding sonucu veya varsayılan
                try {
                    // @ts-ignore
                    destinationMarkerRef.current = new window.google.maps.Marker({
                        position: deliveryLocation,
                        map: googleMapRef.current,
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                            // @ts-ignore
                            scaledSize: new window.google.maps.Size(40, 40)
                        },
                        title: 'Teslimat Adresi: ' + customerAddress,
                    });
                    console.log('Teslimat adresi işaretçisi oluşturuldu (geocoding konumunda)');
                } catch (error) {
                    const err = error as ErrorWithMessage;
                    console.error('Teslimat adresi işaretçisi oluşturulurken hata:', err);
                }
            } catch (error) {
                const err = error as ErrorWithMessage;
                console.error('Harita oluşturulurken hata:', err);
                updateDebugInfo({
                    mapCreationError: err.message
                });
            }
        } else {
            // Mevcut haritada kurye konumunu güncelle
            try {
                markerRef.current?.setPosition(courierLocation);

                // Animasyonu kontrol et ve ayarla
                if (markerRef.current && !markerRef.current.getAnimation()) {
                    markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
                }

                console.log('Kurye konumu güncellendi');

                // Harita merkezi güncelleme
                googleMapRef.current.panTo(courierLocation);
            } catch (error) {
                const err = error as ErrorWithMessage;
                console.error('Konum güncellenirken hata:', err);
                updateDebugInfo({
                    positionUpdateError: err.message
                });
            }
        }
    };

    // Simülasyon başlat
    const startSimulation = () => {
        if (!trackingData || simulationRunning) return;

        // Polling mekanizmasını durdur
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        const restaurantLocation = trackingData.order.restaurant.location;
        // Kayıtlı müşteri adresi için geocoding sonucunu kullan veya varsayılan koordinatlara dön
        const deliveryLocation = targetLocation || { lat: 37.8728, lng: 32.4922 }; // Varsayılan Konya koordinatları

        setSimulationRunning(true);
        setSimulationProgress(0);

        // Teslimat noktası marker'ını oluştur (sadece bir kez)
        if (!deliveryPointMarkerRef.current && googleMapRef.current) {
            try {
                // @ts-ignore
                deliveryPointMarkerRef.current = new window.google.maps.Marker({
                    position: deliveryLocation,
                    map: googleMapRef.current,
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        // @ts-ignore
                        scaledSize: new window.google.maps.Size(40, 40)
                    },
                    title: 'Teslimat Noktası (Hedef): ' + trackingData.order.user.address,
                    zIndex: 900
                });
            } catch (error) {
                console.error('Teslimat noktası işaretçisi oluşturulurken hata:', error);
            }

            // Rota çizgisini oluştur
            try {
                // @ts-ignore
                routePathRef.current = new window.google.maps.Polyline({
                    path: [restaurantLocation, deliveryLocation],
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.7,
                    strokeWeight: 2,
                    map: googleMapRef.current
                });
            } catch (error) {
                console.error('Rota çizgisi oluşturulurken hata:', error);
            }
        }

        // Her 1 saniyede bir kurye konumunu güncelle
        simulationIntervalRef.current = setInterval(() => {
            setSimulationProgress(prev => {
                const newProgress = Math.min(prev + 0.01, 1);

                if (newProgress >= 1) {
                    // Simülasyon tamamlandı
                    if (simulationIntervalRef.current) {
                        clearInterval(simulationIntervalRef.current);
                    }
                    setSimulationRunning(false);

                    // Polling mekanizmasını yeniden başlat
                    startPolling();
                }

                // Kurye konumunu hesapla (doğrusal enterpolasyon)
                const newLocation = {
                    lat: restaurantLocation.lat + (deliveryLocation.lat - restaurantLocation.lat) * newProgress,
                    lng: restaurantLocation.lng + (deliveryLocation.lng - restaurantLocation.lng) * newProgress
                };

                // Kurye konumunu güncelle
                if (markerRef.current) {
                    markerRef.current.setPosition(newLocation);

                    // Harita merkezi güncelleme
                    if (googleMapRef.current) {
                        googleMapRef.current.panTo(newLocation);
                    }
                }

                // Debug bilgileri güncelle
                updateDebugInfo({
                    courierLocationData: newLocation,
                    simulationProgress: newProgress
                });

                return newProgress;
            });
        }, 250); // Her 250ms'de bir güncelle - daha akıcı hareket için
    };

    // Simülasyonu durdur
    const stopSimulation = () => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        setSimulationRunning(false);

        // Temizlik - teslimat noktası marker'ını ve rota çizgisini kaldır
        if (deliveryPointMarkerRef.current) {
            deliveryPointMarkerRef.current.setMap(null);
            deliveryPointMarkerRef.current = null;
        }

        if (routePathRef.current) {
            routePathRef.current.setMap(null);
            routePathRef.current = null;
        }

        // Polling mekanizmasını yeniden başlat
        startPolling();
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
            }

            // Temizlik - teslimat noktası marker'ını ve rota çizgisini kaldır
            if (deliveryPointMarkerRef.current) {
                deliveryPointMarkerRef.current.setMap(null);
            }

            if (routePathRef.current) {
                routePathRef.current.setMap(null);
            }
        };
    }, []);

    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Sipariş Takibi</h1>

                    {loading ? (
                        <div className="text-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7F0005] mx-auto"></div>
                            <p className="mt-4">Sipariş bilgileri yükleniyor...</p>
                            <p className="mt-2 text-sm text-gray-500">Sipariş ID: {orderId || 'bulunamadı'}</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <p className="text-center text-red-600 mb-4">
                                {error}
                            </p>

                            {debugInfo && (
                                <div className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-64">
                                    <h3 className="font-bold mb-2">Hata Ayıklama Bilgisi:</h3>
                                    <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(debugInfo, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="flex justify-center mt-4 space-x-4">
                                <button
                                    onClick={() => router.push('/orders')}
                                    className="px-4 py-2 bg-[#7F0005] text-white rounded hover:bg-opacity-90"
                                >
                                    Siparişlerime Dön
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!orderId) return;
                                        setLoading(true);
                                        setError(null);
                                        try {
                                            await fetch(`/api/test-delivery?orderId=${orderId}&force=true`);
                                            setTimeout(() => fetchTrackingData(), 1000);
                                        } catch (error) {
                                            const err = error as ErrorWithMessage;
                                            console.error('Test verileri oluşturulurken hata:', err);
                                            setError('Test verileri oluşturulurken bir hata oluştu');
                                            setLoading(false);
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-opacity-90"
                                >
                                    Test Verileri Oluştur
                                </button>
                            </div>
                        </div>
                    ) : trackingData ? (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="mb-4 pb-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold mb-2">Sipariş Durumu</h2>
                                <p className="text-lg">
                                    <span className={`inline-block px-3 py-1 rounded-full ${trackingData.order.status === 'TAMAMLANDI'
                                        ? 'bg-green-100 text-green-800'
                                        : trackingData.order.status === 'IPTAL_EDILDI'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {trackingData.order.status === 'YOLDA'
                                            ? 'Sipariş Yolda'
                                            : trackingData.order.status === 'TAMAMLANDI'
                                                ? 'Sipariş Teslim Edildi'
                                                : trackingData.order.status === 'IPTAL_EDILDI'
                                                    ? 'Sipariş İptal Edildi'
                                                    : 'Sipariş Hazırlanıyor'}
                                    </span>
                                </p>
                            </div>

                            {trackingData.order.status === 'YOLDA' && trackingData.order.courier && (
                                <div className="mb-4 pb-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold mb-2">Kurye Bilgileri</h2>
                                    <p><strong>Kurye Adı:</strong> {trackingData.order.courier.name}</p>
                                    <p><strong>Telefon:</strong> {trackingData.order.courier.phone}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Son Güncelleme: {new Date(trackingData.delivery.updatedAt).toLocaleTimeString('tr-TR')}
                                    </p>
                                </div>
                            )}

                            <div className="mb-4">
                                <h2 className="text-xl font-semibold mb-2">Restoran Bilgileri</h2>
                                <p><strong>Restoran:</strong> {trackingData.order.restaurant.name}</p>
                                <p><strong>Adres:</strong> {trackingData.order.restaurant.address}</p>
                            </div>

                            {trackingData.delivery && trackingData.delivery.location && (
                                <div className="mt-6">
                                    <h2 className="text-xl font-semibold mb-4">Canlı Takip</h2>
                                    <div
                                        ref={mapRef}
                                        className="w-full h-[400px] rounded-lg border border-gray-300 bg-gray-100"
                                    ></div>
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        Haritada <span className="text-blue-500 font-semibold">mavi işaret</span> kurye konumunu, <span className="text-red-500 font-semibold">kırmızı işaret</span> restoranı ve <span className="text-green-500 font-semibold">yeşil işaret</span> müşterinin kayıtlı adresinin bulunduğu teslimat noktasını göstermektedir.
                                    </p>

                                    <div className="mt-4 flex justify-center space-x-4">
                                        {!simulationRunning ? (
                                            <button
                                                onClick={startSimulation}
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Teslimat Simülasyonu Başlat
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopSimulation}
                                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Simülasyonu Durdur
                                            </button>
                                        )}
                                    </div>

                                    {simulationRunning && (
                                        <div className="mt-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-blue-600 h-2.5 rounded-full"
                                                    style={{ width: `${simulationProgress * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-center mt-2">
                                                Teslimat ilerlemesi: %{Math.round(simulationProgress * 100)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <p className="text-center text-gray-600">
                                Sipariş bilgisi bulunamadı.
                            </p>
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => router.push('/orders')}
                                    className="px-4 py-2 bg-[#7F0005] text-white rounded hover:bg-opacity-90"
                                >
                                    Siparişlerime Dön
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
} 