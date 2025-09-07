import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        const body = await request.json();
        const { id, name, email, role } = body;

        const user = await prisma.user.update({
            where: {
                id: id,
            },
            data: {
                name,
                email,
                role,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Kullanıcı güncellenirken hata:', error);
        return NextResponse.json(
            { error: 'Kullanıcı güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
} 