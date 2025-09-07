import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Kullanıcı bulunamadı' },
                { status: 404 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id: params.id },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Sipariş bulunamadı' },
                { status: 404 }
            );
        }

        if (order.userId !== user.id) {
            return NextResponse.json(
                { error: 'Bu siparişi iptal etme yetkiniz yok' },
                { status: 403 }
            );
        }

        if (order.status !== 'BEKLEMEDE') {
            return NextResponse.json(
                { error: 'Sadece bekleyen siparişler iptal edilebilir' },
                { status: 400 }
            );
        }

        const updatedOrder = await prisma.order.update({
            where: { id: params.id },
            data: { status: 'IPTAL_EDILDI' },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Sipariş iptal edilirken hata:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
} 