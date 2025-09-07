import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
    request: Request,
    { params }: { params: { orderId: string } }
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

        const { orderId } = params;

        const order = await prisma.order.update({
            where: {
                id: orderId,
            },
            data: {
                status: 'IPTAL_EDILDI',
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Sipariş iptal edilirken hata:', error);
        return NextResponse.json(
            { error: 'Sipariş iptal edilirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 