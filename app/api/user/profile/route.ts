import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
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
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                address: true
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Kullanıcı bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Profil bilgileri alınırken hata:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email, address, phoneNumber } = body;

        // E-posta değişikliği kontrolü
        if (email && email !== session.user.email) {
            return NextResponse.json(
                { error: 'E-posta adresi değiştirilemez' },
                { status: 400 }
            );
        }

        // Güncellenecek alanları belirle
        const updateData: any = {};
        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                address: true
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Profil başarıyla güncellendi',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profil güncellenirken hata:', error);
        return NextResponse.json(
            { error: 'Bir hata oluştu' },
            { status: 500 }
        );
    }
} 