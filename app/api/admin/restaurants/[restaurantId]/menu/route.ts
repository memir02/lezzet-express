import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
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

        const menuItems = await prisma.menu.findMany({
            where: {
                restaurantId,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(menuItems);
    } catch (error) {
        console.error('Menü öğeleri getirilirken hata:', error);
        return NextResponse.json(
            { error: 'Menü öğeleri getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

export async function POST(
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
        const { name, description, price, image, category } = await request.json();

        const menuItem = await prisma.menu.create({
            data: {
                name,
                description,
                price,
                image,
                category,
                restaurantId,
                available: true,
            },
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error('Menü öğesi oluşturulurken hata:', error);
        return NextResponse.json(
            { error: 'Menü öğesi oluşturulurken bir hata oluştu' },
            { status: 500 }
        );
    }
} 