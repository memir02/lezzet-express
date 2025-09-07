
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Restoranlar ve menülerini almak için include kullanıyoruz
        const restaurants = await prisma.restaurant.findMany({
            include: {
                menu: true,  // Menü bilgilerini dahil ediyoruz
            },
        });

        return new Response(JSON.stringify(restaurants), {
            status: 200,
        });
    } catch (error) {
        console.error(error);  // Hata ayrıntılarını görmek için console.log
        return new Response('Restoranlar alınırken hata oluştu', {
            status: 500,
        });
    }
}

