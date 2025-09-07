import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
    try {
        const { amount, items, restaurantId } = await request.json();

        // Ödeme niyeti oluştur
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Kuruş cinsinden
            currency: 'try',
            metadata: {
                restaurantId,
                items: JSON.stringify(items),
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Ödeme niyeti oluşturulurken hata:', error);
        return NextResponse.json(
            { error: 'Ödeme başlatılamadı' },
            { status: 500 }
        );
    }
} 