import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Oturum bulunamadı' },
                { status: 401 }
            );
        }

        if (session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Bu işlem için yetkiniz yok' },
                { status: 403 }
            );
        }

        const restaurants = await prisma.restaurant.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                phone: true,
                rating: true,
                image: true,
                ownerId: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(restaurants);
    } catch (error) {
        console.error('Restoranlar getirilirken hata:', error);
        return NextResponse.json(
            { error: 'Restoranlar getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
