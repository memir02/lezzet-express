import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email as string },
        });

        if (!user) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // Restoran sahibinin restoranlarını bul
        const restaurants = await prisma.restaurant.findMany({
            where: { ownerId: user.id },
            select: { id: true }
        });

        if (restaurants.length === 0) {
            return NextResponse.json({ message: 'Henüz restoranınız bulunmamaktadır', reviews: [] });
        }

        // Tüm restoranların ID'lerini al
        const restaurantIds = restaurants.map(restaurant => restaurant.id);

        // Bu restoranlara ait tüm yorumları getir
        const reviews = await prisma.review.findMany({
            where: {
                restaurantId: { in: restaurantIds }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                restaurant: {
                    select: {
                        name: true,
                        rating: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log('Restaurant owner reviews:', JSON.stringify(reviews.map(r => ({ id: r.id, reportCount: r.reportCount || 0 }))));

        // Eksik reportCount değerlerini 0 olarak ayarla
        const reviewsWithReportCount = reviews.map(review => ({
            ...review,
            reportCount: review.reportCount || 0
        }));

        return NextResponse.json(reviewsWithReportCount);
    } catch (error) {
        console.error('Yorumlar getirilirken hata:', error);
        return NextResponse.json(
            { error: 'Yorumlar getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('id');

        if (!reviewId) {
            return NextResponse.json({ error: 'Yorum ID\'si gerekli' }, { status: 400 });
        }

        const review = await prisma.review.delete({
            where: {
                id: reviewId,
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
            }
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error('Yorum silinirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 