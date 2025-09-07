"use client";

import { notFound } from "next/navigation";
import RestaurantHeader from "../../../components/restaurant-detail/RestaurantHeader";
import Categories from "../../../components/restaurant-detail/Categories";
import MenuItem from "../../../components/restaurant-detail/MenuItem";
import Reviews from "../../../components/restaurant-detail/Reviews";
import Header2 from "@/components/Header2";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// This will be a client component that fetches data
export default function RestaurantDetailPage() {
    const params = useParams();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRestaurant() {
            try {
                const response = await fetch(`/api/restaurants/${params.id}`);
                const data = await response.json();
                if (!data) {
                    notFound();
                }
                setRestaurant(data);
            } catch (error) {
                console.error("Failed to fetch restaurant:", error);
                notFound();
            } finally {
                setLoading(false);
            }
        }

        fetchRestaurant();
    }, [params.id]);

    if (loading) return <div>Loading...</div>;
    if (!restaurant) return notFound();

    return <RestaurantDetailContent restaurant={restaurant} />;
}

function RestaurantDetailContent({ restaurant }: { restaurant: any }) {
    return (
        <>
            <Header2 />
            <main className="container mx-auto px-4 py-8">
                <RestaurantHeader restaurant={restaurant} />
                <CategorySection restaurant={restaurant} />
                <Reviews restaurantId={restaurant.id} />
            </main>
            <Footer />
        </>
    );
}

function CategorySection({ restaurant }: { restaurant: any }) {
    const categories = [...new Set(restaurant.menu.map((item: any) => item.category))] as string[];
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    const filteredMenu = selectedCategory
        ? restaurant.menu.filter((item: any) => item.category === selectedCategory)
        : restaurant.menu;

    return (
        <>
            <Categories
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenu.map((item: any) => (
                    <MenuItem
                        key={item.id}
                        item={item}
                        restaurant={{
                            id: restaurant.id,
                            name: restaurant.name
                        }}
                    />
                ))}
            </div>
        </>
    );
}