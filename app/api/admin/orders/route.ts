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

        const orders = await prisma.order.findMany({
            include: {
                user: true,
                items: true
            },
            orderBy: {
                orderedAt: 'desc'
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Siparişler getirilirken hata:', error);
        return NextResponse.json(
            { error: 'Siparişler getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 