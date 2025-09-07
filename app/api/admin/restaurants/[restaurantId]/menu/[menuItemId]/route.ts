import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
    request: Request,
    { params }: { params: { restaurantId: string; menuItemId: string } }
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

        const { restaurantId, menuItemId } = params;
        const { name, description, price, image, category, available } = await request.json();

        const menuItem = await prisma.menu.update({
            where: {
                id: menuItemId,
                restaurantId,
            },
            data: {
                name,
                description,
                price,
                image,
                category,
                available,
            },
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error('Menü öğesi güncellenirken hata:', error);
        return NextResponse.json(
            { error: 'Menü öğesi güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { restaurantId: string; menuItemId: string } }
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

        const { restaurantId, menuItemId } = params;

        await prisma.menu.delete({
            where: {
                id: menuItemId,
                restaurantId,
            },
        });

        return NextResponse.json({ message: 'Menü öğesi başarıyla silindi' });
    } catch (error) {
        console.error('Menü öğesi silinirken hata:', error);
        return NextResponse.json(
            { error: 'Menü öğesi silinirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 