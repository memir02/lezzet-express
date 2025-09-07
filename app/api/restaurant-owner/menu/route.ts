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

        const menuItems = await prisma.menu.findMany({
            where: {
                restaurant: {
                    ownerId: session.user.id
                }
            },
            include: {
                restaurant: true
            }
        });

        return NextResponse.json(menuItems);
    } catch (error) {
        console.error('Menü öğeleri getirilirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, price, category, restaurantId } = body;

        const menuItem = await prisma.menu.create({
            data: {
                name,
                description,
                price,
                category,
                restaurantId,
                available: true
            }
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error('Menü öğesi eklenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, description, price, category, available } = body;

        const menuItem = await prisma.menu.update({
            where: {
                id,
                restaurant: {
                    ownerId: session.user.id
                }
            },
            data: {
                name,
                description,
                price,
                category,
                available
            }
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error('Menü öğesi güncellenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const menuId = searchParams.get('id');

        if (!menuId) {
            return NextResponse.json({ error: 'Menü ID\'si gerekli' }, { status: 400 });
        }

        const menuItem = await prisma.menu.delete({
            where: {
                id: menuId,
                restaurant: {
                    ownerId: session.user.id
                }
            }
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error('Menü öğesi silinirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 