import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

// Tüm null reportCount değerlerini 0 olarak güncelle
export async function POST() {
    try {
        // Yetki kontrolü
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Null olan reportCount'ları bul
        const reviewsWithNullReportCount = await prisma.review.findMany({
            where: {
                OR: [
                    { reportCount: { equals: null } as any },
                    { reportCount: { equals: undefined } as any }
                ]
            },
            select: {
                id: true
            }
        });

        console.log(`${reviewsWithNullReportCount.length} adet null reportCount bulundu.`);

        // Null reportCount'ları 0 olarak güncelle
        if (reviewsWithNullReportCount.length > 0) {
            const updatePromises = reviewsWithNullReportCount.map(review =>
                prisma.review.update({
                    where: { id: review.id },
                    data: { reportCount: 0 }
                })
            );

            await Promise.all(updatePromises);

            return NextResponse.json({
                success: true,
                message: `${reviewsWithNullReportCount.length} yorumun reportCount değeri 0 olarak güncellendi.`
            });
        } else {
            return NextResponse.json({
                success: true,
                message: 'Null reportCount değerine sahip yorum bulunmamaktadır.'
            });
        }
    } catch (error) {
        console.error('reportCount değerleri güncellenirken hata:', error);
        return NextResponse.json(
            { error: 'reportCount değerleri güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 