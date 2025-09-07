import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/app/utils/auth'; // utils/auth.ts'ten import ettik

export async function POST(req: NextRequest) {
    const { token } = await req.json(); // Body'den token'ı alıyoruz

    if (!token) {
        return NextResponse.json({ message: 'Token gerekli' }, { status: 400 });
    }

    const verifiedToken = await verifyJwtToken(token); // Token'ı doğruluyoruz

    if (verifiedToken) {
        return NextResponse.json({ user: verifiedToken }); // Geçerli token, kullanıcı bilgilerini döndür
    } else {
        return NextResponse.json({ message: 'Geçersiz token' }, { status: 401 }); // Geçersiz token
    }
}
