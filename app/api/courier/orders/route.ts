import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'courier') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: {
                courierId: session.user.id,
                status: 'YOLDA'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        phoneNumber: true,
                        address: true
                    }
                },
                restaurant: {
                    select: {
                        name: true,
                        address: true
                    }
                },
                items: {
                    include: {
                        menu: {
                            select: {
                                name: true,
                                price: true
                            }
                        }
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

        if (!session || session.user.role !== 'courier') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, action, reason } = body;

        if (!orderId || !action) {
            return NextResponse.json({ error: 'Sipariş ID ve işlem türü gerekli' }, { status: 400 });
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
            return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
        }

        if (action === 'complete') {
            // Siparişi tamamla ve kuryeyi müsait yap
            const [updatedOrder, updatedCourier] = await prisma.$transaction([
                prisma.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'TAMAMLANDI',
                        updatedAt: new Date()
                    }
                }),
                prisma.courier.update({
                    where: { id: session.user.id },
                    data: {
                        status: 'MUSAIT',
                        updatedAt: new Date()
                    }
                })
            ]);

            return NextResponse.json({
                message: 'Sipariş başarıyla tamamlandı',
                order: updatedOrder,
                courier: updatedCourier
            });
        } else if (action === 'cancel') {
            if (!reason) {
                return NextResponse.json({ error: 'İptal sebebi gerekli' }, { status: 400 });
            }

            // Siparişi iptal et ve kuryeyi müsait yap
            const [updatedOrder, updatedCourier] = await prisma.$transaction([
                prisma.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'IPTAL_EDILDI',
                        updatedAt: new Date()
                    }
                }),
                prisma.courier.update({
                    where: { id: session.user.id },
                    data: {
                        status: 'MUSAIT',
                        updatedAt: new Date()
                    }
                })
            ]);

            // İptal sebebini kaydet
            await prisma.orderCancellation.create({
                data: {
                    orderId: orderId,
                    courierId: session.user.id,
                    reason: reason,
                    createdAt: new Date()
                }
            });

            return NextResponse.json({
                message: 'Sipariş başarıyla iptal edildi',
                order: updatedOrder,
                courier: updatedCourier
            });
        } else {
            return NextResponse.json({ error: 'Geçersiz işlem türü' }, { status: 400 });
        }
    } catch (error) {
        console.error('Sipariş güncellenirken hata:', error);
        return NextResponse.json({
            error: 'Sipariş güncellenirken bir hata oluştu',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        }, { status: 500 });
    }
} 