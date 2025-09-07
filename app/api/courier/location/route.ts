import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

// Konum bilgisini almak için
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'courier') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, location } = body;

        if (!orderId || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            return NextResponse.json({ error: 'Geçersiz konum veya sipariş bilgisi' }, { status: 400 });
        }

        // Siparişin kuryeye ait olduğunu kontrol et
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                courierId: session.user.id,
                status: 'YOLDA'
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Sipariş bulunamadı veya bu siparişe atanmış değilsiniz' }, { status: 404 });
        }

        // Mevcut bir konum kaydı var mı kontrol et
        const existingDelivery = await prisma.delivery.findFirst({
            where: {
                orderId: orderId,
                courierId: session.user.id
            }
        });

        let delivery;

        if (existingDelivery) {
            // Mevcut konum kaydını güncelle
            delivery = await prisma.delivery.update({
                where: {
                    id: existingDelivery.id
                },
                data: {
                    location: location,
                    updatedAt: new Date()
                }
            });
        } else {
            // Yeni konum kaydı oluştur
            delivery = await prisma.delivery.create({
                data: {
                    orderId: orderId,
                    courierId: session.user.id,
                    location: location,
                    status: 'ACTIVE'
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Konum başarıyla güncellendi',
            delivery: delivery
        });

    } catch (error) {
        console.error('Konum güncellenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Kurye konum bilgisini getirmek için
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        console.log('GET /api/courier/location - Aranan OrderID:', orderId);

        if (!orderId) {
            return NextResponse.json({ error: 'Sipariş ID gerekli' }, { status: 400 });
        }

        // Kullanıcı oturumunu kontrol et
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 });
        }

        console.log('GET /api/courier/location - Kullanıcı:', session.user.email, 'Rol:', session.user.role);

        // Sipariş ID'ye göre en son konum bilgisini getir
        const delivery = await prisma.delivery.findFirst({
            where: {
                orderId: orderId
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        console.log('GET /api/courier/location - Delivery Bulundu mu:', !!delivery);

        if (!delivery) {
            // Test için - eğer delivery bulunamadıysa, ilgili sipariş var mı kontrol edelim
            const orderExists = await prisma.order.findUnique({
                where: { id: orderId },
                select: { id: true, status: true, courierId: true }
            });

            console.log('GET /api/courier/location - Sipariş var mı:', !!orderExists, orderExists ? `Durumu: ${orderExists.status}, KuryeID: ${orderExists.courierId}` : '');

            return NextResponse.json({
                error: 'Konum bilgisi bulunamadı',
                details: 'Kurye henüz konum paylaşmaya başlamamış olabilir',
                orderExists: !!orderExists,
                orderStatus: orderExists?.status,
                orderHasCourier: !!orderExists?.courierId
            }, { status: 404 });
        }

        // Sipariş bilgilerini ve kurye bilgilerini de ekle
        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                courier: {
                    select: {
                        name: true,
                        phone: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                },
                restaurant: {
                    select: {
                        name: true,
                        address: true,
                        location: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
        }

        // Kurye, restoran sahibi veya admin değilse, sadece kendi siparişlerini görebilmeli
        if (session.user.role === 'customer' && order.user.id !== session.user.id) {
            return NextResponse.json({ error: 'Bu siparişi görüntüleme yetkiniz yok' }, { status: 403 });
        }

        return NextResponse.json({
            delivery,
            order
        });

    } catch (error) {
        console.error('Konum bilgisi alınırken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 