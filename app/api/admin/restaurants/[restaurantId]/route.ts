import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
    request: Request,
    { params }: { params: { restaurantId: string } }
) {
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

        const { restaurantId } = params;
        const { name, description, phone, rating, image, ownerId } = await request.json();

        const restaurant = await prisma.restaurant.update({
            where: {
                id: restaurantId,
            },
            data: {
                name,
                description,
                phone,
                rating,
                image,
                ownerId,
            },
        });

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error('Restoran güncellenirken hata:', error);
        return NextResponse.json(
            { error: 'Restoran güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { restaurantId: string } }
) {
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

        const { restaurantId } = params;

        await prisma.restaurant.delete({
            where: {
                id: restaurantId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Restoran silinirken hata:', error);
        return NextResponse.json(
            { error: 'Restoran silinirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 