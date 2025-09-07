import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // E-posta adresinin zaten veritabanında olup olmadığını kontrol et
        const existingUser = await prisma.user.findUnique({
            where: {
                email: body.email,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Bu e-posta adresi zaten kayıtlı" },
                { status: 400 }
            );
        }

        // Şifreyi hash'le
        const hashedPassword = await bcrypt.hash(body.password, 10);

        // Yeni kullanıcıyı veritabanına kaydet
        const newUser = await prisma.user.create({
            data: {
                email: body.email,
                password: hashedPassword,
                role: body.role || "user",
            },
        });

        return NextResponse.json(
            { success: true, message: "Kullanıcı başarıyla oluşturuldu" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Kayıt hatası:", error);
        return NextResponse.json(
            { success: false, message: "Kullanıcı başarıyla oluşturuldu" },
            { status: 500 }
        );
    }
} 