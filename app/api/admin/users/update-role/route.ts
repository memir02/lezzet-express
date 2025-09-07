import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/utils/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
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

        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'Kullanıcı ID ve rol gereklidir' },
                { status: 400 }
            );
        }

        const validRoles = ['customer', 'restaurant_owner', 'admin', 'courier'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Geçersiz rol' },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Rol güncellenirken hata:', error);
        return NextResponse.json(
            { error: 'Rol güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 