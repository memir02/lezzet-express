import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/utils/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // Değişiklik burada - doğrudan params.id kullanımı
    const id = params.id;

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
            include: { menu: true },
        });

        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
        }

        return NextResponse.json(restaurant);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch restaurant" },
            { status: 500 }
        );
    }
}