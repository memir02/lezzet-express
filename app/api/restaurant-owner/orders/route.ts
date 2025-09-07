import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: {
                restaurantId: {
                    in: (await prisma.restaurant.findMany({
                        where: {
                            ownerId: session.user.id
                        },
                        select: {
                            id: true
                        }
                    })).map(restaurant => restaurant.id)
                }
            },
            include: {
                user: true,
                items: {
                    include: {
                        menu: true
                    }
                }
            },
            orderBy: {
                orderedAt: 'desc'
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Siparişler getirilirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, courierId } = body;

        console.log('Gelen istek:', { orderId, courierId });

        if (!orderId || !courierId) {
            return NextResponse.json({ error: 'Sipariş ID ve Kurye ID gerekli' }, { status: 400 });
        }

        // Önce siparişin restoran sahibine ait olduğunu kontrol et
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                restaurant: {
                    ownerId: session.user.id
                }
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        console.log('Bulunan sipariş:', order);

        if (!order) {
            return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
        }

        if (order.status !== 'BEKLEMEDE') {
            return NextResponse.json({ error: 'Sadece bekleyen siparişlere kurye atanabilir' }, { status: 400 });
        }

        // Kuryenin müsait olup olmadığını kontrol et
        const courier = await prisma.courier.findFirst({
            where: {
                id: courierId,
                status: 'MUSAIT'
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        console.log('Bulunan kurye:', courier);

        if (!courier) {
            return NextResponse.json({ error: 'Kurye müsait değil' }, { status: 400 });
        }

        try {
            // Siparişi güncelle ve kuryeyi meşgul yap
            const [updatedOrder, updatedCourier] = await prisma.$transaction([
                prisma.order.update({
                    where: { id: orderId },
                    data: {
                        courierId: courierId,
                        status: 'YOLDA',
                        updatedAt: new Date()
                    },
                    select: {
                        id: true,
                        status: true,
                        courierId: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }),
                prisma.courier.update({
                    where: { id: courierId },
                    data: {
                        status: 'MESGUL',
                        updatedAt: new Date()
                    },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true
                    }
                })
            ]);

            console.log('Güncellenen sipariş ve kurye:', { updatedOrder, updatedCourier });

            return NextResponse.json({
                message: 'Kurye başarıyla atandı',
                order: updatedOrder,
                courier: updatedCourier
            });
        } catch (dbError) {
            console.error('Veritabanı işlemi sırasında hata:', dbError);
            return NextResponse.json({
                error: 'Veritabanı işlemi sırasında hata oluştu',
                details: dbError instanceof Error ? dbError.message : 'Bilinmeyen veritabanı hatası'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Sipariş güncellenirken hata:', error);
        return NextResponse.json({
            error: 'Sipariş güncellenirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('id');

        if (!orderId) {
            return NextResponse.json({ error: 'Sipariş ID\'si gerekli' }, { status: 400 });
        }

        const order = await prisma.order.update({
            where: {
                id: orderId,
                restaurantId: {
                    in: (await prisma.restaurant.findMany({
                        where: {
                            ownerId: session.user.id
                        },
                        select: {
                            id: true
                        }
                    })).map(restaurant => restaurant.id)
                }
            },
            data: {
                status: 'CANCELLED'
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Sipariş iptal edilirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 