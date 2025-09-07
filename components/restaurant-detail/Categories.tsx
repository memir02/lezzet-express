'use client';

interface CategoriesProps {
    categories: string[];
    selectedCategory: string;
    onCategorySelect: (category: string) => void;
}

export default function Categories({ categories, selectedCategory, onCategorySelect }: CategoriesProps) {
    return (
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
            <button
                onClick={() => onCategorySelect('')}
                className={`px-4 py-2 rounded-full ${selectedCategory === ''
                    ? 'bg-[#7F0005] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
            >
                Tüm Ürünler
            </button>
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onCategorySelect(category)}
                    className={`px-4 py-2 rounded-full ${selectedCategory === category
                        ? 'bg-[#7F0005] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}