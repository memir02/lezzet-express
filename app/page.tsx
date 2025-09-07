import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />

      <main className="bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 bg-white my-4">
            {/* Sol Taraf - Yazı */}
            <div className="lg:w-1/3 py-16 lg:py-32">
              <div className="flex justify-center">
                <h1 className="text-5xl font-bold font-teko mb-6">Lezzetin Yeni Adresi</h1>
              </div>
              <div className="text-center">
                <p className="text-2xl text-gray-600 mb-8">
                  En sevdiğiniz restoranlardan birbirinden lezzetli yemekler, tek tıkla kapınızda! Hızlı teslimat ve uygun fiyatlarla, damak tadınıza uygun tüm lezzetler LezzetExpress'te.
                </p>
              </div>
              <div className="flex justify-center">
                <Link href="/konum" className="bg-[#7F0005] text-white px-8 py-3 rounded-lg text-xl hover:bg-[#940008]">
                  Sipariş Ver
                </Link>
              </div>
            </div>

            {/* Sağ Taraf - Fotoğraflar Grid */}
            <div className="lg:w-2/3">
              <div className="grid grid-cols-2 gap-4">
                {menuItems.map((item, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-lg h-[350px]">
                    <Image src={item.imgSrc} alt={item.alt} width={500} height={500} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 backdrop-blur-xs bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <h3 className="text-white text-3xl font-bold transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

    </>

  );
}

const menuItems = [
  { imgSrc: 'https://i.pinimg.com/736x/05/58/cc/0558cc287589fb96f6fb29c89a5a9bca.jpg', alt: 'Hamburger', title: 'Hamburger' },
  { imgSrc: 'https://i.pinimg.com/736x/0e/f2/41/0ef241ab08296ceb684bd91a5510b623.jpg', alt: 'Pizza', title: 'Pizza' },
  { imgSrc: 'https://images.deliveryhero.io/image/fd-tr/LH/kg4w-listing.jpg', alt: 'Döner', title: 'Döner' },
  { imgSrc: 'https://i.pinimg.com/736x/5f/2e/f1/5f2ef11ce5d249a4aab16067af7a5b72.jpg', alt: 'Tatlı', title: 'Tatlı' }
];

