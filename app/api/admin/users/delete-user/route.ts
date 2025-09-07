import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/utils/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(request: Request) {
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

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'Kullanıcı ID gereklidir' },
                { status: 400 }
            );
        }

        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json(deletedUser);
    } catch (error) {
        console.error('Kullanıcı silinirken hata:', error);
        return NextResponse.json(
            { error: 'Kullanıcı silinirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
