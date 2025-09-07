import { NextResponse } from 'next/server';
import prisma from '@/app/utils/prisma';

// Bu API endpointi sadece test amaçlıdır ve gerçek bir uygulamada güvenlik önlemleriyle korunmalıdır

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const forceUpdate = searchParams.get('force') === 'true';

        if (!orderId) {
            return NextResponse.json({ error: 'Sipariş ID gerekli' }, { status: 400 });
        }

        // Sipariş bilgilerini getir
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                courier: true,
                restaurant: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Sipariş bulunamadı', orderId }, { status: 404 });
        }

        // Delivery tablosunda kayıt var mı kontrol et
        const delivery = await prisma.delivery.findFirst({
            where: { orderId: orderId },
            orderBy: { updatedAt: 'desc' }
        });

        // Restoran konum bilgisini kontrol et ve gerekirse güncelle
        let restaurantUpdated = false;
        let defaultRestaurantLocation = {
            lat: 41.0149, // İstanbul, Taksim için örnek koordinatlar
            lng: 28.9768
        };

        if (!order.restaurant.location || !order.restaurant.location.lat || !order.restaurant.location.lng || forceUpdate) {
            await prisma.restaurant.update({
                where: { id: order.restaurant.id },
                data: {
                    location: defaultRestaurantLocation
                }
            });
            restaurantUpdated = true;
        }

        // Test için kurye konum bilgisini restoranın konumu olarak ayarlayalım
        const restaurantLocation = restaurantUpdated ? defaultRestaurantLocation : order.restaurant.location;

        // Eğer delivery yoksa ve sipariş yoldaysa, test için bir konum kaydı oluştur
        let createdDelivery = null;
        if ((!delivery && order.status === 'YOLDA' && order.courierId) || forceUpdate) {
            if (delivery && forceUpdate) {
                createdDelivery = await prisma.delivery.update({
                    where: { id: delivery.id },
                    data: {
                        location: restaurantLocation, // Kurye konumunu restoranın konumundan başlat
                        updatedAt: new Date()
                    }
                });
            } else {
                createdDelivery = await prisma.delivery.create({
                    data: {
                        orderId: orderId,
                        courierId: order.courierId!,
                        location: restaurantLocation, // Kurye konumunu restoranın konumundan başlat
                        status: 'ACTIVE'
                    }
                });
            }
        }

        // Güncellenmiş sipariş bilgisini al
        const updatedOrder = restaurantUpdated ? await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        location: true
                    }
                }
            }
        }) : order;

        return NextResponse.json({
            message: 'Sipariş ve konum bilgileri',
            order: {
                id: order.id,
                status: order.status,
                courierId: order.courierId,
                restaurantName: order.restaurant?.name,
                userName: order.user?.name
            },
            restaurantLocation: updatedOrder?.restaurant?.location || order.restaurant?.location,
            restaurantUpdated,
            existingDelivery: delivery || null,
            createdOrUpdatedDelivery: createdDelivery || null,
            info: createdDelivery
                ? 'Test için konum bilgisi oluşturuldu/güncellendi, şimdi /order-tracking sayfasını kontrol edebilirsiniz'
                : delivery
                    ? 'Zaten konum bilgisi mevcut'
                    : 'Konum bilgisi oluşturulamadı, sipariş durumu YOLDA değil veya kurye atanmamış'
        });

    } catch (error) {
        console.error('Test API hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası', details: error }, { status: 500 });
    }
} 