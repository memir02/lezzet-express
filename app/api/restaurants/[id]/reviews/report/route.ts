import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

export async function POST(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Kullanıcı giriş yapmış mı kontrolü
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Şikayet etmek için giriş yapmalısınız' },
                { status: 401 }
            );
        }

        // Restoran ID'sini al
        const restaurantId = context.params.id;

        // Request body'den review ID'sini al
        const { reviewId } = await request.json();

        if (!reviewId) {
            return NextResponse.json(
                { error: 'Yorum ID gereklidir' },
                { status: 400 }
            );
        }

        // Yorumun var olup olmadığını ve belirtilen restorana ait olup olmadığını kontrol et
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        console.log("Bulunmuş olan review:", review);

        if (!review) {
            return NextResponse.json(
                { error: 'Yorum bulunamadı' },
                { status: 404 }
            );
        }

        if (review.restaurantId !== restaurantId) {
            return NextResponse.json(
                { error: 'Bu yorum bu restorana ait değil' },
                { status: 400 }
            );
        }

        // Mevcut reportCount değerini al
        let currentReportCount = review.reportCount || 0;

        // reportCount değerini 1 artır
        const newReportCount = currentReportCount + 1;

        console.log(`Güncellenecek reportCount: ${currentReportCount} -> ${newReportCount}`);

        // Şikayet sayısını artır (manuel olarak)
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                reportCount: newReportCount
            },
        });

        console.log("Güncellenmiş olan review:", updatedReview);

        return NextResponse.json({
            success: true,
            message: 'Yorum başarıyla şikayet edildi',
            reportCount: updatedReview.reportCount || newReportCount
        });
    } catch (error) {
        console.error('Yorum şikayet edilirken hata:', error);
        return NextResponse.json(
            { error: 'Yorum şikayet edilirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 