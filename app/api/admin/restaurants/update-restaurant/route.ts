import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { id, name, description, phone } = body;
        const prisma = new PrismaClient();
        const restaurant = await prisma.restaurant.update({
            where: {
                id: id,
            },
            data: {
                name,
                description,
                phone,
            },
        });

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error('Restoran güncellenirken hata:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 