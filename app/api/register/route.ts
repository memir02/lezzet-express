import bcrypt from "bcryptjs";
import prisma from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const { email, password, name, phoneNumber } = body;

    // Email ve password zorunlu
    if (!email || !password) {
        return NextResponse.json({ error: "Email ve password alanları zorunludur." }, { status: 400 });
    }

    // Kullanıcı var mı kontrolü
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return NextResponse.json({ error: "Bu email ile zaten bir kullanıcı mevcut." }, { status: 422 });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 12);

    // Name boşsa "" ata, varsa toLowerCase yap
    const finalName = name ? name : "";

    // Telefon numarası boşsa "" ata
    const finalPhoneNumber = phoneNumber || "";

    // Kullanıcı oluştur
    const user = await prisma.user.create({
        data: {
            email,
            name: finalName,
            password: hashedPassword,
            role: "customer",
            address: "",
            phoneNumber: finalPhoneNumber
        },
    });

    return NextResponse.json({
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu."
    });
}
