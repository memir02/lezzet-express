import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Tüm yorumları restoranlar ve kullanıcılarla birlikte getir
        const reviews = await prisma.review.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        rating: true
                    }
                }
            },
            orderBy: [
                {
                    reportCount: 'desc'
                },
                {
                    createdAt: 'desc'
                }
            ]
        });

        console.log('Admin reviews:', JSON.stringify(reviews.map(r => ({ id: r.id, reportCount: r.reportCount || 0 }))));

        // Eksik reportCount değerlerini 0 olarak ayarla
        const reviewsWithReportCount = reviews.map(review => ({
            ...review,
            reportCount: review.reportCount || 0
        }));

        return NextResponse.json(reviewsWithReportCount);
    } catch (error) {
        console.error('Yorumlar getirilirken hata:', error);
        return NextResponse.json(
            {
                error: 'Yorumlar getirilirken bir hata oluştu',
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get('id');

        if (!reviewId) {
            return NextResponse.json({ error: 'Yorum ID\'si gerekli' }, { status: 400 });
        }

        // Yorumu sil
        await prisma.review.delete({
            where: { id: reviewId }
        });

        return NextResponse.json({ success: true, message: 'Yorum başarıyla silindi' });
    } catch (error) {
        console.error('Yorum silinirken hata:', error);
        return NextResponse.json(
            {
                error: 'Yorum silinirken bir hata oluştu',
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            },
            { status: 500 }
        );
    }
} 