import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id
            },
            select: {
                name: true,
                email: true
            }
        });

        const restaurants = await prisma.restaurant.findMany({
            where: {
                ownerId: session.user.id
            },
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                description: true
            }
        });

        return NextResponse.json({ ...user, restaurants });
    } catch (error) {
        console.error('Kullanıcı bilgileri getirilirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, restaurantId, restaurantData } = body;

        if (restaurantId && restaurantData) {
            await prisma.restaurant.update({
                where: {
                    id: restaurantId,
                    ownerId: session.user.id
                },
                data: restaurantData
            });
        }

        if (name || email) {
            await prisma.user.update({
                where: {
                    id: session.user.id
                },
                data: {
                    name,
                    email
                }
            });
        }

        return NextResponse.json({ message: 'Ayarlar güncellendi' });
    } catch (error) {
        console.error('Ayarlar güncellenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 