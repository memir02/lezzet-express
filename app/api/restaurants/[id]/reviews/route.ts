import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

// Yorumları getir
export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        // params içinden id'yi güvenli bir şekilde alalım
        const id = context.params.id;

        // Geçerli bir ID kontrolü
        if (!id || typeof id !== 'string') {
            return NextResponse.json(
                { error: 'Geçerli bir restoran ID gereklidir' },
                { status: 400 }
            );
        }

        // Restorana ait yorumları getir
        const reviews = await prisma.review.findMany({
            where: {
                restaurantId: id
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log('Fetched reviews:', JSON.stringify(reviews.map(r => ({ ...r, reportCount: r.reportCount || 0 }))));

        // Yorumlar dizisini döndür
        return NextResponse.json({ reviews });
    } catch (error) {
        console.error('Yorumlar alınırken hata:', error);
        return NextResponse.json(
            { error: 'Yorumlar alınırken bir hata oluştu', reviews: [] },
            { status: 500 }
        );
    }
}

// Yeni yorum ekle
export async function POST(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Yorum yapmak için giriş yapmalısınız' },
                { status: 401 }
            );
        }

        // params içinden id'yi güvenli bir şekilde alalım
        const id = context.params.id;

        // Geçerli bir ID kontrolü
        if (!id || typeof id !== 'string') {
            return NextResponse.json(
                { error: 'Geçerli bir restoran ID gereklidir' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { rating, comment } = body;

        // Gerekli alanları kontrol et
        if (!rating || !comment) {
            return NextResponse.json(
                { error: 'Puanlama ve yorum içeriği zorunludur' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Puanlama 1-5 arasında olmalıdır' },
                { status: 400 }
            );
        }

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { email: session.user.email as string },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Kullanıcı bulunamadı' },
                { status: 404 }
            );
        }

        // Yorum oluştur
        const review = await prisma.review.create({
            data: {
                rating,
                comment,
                userId: user.id,
                restaurantId: id,
                reportCount: 0,
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // Restoranın ortalama puanını güncelle
        const allReviews = await prisma.review.findMany({
            where: { restaurantId: id },
            select: { rating: true },
        });

        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / allReviews.length;

        await prisma.restaurant.update({
            where: { id },
            data: { rating: averageRating },
        });

        return NextResponse.json({
            success: true,
            message: 'Yorumunuz başarıyla eklendi',
            review
        });
    } catch (error) {
        console.error('Yorum eklenirken hata:', error);
        return NextResponse.json(
            { error: 'Yorum eklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 