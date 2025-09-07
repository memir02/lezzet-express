import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/utils/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        console.log('Kullanıcı ID:', session.user.id);

        const restaurants = await prisma.restaurant.findMany({
            where: {
                ownerId: session.user.id
            },
            select: {
                id: true,
                name: true,
                description: true,
                address: true,
                phone: true,
                location: true,
                categories: true,
                rating: true,
                image: true,
                createdAt: true,
                menu: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        category: true,
                        available: true
                    }
                },
                Order: {
                    select: {
                        id: true,
                        status: true,
                        orderedAt: true,
                        totalPrice: true,
                        user: {
                            select: {
                                name: true
                            }
                        },
                        items: {
                            select: {
                                id: true,
                                quantity: true,
                                menu: {
                                    select: {
                                        name: true,
                                        price: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        orderedAt: 'desc'
                    }
                },
                Review: {
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        const updatedRestaurants = await Promise.all(
            restaurants.map(async (restaurant) => {
                if (!restaurant.createdAt) {
                    const updatedRestaurant = await prisma.restaurant.update({
                        where: { id: restaurant.id },
                        data: { createdAt: new Date() },
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            address: true,
                            phone: true,
                            location: true,
                            categories: true,
                            rating: true,
                            image: true,
                            createdAt: true,
                            menu: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                    price: true,
                                    category: true,
                                    available: true
                                }
                            },
                            Order: {
                                select: {
                                    id: true,
                                    status: true,
                                    orderedAt: true,
                                    totalPrice: true,
                                    user: {
                                        select: {
                                            name: true
                                        }
                                    },
                                    items: {
                                        select: {
                                            id: true,
                                            quantity: true,
                                            menu: {
                                                select: {
                                                    name: true,
                                                    price: true
                                                }
                                            }
                                        }
                                    }
                                },
                                orderBy: {
                                    orderedAt: 'desc'
                                }
                            },
                            Review: {
                                select: {
                                    id: true,
                                    rating: true,
                                    comment: true,
                                    createdAt: true,
                                    user: {
                                        select: {
                                            name: true
                                        }
                                    }
                                },
                                orderBy: {
                                    createdAt: 'desc'
                                }
                            }
                        }
                    });
                    return updatedRestaurant;
                }
                return restaurant;
            })
        );

        const formattedRestaurants = updatedRestaurants.map(restaurant => ({
            ...restaurant,
            reviews: restaurant.Review || [],
            Review: undefined
        }));

        console.log('Bulunan restoran sayısı:', formattedRestaurants.length);

        return NextResponse.json(formattedRestaurants);
    } catch (error) {
        console.error('Restoranlar getirilirken detaylı hata:', {
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
            stack: error instanceof Error ? error.stack : undefined
        });

        return NextResponse.json(
            {
                error: 'Restoranlar getirilirken bir hata oluştu',
                details: error instanceof Error ? error.message : 'Bilinmeyen hata'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, address, phone } = body;

        const restaurant = await prisma.restaurant.create({
            data: {
                name,
                description,
                address,
                phone,
                ownerId: session.user.id,
                rating: 0,
                image: null,
                location: {
                    lat: 0,
                    lng: 0
                }
            }
        });

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error('Restoran eklenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'restaurant_owner') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, description, address, phone } = body;

        const restaurant = await prisma.restaurant.update({
            where: {
                id,
                ownerId: session.user.id
            },
            data: {
                name,
                description,
                address,
                phone
            }
        });

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error('Restoran güncellenirken hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
} 