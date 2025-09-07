export default function RestaurantHeader({ restaurant }: { restaurant: any }) {
    return (
        <div className="relative h-64">
            <div className="absolute inset-0">
                <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0  bg-opacity-50"></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="container mx-auto">
                    <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
                    <div className="flex items-center space-x-4">
                        <span>{restaurant.cuisine} • {restaurant.priceRange}</span>
                        <span>{restaurant.rating} ({restaurant.reviewCount} Değerlendirme)</span>
                        <span>{restaurant.deliveryTime} dk</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
