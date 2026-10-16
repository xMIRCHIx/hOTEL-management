"use client";

import { useState, useEffect } from "react";
import NoiricScroll from "./components/NoiricScroll";
import Image from "next/image";
import { motion, useScroll } from "framer-motion";
import {
  Coffee,
  Pizza,
  Wifi,
  Music,
  ShieldCheck,
  Users,
  Smartphone,
  Coins,
  BookOpen,
  MapPin,
  Clock,
  ArrowRight,
  X,
  Check,
  Search,
  ShoppingBag,
  Star,
  Heart,
  ChevronRight,
  Flame,
  Utensils
} from "lucide-react";


// Custom Instagram SVG Icon for compatibility
const Instagram = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// Menu Data
const MENU_ITEMS = [
  {
    id: "p1",
    name: "Truffle Mushroom Wood-Fired Pizza",
    category: "Pizzas",
    description: "Creamy truffle white sauce, wild forest mushrooms, fresh mozzarella, truffle oil glaze, and fresh baby arugula.",
    price: 349,
    tag: "Signature",
    rating: 4.9,
  },
  {
    id: "p2",
    name: "Noiric Loaded Gourmet Pizza",
    category: "Pizzas",
    description: "Rich San Marzano tomato sauce, double mozzarella, smoked pepperoni, grilled herb chicken, bell peppers, Kalamata olives, and fresh basil.",
    price: 399,
    tag: "Best Seller",
    rating: 5.0,
  },
  {
    id: "b1",
    name: "Smoked Avocado & Cheese Burger",
    category: "Burgers",
    description: "Toasted brioche bun, flame-grilled cottage cheese steak, crushed avocado mash, aged cheddar, caramelized onions, and signature house sauce.",
    price: 249,
    tag: "Premium",
    rating: 4.8,
  },
  {
    id: "b2",
    name: "Espresso-Rubbed BBQ Chicken Burger",
    category: "Burgers",
    description: "Crispy chicken breast rubbed in house espresso spice blend, melted provolone, crispy onion rings, and a rich espresso-infused smoky BBQ sauce.",
    price: 289,
    tag: "New",
    rating: 4.9,
  },
  {
    id: "f1",
    name: "Parmesan Truffle Fries",
    category: "Fries",
    description: "Thick-cut golden skin-on potatoes tossed in black truffle oil, fresh rosemary, and generously topped with aged shaved parmesan cheese.",
    price: 179,
    tag: "Popular",
    rating: 4.7,
  },
  {
    id: "f2",
    name: "Spicy Peri-Peri Dust Fries",
    category: "Fries",
    description: "Crispy crinkle-cut fries dusted with our fiery home-ground peri-peri spice mix, served with creamy roasted garlic aioli dip.",
    price: 149,
    tag: "Cozy Bite",
    rating: 4.6,
  },
  {
    id: "dr1",
    name: "Noiric White Velvet Frappe",
    category: "Frappes",
    description: "Double shot of premium espresso blended with rich vanilla bean gelato, white chocolate chips, milk, and topped with cloud-like whipped cream.",
    price: 219,
    tag: "Signature",
    rating: 5.0,
  },
  {
    id: "dr2",
    name: "Salted Caramel Cold Brew Frappe",
    category: "Frappes",
    description: "Slow-steeped cold brew concentrate blended with sea salt caramel fudge, ice, milk, finished with whipped cream and butterscotch crumbs.",
    price: 239,
    tag: "Chef Special",
    rating: 4.9,
  }
];

export default function Home() {
  const { scrollY } = useScroll();
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      // The hero section spans 400vh, so we transition when we scroll past 3.2 times the viewport height
      const heroThreshold = window.innerHeight * 3.2;
      setIsScrolledPastHero(latest > heroThreshold);
    });
  }, [scrollY]);

  // States for Modals and Filters
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [bookingDetails, setBookingDetails] = useState({
    name: "",
    phone: "",
    guests: "2",
    date: "",
    time: "",
  });
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Phone QR simulator states
  const [scanStep, setScanStep] = useState<"idle" | "scanning" | "ordered">("idle");
  const [scanCart, setScanCart] = useState<string[]>([]);

  // Helpers
  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBookingDetails({ ...bookingDetails, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus("submitting");
    setTimeout(() => {
      setBookingStatus("success");
    }, 1200);
  };

  const resetBookingForm = () => {
    setBookingStatus("idle");
    setBookingDetails({
      name: "",
      phone: "",
      guests: "2",
      date: "",
      time: "",
    });
    setIsBookModalOpen(false);
  };

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const simulateQRScan = () => {
    setScanStep("scanning");
    setTimeout(() => {
      setScanStep("ordered");
      setScanCart(["Noiric Loaded Gourmet Pizza", "Noiric White Velvet Frappe"]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F3E8E0] text-coffee-950 font-sans selection:bg-coffee-300 selection:text-coffee-950">
      
      {/* HEADER / NAVBAR */}
      <header className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
        isScrolledPastHero 
          ? "bg-[#F3E8E0] border-b border-coffee-200/30 shadow-xs" 
          : "bg-transparent border-b border-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isScrolledPastHero ? "bg-[#2B2523] text-coffee-300" : "bg-[#EADACF] text-coffee-950"
            } group-hover:scale-105`}>
              <Coffee className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className={`font-heading font-bold text-xl tracking-wider transition-colors duration-300 ${
                isScrolledPastHero ? "text-[#2B2523]" : "text-white"
              }`}>NOIRIC</span>
              <span className={`font-heading text-xs block tracking-widest uppercase -mt-1 transition-colors duration-300 ${
                isScrolledPastHero ? "text-coffee-600" : "text-[#EADACF]"
              }`}>CAFE</span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#experience" className={`text-sm font-medium transition-colors duration-300 ${
              isScrolledPastHero ? "text-coffee-700 hover:text-[#2B2523]" : "text-[#EADACF]/85 hover:text-white"
            }`}>Experience</a>
            <a href="#menu" className={`text-sm font-medium transition-colors duration-300 ${
              isScrolledPastHero ? "text-coffee-700 hover:text-[#2B2523]" : "text-[#EADACF]/85 hover:text-white"
            }`}>Digital Menu</a>
            <a href="#tech" className={`text-sm font-medium transition-colors duration-300 ${
              isScrolledPastHero ? "text-coffee-700 hover:text-[#2B2523]" : "text-[#EADACF]/85 hover:text-white"
            }`}>Smart Features</a>
            <a href="#location" className={`text-sm font-medium transition-colors duration-300 ${
              isScrolledPastHero ? "text-coffee-700 hover:text-[#2B2523]" : "text-[#EADACF]/85 hover:text-white"
            }`}>Location</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <a href="/order?scan=1" className={`text-xs font-semibold ${isScrolledPastHero ? 'text-coffee-900' : 'text-white'}`}>Order now</a>
            {/* Instagram Link */}
            <a
              href="https://instagram.com/noiric.cafe"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-full transition-colors hidden sm:inline-flex ${
                isScrolledPastHero 
                  ? "text-coffee-700 hover:text-[#2B2523] hover:bg-[#FAF3EC]" 
                  : "text-[#EADACF] hover:text-white hover:bg-white/5"
              }`}
              title="Follow us on Instagram"
              id="header-instagram-link"
            >
              <Instagram className="w-5 h-5" />
            </a>

            {/* CTA Button */}
            <button
              onClick={() => setIsBookModalOpen(true)}
              className={`text-xs font-semibold uppercase tracking-widest px-5 py-3 rounded-full transition-all hover:shadow-lg active:scale-95 ${
                isScrolledPastHero 
                  ? "bg-[#2B2523] hover:bg-[#3D3532] text-[#EADACF] shadow-coffee-950/10" 
                  : "bg-[#EADACF] hover:bg-white text-coffee-950 shadow-black/20"
              }`}
              id="nav-book-btn"
            >
              Book a Table
            </button>
          </div>
        </div>
      </header>


      {/* HERO SECTION */}
      <NoiricScroll />

      {/* EXPLORE OUR FAVORITES SECTION */}
      <section className="py-24 bg-[#F3E8E0] relative z-10">
        {/* Tilted Coffee Divider Line */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-20 -mt-[99px] h-[100px] pointer-events-none">
          <svg 
            className="relative block w-full h-full" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            {/* Cream filled area under the line to align with section background */}
            <path 
              d="M0,105 L1200,55 L1200,120 L0,120 Z" 
              fill="#F3E8E0" 
            />
            {/* Tilted border line in caramel/coffee color */}
            <line 
              x1="0" 
              y1="105" 
              x2="1200" 
              y2="55" 
              stroke="#A67C52" 
              strokeWidth="18" 
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-coffee-800 uppercase">Explore Our Favorites</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-coffee-950 mt-2">
              Crafted For Coffee & Food Lovers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Premium Coffee */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-[0_12px_40px_rgba(43,37,35,0.12)] hover:shadow-[0_20px_50px_rgba(43,37,35,0.2)] transition-all duration-300"
            >
              <Image
                src="https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=600&q=80"
                alt="Premium Coffee"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B2523]/80 via-[#2B2523]/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-serif font-bold">Premium Coffee</h3>
                <p className="text-xs text-coffee-250 mt-1">Single-origin beans & artisan brews</p>
              </div>
            </motion.div>

            {/* Wood-Fired Pizza */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-[0_12px_40px_rgba(43,37,35,0.12)] hover:shadow-[0_20px_50px_rgba(43,37,35,0.2)] transition-all duration-300"
            >
              <Image
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
                alt="Wood-Fired Pizza"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B2523]/80 via-[#2B2523]/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-serif font-bold">Wood-Fired Pizza</h3>
                <p className="text-xs text-coffee-250 mt-1">Crusty edge, fresh premium toppings</p>
              </div>
            </motion.div>

            {/* Signature Shakes */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-[0_12px_40px_rgba(43,37,35,0.12)] hover:shadow-[0_20px_50px_rgba(43,37,35,0.2)] transition-all duration-300"
            >
              <Image
                src="https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80"
                alt="Signature Shakes"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B2523]/80 via-[#2B2523]/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-serif font-bold">Signature Shakes</h3>
                <p className="text-xs text-coffee-250 mt-1">Whipped cream, rich chocolate blends</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* THE NOIRIC EXPERIENCE (Features Grid) */}
      <section id="experience" className="py-28 bg-[#F3E8E0] border-y border-coffee-200/20 relative overflow-hidden">
        {/* Soft background ambient glows */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#E8D8CE]/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F5EBE4]/50 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold tracking-widest text-coffee-600 uppercase">Cozy & High-Tech</span>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#2B2523] mt-3 mb-4 leading-tight">
              The Noiric Experience
            </h2>
            <p className="text-[#4A3B32] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Every detail at Noiric is meticulously curated to guarantee an unforgettable visit. From our atmosphere to our high-tech conveniences, experience the future of cafe culture.
            </p>
          </div>

          {/* Asymmetrical Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: Modern Ambience (lg:col-span-2) */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#F5EBE4] paper-noise p-10 rounded-[2.5rem] border border-[#2B2523]/5 shadow-[0_20px_50px_rgba(62,39,35,0.07)] hover:shadow-[0_30px_60px_rgba(62,39,35,0.12)] transition-shadow duration-300 group relative overflow-hidden lg:col-span-2 flex flex-col justify-between min-h-[280px]"
            >
              <div className="absolute -right-4 -bottom-6 font-serif text-[12rem] font-bold text-[#4A3B32]/7 pointer-events-none select-none leading-none z-0">
                01
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-[#F3E8E0] flex items-center justify-center text-coffee-700 mb-8 shadow-inner group-hover:scale-110 group-hover:bg-[#2B2523] group-hover:text-coffee-305 transition-all duration-305">
                  <Utensils className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-coffee-950 mb-3">Modern Ambience</h3>
                <p className="text-[#4A3B32] text-sm leading-relaxed max-w-xl">
                  Meticulously designed with minimalist aesthetics, earthy tones, and comfortable seating arrangements, perfect for work or relaxation.
                </p>
              </div>
            </motion.div>

            {/* Feature 2: Free Wi-Fi (lg:col-span-1) */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#E8D8CE]/90 paper-noise p-10 rounded-[2.5rem] border border-[#2B2523]/5 shadow-[0_20px_50px_rgba(62,39,35,0.07)] hover:shadow-[0_30px_60px_rgba(62,39,35,0.12)] transition-shadow duration-300 group relative overflow-hidden lg:col-span-1 flex flex-col justify-between min-h-[280px]"
            >
              <div className="absolute -right-4 -bottom-6 font-serif text-[12rem] font-bold text-[#4A3B32]/7 pointer-events-none select-none leading-none z-0">
                02
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-[#F3E8E0] flex items-center justify-center text-coffee-700 mb-8 shadow-inner group-hover:scale-110 group-hover:bg-[#2B2523] group-hover:text-coffee-305 transition-all duration-305">
                  <Wifi className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-coffee-950 mb-3">High-Speed Wi-Fi</h3>
                <p className="text-[#4A3B32] text-sm leading-relaxed">
                  Stay connected with complimentary high-speed fiber internet. Seamlessly join virtual meetings, study, or stream with zero interruptions.
                </p>
              </div>
            </motion.div>

            {/* Feature 3: Soothing Music (lg:col-span-1) */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#E8D8CE]/90 paper-noise p-10 rounded-[2.5rem] border border-[#2B2523]/5 shadow-[0_20px_50px_rgba(62,39,35,0.07)] hover:shadow-[0_30px_60px_rgba(62,39,35,0.12)] transition-shadow duration-300 group relative overflow-hidden lg:col-span-1 flex flex-col justify-between min-h-[280px]"
            >
              <div className="absolute -right-4 -bottom-6 font-serif text-[12rem] font-bold text-[#4A3B32]/7 pointer-events-none select-none leading-none z-0">
                03
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-[#F3E8E0] flex items-center justify-center text-coffee-700 mb-8 shadow-inner group-hover:scale-110 group-hover:bg-[#2B2523] group-hover:text-coffee-305 transition-all duration-305">
                  <Music className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-coffee-950 mb-3">Soothing Acoustic Playlists</h3>
                <p className="text-[#4A3B32] text-sm leading-relaxed">
                  Carefully curated chill-acoustic, lofi, and jazz backing tracks soft enough for conversation, yet delightful enough to tune into.
                </p>
              </div>
            </motion.div>

            {/* Feature 4: Instagram Worthy (lg:col-span-2) */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#F5EBE4] paper-noise p-10 rounded-[2.5rem] border border-[#2B2523]/5 shadow-[0_20px_50px_rgba(62,39,35,0.07)] hover:shadow-[0_30px_60px_rgba(62,39,35,0.12)] transition-shadow duration-300 group relative overflow-hidden lg:col-span-2 flex flex-col justify-between min-h-[280px]"
            >
              <div className="absolute -right-4 -bottom-6 font-serif text-[12rem] font-bold text-[#4A3B32]/7 pointer-events-none select-none leading-none z-0">
                04
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-[#F3E8E0] flex items-center justify-center text-coffee-700 mb-8 shadow-inner group-hover:scale-110 group-hover:bg-[#2B2523] group-hover:text-coffee-305 transition-all duration-305">
                  <Instagram className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-coffee-950 mb-3">Instagram Worthy</h3>
                <p className="text-[#4A3B32] text-sm leading-relaxed max-w-xl">
                  Fitted with warm architectural lighting, designer corners, neon text backdrops, and stunning food styling engineered for your social feed.
                </p>
              </div>
            </motion.div>

            {/* Feature 5: Fresh & Hygienic (lg:col-span-2) */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#F5EBE4] paper-noise p-10 rounded-[2.5rem] border border-[#2B2523]/5 shadow-[0_20px_50px_rgba(62,39,35,0.07)] hover:shadow-[0_30px_60px_rgba(62,39,35,0.12)] transition-shadow duration-300 group relative overflow-hidden lg:col-span-2 flex flex-col justify-between min-h-[280px]"
            >
              <div className="absolute -right-4 -bottom-6 font-serif text-[12rem] font-bold text-[#4A3B32]/7 pointer-events-none select-none leading-none z-0">
                05
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-[#F3E8E0] flex items-center justify-center text-coffee-700 mb-8 shadow-inner group-hover:scale-110 group-hover:bg-[#2B2523] group-hover:text-coffee-305 transition-all duration-305">
                  <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-coffee-950 mb-3">Fresh & Hygienic</h3>
                <p className="text-[#4A3B32] text-sm leading-relaxed max-w-xl">
                  A 100% open-view hygienic kitchen. All food is crafted from scratch using sourced premium ingredients and strict daily sanitation standards.
                </p>
              </div>
            </motion.div>

            {/* Feature 6: Perfect for Hangouts (lg:col-span-1) */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#E8D8CE]/90 paper-noise p-10 rounded-[2.5rem] border border-[#2B2523]/5 shadow-[0_20px_50px_rgba(62,39,35,0.07)] hover:shadow-[0_30px_60px_rgba(62,39,35,0.12)] transition-shadow duration-300 group relative overflow-hidden lg:col-span-1 flex flex-col justify-between min-h-[280px]"
            >
              <div className="absolute -right-4 -bottom-6 font-serif text-[12rem] font-bold text-[#4A3B32]/7 pointer-events-none select-none leading-none z-0">
                06
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-[#F3E8E0] flex items-center justify-center text-coffee-700 mb-8 shadow-inner group-hover:scale-110 group-hover:bg-[#2B2523] group-hover:text-coffee-305 transition-all duration-305">
                  <Users className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-coffee-950 mb-3">Perfect for Hangouts</h3>
                <p className="text-[#4A3B32] text-sm leading-relaxed">
                  Featuring community tables, board games, and cozy group lounges. Designed to bring friends, families, and creators together.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* MENU HIGHLIGHTS SECTION */}
      <section id="menu" className="py-24 bg-[#F3E8E0]">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section Heading & Interactive Filter */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <span className="text-xs font-bold tracking-widest text-coffee-600 uppercase">Explore Flavors</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2B2523] mt-2 mb-2">
                Signature Menu Highlights
              </h2>
              <p className="text-coffee-700 text-sm max-w-lg">
                Fresh gourmet toppings, home-brewed espresso formulas, and freshly assembled snacks. Check out a selection of our fan favorites.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search signature dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF3EC] border border-coffee-200/50 text-coffee-950 placeholder-coffee-450 rounded-full px-5 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300 focus:border-transparent transition-all"
                id="menu-search-input"
              />
              <Search className="w-4 h-4 text-coffee-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-coffee-400 hover:text-coffee-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Categories */}
          <div className="flex flex-wrap items-center gap-2.5 mb-10 pb-4 border-b border-coffee-200/20">
            {["All", "Pizzas", "Burgers", "Fries", "Frappes"].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-[#2B2523] text-white shadow-md shadow-coffee-950/15"
                    : "bg-[#FAF3EC] hover:bg-[#FAF3EC]/85 text-coffee-700 hover:text-coffee-950"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Cards Grid */}
          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-20 bg-[#FAF3EC]/60 rounded-[2rem] border border-dashed border-coffee-300/40">
              <Coffee className="w-8 h-8 text-coffee-400 mx-auto mb-3" />
              <p className="text-coffee-600 font-semibold text-sm">No dishes match your search criteria.</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="mt-2 text-xs font-bold text-coffee-500 hover:text-coffee-800 underline uppercase tracking-widest"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col bg-[#FAF3EC] hover:bg-[#FAF6F0] rounded-[2rem] p-6 border border-coffee-200/30 hover:border-coffee-300/60 shadow-md shadow-coffee-200/5 hover:shadow-xl hover:shadow-[#b48c6e]/15 transition-all duration-300 group"
                >
                  {/* Badge & Rating Row */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-[#FAF6F0] text-coffee-900 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border border-coffee-200/20">
                      {item.tag}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-[#FAF6F0] px-2 py-1 rounded-md shadow-xs border border-coffee-200/10">
                      <Star className="w-3.5 h-3.5 fill-amber-500 stroke-[1.5]" />
                      <span>{item.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Item Description */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-coffee-950 mb-2 group-hover:text-coffee-700 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-coffee-600 text-xs leading-relaxed line-clamp-3 mb-6">
                        {item.description}
                      </p>
                    </div>

                    {/* Price and Order Badge */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-coffee-200/30">
                      <div>
                        <span className="text-[10px] text-coffee-400 block font-semibold uppercase tracking-wider">Price</span>
                        <span className="font-serif font-extrabold text-lg text-coffee-950">₹{item.price}</span>
                      </div>
                      <a href="/order?scan=1" className="bg-[#2B2523] hover:bg-[#3D3532] text-[#EADACF] px-4 py-3 min-h-11 inline-flex items-center rounded-full text-[10px] font-bold tracking-wider uppercase select-none shadow-xs border border-[#EADACF]/15">
                        Order in Cafe
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive digital menu prompt */}
          <div className="mt-16 text-center">
            <div className="inline-block p-6 rounded-[2rem] bg-[#FAF3EC] border border-coffee-200/40 max-w-2xl shadow-sm">
              <p className="text-xs font-semibold text-coffee-800 flex items-center justify-center gap-1.5 mb-2">
                <Smartphone className="w-4 h-4" /> Full Digital Menu Available
              </p>
              <p className="text-xs text-coffee-600">
                To view full ingredients, customize options (Extra Cheese, Oat Milk, etc.), and pay directly via UPI, scan our smart NFC tags placed on any Noiric cafe table.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SMART TECH INTEGRATION (Agency Upsell) */}
      <section id="tech" className="py-24 bg-[#F3E8E0] border-t border-coffee-200/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-[#FAF3EC]/40 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Tech explanation (Upsell) */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="text-xs font-bold tracking-widest text-coffee-600 uppercase">Powered by Custom Software</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2B2523] mt-2 mb-6">
                Next-Gen Smart Dining
              </h2>
              <p className="text-coffee-700 text-sm sm:text-base leading-relaxed mb-8">
                Noiric Cafe isn&apos;t just about food; it&apos;s a fully integrated tech experience. Engineered by our agency partner, <strong className="text-coffee-950 font-semibold">Kryto Studio</strong>, we host high-speed automated services that make ordering, rewards, and networking completely seamless.
              </p>

              {/* Smart feature list */}
              <div className="space-y-6 w-full">
                
                {/* Feature 1 */}
                <div className="flex gap-4 p-4 rounded-2xl hover:bg-[#FAF3EC] hover:shadow-md hover:shadow-coffee-200/5 transition-all duration-300 border border-transparent hover:border-coffee-200/30">
                  <div className="w-10 h-10 rounded-lg bg-[#2B2523] flex items-center justify-center text-coffee-305 shrink-0">
                    <Smartphone className="w-5 h-5 text-coffee-300" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-sm text-coffee-950">Hover-Ordering (Scan to Order)</h4>
                    <p className="text-xs text-coffee-600 mt-1 leading-relaxed">
                      Skip lines completely. Simply scan the custom dynamic QR code or hover your phone near the table NFC tag. Our web portal will instantly pull up the menu, register your order, and beam it to the chef.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex gap-4 p-4 rounded-2xl hover:bg-[#FAF3EC] hover:shadow-md hover:shadow-coffee-200/5 transition-all duration-300 border border-transparent hover:border-coffee-200/30">
                  <div className="w-10 h-10 rounded-lg bg-[#2B2523] flex items-center justify-center text-coffee-305 shrink-0">
                    <Coins className="w-5 h-5 text-coffee-300" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-sm text-coffee-950">Noiric Loyalty Tokens</h4>
                    <p className="text-xs text-coffee-600 mt-1 leading-relaxed">
                      Every transaction earns you digital Noiric Tokens directly inside your phone. Redeem tokens for free beverages, artisan cookies, or exclusive weekend discounts. No physical card required.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex gap-4 p-4 rounded-2xl hover:bg-[#FAF3EC] hover:shadow-md hover:shadow-coffee-200/5 transition-all duration-300 border border-transparent hover:border-coffee-200/30">
                  <div className="w-10 h-10 rounded-lg bg-[#2B2523] flex items-center justify-center text-coffee-305 shrink-0">
                    <BookOpen className="w-5 h-5 text-coffee-300" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-sm text-coffee-950">Library Cross-Platform Perks</h4>
                    <p className="text-coffee-600 text-xs mt-1 leading-relaxed">
                      Are you a student or freelance reader? Sync your digital credentials to enjoy cross-platform credits and discounts across partnered local study spaces and digital platforms.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Smart Simulator Mockup */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="w-[300px] h-[580px] bg-[#2B2523] rounded-[40px] p-3 shadow-2xl relative border-4 border-coffee-800/80">
                {/* Speaker line */}
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-[#231E1C] rounded-full flex items-center justify-center">
                  <div className="w-8 h-1 bg-coffee-900 rounded-full"></div>
                </div>
                
                {/* Screen content */}
                <div className="w-full h-full bg-[#FAF3EC] rounded-[32px] overflow-hidden flex flex-col justify-between border border-coffee-800/40 relative">
                  
                  {/* Phone Header */}
                  <div className="pt-6 px-4 pb-2 bg-[#FAF3EC] border-b border-coffee-200/20 flex justify-between items-center text-[10px] font-bold text-coffee-600">
                    <span>9:41 AM</span>
                    <span className="text-coffee-900 tracking-wider">NOIRIC SMART WEB</span>
                    <span>100%</span>
                  </div>

                  {/* Simulator Main Display */}
                  <div className="flex-1 p-4 flex flex-col justify-center items-center text-center">
                    {scanStep === "idle" && (
                      <div className="animate-fade-in flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-[#F3E8E0] flex items-center justify-center text-coffee-700 mb-4 animate-bounce">
                          <Smartphone className="w-8 h-8" />
                        </div>
                        <h5 className="font-serif font-bold text-sm text-[#2B2523] mb-1">Test Table Scanning</h5>
                        <p className="text-[11px] text-coffee-600 mb-6 max-w-[180px] leading-relaxed">
                          Simulate what happens when you scan a table QR code in Noiric Cafe!
                        </p>
                        <button
                          onClick={simulateQRScan}
                          className="bg-[#2B2523] hover:bg-[#3D3532] text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-full transition-all active:scale-95 shadow-md border border-white/5"
                        >
                          Scan QR Code
                        </button>
                      </div>
                    )}

                    {scanStep === "scanning" && (
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        {/* Scanner animation box */}
                        <div className="relative w-36 h-36 border-2 border-coffee-300/40 rounded-xl overflow-hidden flex items-center justify-center bg-[#F3E8E0]/40">
                          {/* Laser line */}
                          <div className="absolute left-0 w-full h-0.5 bg-coffee-500 shadow-md animate-bounce top-1/2"></div>
                          <span className="text-[9px] font-bold uppercase text-coffee-600 tracking-wider">Detecting NFC/QR...</span>
                        </div>
                        <p className="text-[11px] font-bold text-[#2B2523] mt-4 animate-pulse">Connecting Table #4...</p>
                      </div>
                    )}

                    {scanStep === "ordered" && (
                      <div className="animate-fade-in flex flex-col items-start text-left w-full h-full justify-between py-2">
                        {/* Order Confirmed Screen */}
                        <div>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3 border border-green-200">
                            <Check className="w-4 h-4" />
                          </div>
                          <h5 className="font-serif font-bold text-sm text-[#2B2523]">Table #4 Activated</h5>
                          <p className="text-[10px] text-coffee-500 mt-0.5">Order beamed to kitchen via Kryto POS.</p>
                          
                          <div className="mt-4 border-t border-coffee-200/40 pt-3 w-full">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-coffee-400 block mb-1">Simulated Order:</span>
                            {scanCart.map((name, index) => (
                              <div key={index} className="flex justify-between items-center text-[10px] py-1 border-b border-dashed border-coffee-250/30">
                                <span className="font-medium text-coffee-800 truncate max-w-[140px]">{name}</span>
                                <span className="font-bold text-coffee-950">1x</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 bg-[#F3E8E0]/60 p-2.5 rounded-lg border border-coffee-200/20 w-full">
                            <div className="flex items-center gap-1 text-[9px] font-semibold text-coffee-700">
                              <Coins className="w-3.5 h-3.5 text-coffee-600" />
                              <span>Earned: +15 Noiric Tokens</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setScanStep("idle")}
                          className="w-full text-center text-[9px] text-coffee-500 hover:text-[#2B2523] font-bold uppercase tracking-widest mt-4 pt-2 border-t border-coffee-200/40"
                        >
                          Reset Simulator
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Phone Footer */}
                  <div className="pb-3 pt-1 flex justify-center items-center bg-[#FAF3EC] border-t border-coffee-200/20">
                    <div className="w-24 h-1 bg-[#2B2523] rounded-full"></div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BOOK A TABLE MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div
            className="absolute inset-0 bg-[#2B2523]/40 backdrop-blur-md transition-opacity"
            onClick={resetBookingForm}
          ></div>

          {/* Modal Container */}
          <div className="bg-[#FAF3EC] rounded-[2rem] w-full max-w-lg shadow-2xl border border-coffee-250/20 overflow-hidden transform transition-all z-10 animate-fade-in relative">
            
            {/* Modal Header */}
            <div className="px-8 py-6 bg-[#FAF3EC]/80 border-b border-coffee-200/20 flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-lg text-coffee-950">Pre-Book a Table</h3>
                <p className="text-xs text-coffee-600 mt-0.5">Secure your spot for coffee, meetings, or hangouts.</p>
              </div>
              <button
                onClick={resetBookingForm}
                className="p-1.5 rounded-full hover:bg-coffee-200/30 text-coffee-600 hover:text-coffee-950 transition-colors"
                id="booking-modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 bg-[#FAF3EC]">
              {bookingStatus === "success" ? (
                <div className="text-center py-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4 border border-green-200 animate-bounce">
                    <Check className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-coffee-950 mb-2">Table Pre-Booked Successfully!</h4>
                  <p className="text-sm text-coffee-600 max-w-sm leading-relaxed mb-6">
                    Awesome, <strong className="font-semibold text-coffee-950">{bookingDetails.name}</strong>! We have reserved a table for <strong className="font-semibold text-coffee-950">{bookingDetails.guests} guests</strong> on <strong className="font-semibold text-coffee-950">{bookingDetails.date}</strong> at <strong className="font-semibold text-coffee-950">{bookingDetails.time}</strong>.
                  </p>
                  
                  <div className="bg-[#FAF3EC]/50 border border-coffee-200 rounded-xl px-5 py-4 w-full text-left mb-6">
                    <span className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest block mb-1">Reservation Token</span>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-base text-coffee-900 tracking-wider">#NRC-4928-AMB</span>
                      <span className="text-[10px] bg-coffee-300 text-coffee-950 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>
                    </div>
                  </div>

                  <button
                    onClick={resetBookingForm}
                    className="bg-[#2B2523] hover:bg-[#3D3532] text-white font-semibold text-xs uppercase tracking-widest py-3 px-8 rounded-full transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-5" id="booking-modal-form">
                  
                  {/* Name field */}
                  <div>
                    <label htmlFor="booking-name" className="block text-xs font-bold text-coffee-700 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="booking-name"
                      name="name"
                      required
                      placeholder="Enter your name"
                      value={bookingDetails.name}
                      onChange={handleBookingChange}
                      className="w-full bg-[#FAF3EC] border border-coffee-200 text-coffee-950 placeholder-coffee-450 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Phone field */}
                  <div>
                    <label htmlFor="booking-phone" className="block text-xs font-bold text-coffee-700 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="booking-phone"
                      name="phone"
                      required
                      placeholder="Enter 10-digit number"
                      value={bookingDetails.phone}
                      onChange={handleBookingChange}
                      className="w-full bg-[#FAF3EC] border border-coffee-200 text-coffee-950 placeholder-coffee-450 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Row: Guests & Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="booking-guests" className="block text-xs font-bold text-coffee-700 uppercase tracking-wider mb-2">
                        Guests count
                      </label>
                      <select
                        id="booking-guests"
                        name="guests"
                        value={bookingDetails.guests}
                        onChange={handleBookingChange}
                        className="w-full bg-[#FAF3EC] border border-coffee-200 text-coffee-950 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300 focus:border-transparent transition-all"
                      >
                        <option value="1">1 Person</option>
                        <option value="2">2 Persons</option>
                        <option value="3">3 Persons</option>
                        <option value="4">4 Persons</option>
                        <option value="5">5+ Persons</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="booking-date" className="block text-xs font-bold text-coffee-700 uppercase tracking-wider mb-2">
                        Select Date
                      </label>
                      <input
                        type="date"
                        id="booking-date"
                        name="date"
                        required
                        value={bookingDetails.date}
                        onChange={handleBookingChange}
                        className="w-full bg-[#FAF3EC] border border-coffee-200 text-coffee-950 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Time field */}
                  <div>
                    <label htmlFor="booking-time" className="block text-xs font-bold text-coffee-700 uppercase tracking-wider mb-2">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      id="booking-time"
                      name="time"
                      required
                      value={bookingDetails.time}
                      onChange={handleBookingChange}
                      className="w-full bg-[#FAF3EC] border border-coffee-200 text-coffee-950 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={bookingStatus === "submitting"}
                    className="w-full bg-[#2B2523] hover:bg-[#3D3532] disabled:bg-coffee-800 text-white font-semibold text-xs uppercase tracking-widest py-4 px-6 rounded-xl transition-all shadow-md mt-4 hover:shadow-lg flex items-center justify-center gap-2 border border-white/5"
                    id="booking-submit-btn"
                  >
                    {bookingStatus === "submitting" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Booking...
                      </>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* DETAILED LOCATION & CONTACT SECTION */}
      <section id="location" className="py-24 bg-[#F3E8E0] border-t border-coffee-200/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left side details */}
            <div className="lg:col-span-5">
              <span className="text-xs font-bold tracking-widest text-coffee-600 uppercase">Find Us</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2B2523] mt-2 mb-6">
                Visit Noiric Cafe
              </h2>
              
              <div className="space-y-6">
                
                {/* Location */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF3EC] flex items-center justify-center text-coffee-700 shrink-0 border border-coffee-200/20 shadow-sm">
                    <MapPin className="w-5 h-5 text-coffee-950" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-[#2B2523] text-sm">Our Location</h4>
                    <p className="text-xs text-coffee-600 mt-1 leading-relaxed">
                      MG Road, Ambikapur,<br />
                      Surguja, Chhattisgarh – 497001<br />
                      <span className="font-semibold text-coffee-800">(Near Goyal Super Mart)</span>
                    </p>
                  </div>
                </div>

                {/* Opening Hours */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF3EC] flex items-center justify-center text-coffee-700 shrink-0 border border-coffee-200/20 shadow-sm">
                    <Clock className="w-5 h-5 text-coffee-950" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-[#2B2523] text-sm">Opening Hours</h4>
                    <p className="text-xs text-coffee-600 mt-1 leading-relaxed">
                      Monday – Sunday: <br />
                      10:00 AM – 10:30 PM <br />
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block mt-1">Open All Days</span>
                    </p>
                  </div>
                </div>

                {/* Social Channels */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF3EC] flex items-center justify-center text-coffee-700 shrink-0 border border-coffee-200/20 shadow-sm">
                    <Instagram className="w-5 h-5 text-coffee-950" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-[#2B2523] text-sm">Social Presence</h4>
                    <p className="text-xs text-coffee-600 mt-1 leading-relaxed">
                      Instagram:{" "}
                      <a
                        href="https://instagram.com/noiric.cafe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-coffee-800 hover:text-coffee-950 underline underline-offset-2"
                        id="body-instagram-link"
                      >
                        @noiric.cafe
                      </a>
                    </p>
                  </div>
                </div>

              </div>

              {/* Book quick CTA */}
              <div className="mt-10 p-6 rounded-[2rem] bg-[#FAF3EC] border border-coffee-200/30 shadow-md shadow-coffee-200/5">
                <h4 className="font-serif font-bold text-sm text-coffee-950 mb-2">Plan a Birthday or Special Hangout?</h4>
                <p className="text-xs text-coffee-600 mb-4">We accommodate birthday parties, office work sprints, and book club gatherings. Let us set up the space for you.</p>
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="bg-[#2B2523] hover:bg-[#3D3532] text-white font-bold text-[10px] uppercase tracking-widest px-5 py-3 rounded-full transition-colors inline-flex items-center gap-1 border border-white/5 shadow-md"
                >
                  Reserve Table <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right side Map Placeholder (Aesthetically Designed) */}
            <div className="lg:col-span-7 w-full h-[380px] bg-[#FAF3EC] border border-coffee-200/30 rounded-[2rem] relative overflow-hidden flex flex-col justify-center items-center p-8 text-center shadow-md shadow-coffee-200/5">
              {/* Coffee stains decoration */}
              <div className="absolute top-10 right-10 w-24 h-24 rounded-full border border-coffee-200/20 -z-10"></div>
              <div className="absolute bottom-5 left-10 w-32 h-32 rounded-full border-2 border-coffee-200/10 -z-10"></div>

              <div className="relative">
                {/* Pin Icon with ripple */}
                <div className="w-16 h-16 rounded-full bg-[#2B2523] flex items-center justify-center text-coffee-300 mx-auto mb-6 shadow-lg badge-pulse border border-white/5">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="font-serif font-bold text-xl text-coffee-950 mb-2">MG Road, Ambikapur</h3>
                <p className="text-xs text-coffee-600 max-w-sm mx-auto leading-relaxed">
                  Located right in the heart of the city, near Goyal Super Mart. Walk in to feel the warmth, ambient acoustic sounds, and taste premium culinary creations.
                </p>
                <a
                  href="https://maps.google.com/?q=MG+Road+Ambikapur+Goyal+Super+Mart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-coffee-800 hover:text-coffee-950 hover:underline uppercase tracking-wider font-serif"
                  id="google-maps-directions-link"
                >
                  Get Directions on Maps <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MINDSPACE LIBRARY PARTNERSHIP BANNER */}
      <section className="bg-[#E5D3C7] border-y border-[#2B2523]/10 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FAF3EC] border border-coffee-250/20 flex items-center justify-center text-coffee-950 shrink-0 shadow-sm">
              <BookOpen className="w-6 h-6 stroke-[1.5] text-coffee-900" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#2B2523]">Mindspace Library Partnership</h3>
              <p className="text-xs text-coffee-650 mt-0.5">Exclusive benefits for local readers and students.</p>
            </div>
          </div>
          <p className="text-sm text-coffee-800 max-w-xl text-center md:text-left leading-relaxed font-medium">
            Studying at <strong className="text-coffee-950 font-semibold">Mindspace Library</strong>? Order directly from your desk QR code and enjoy exclusive member discounts.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2B2523] text-white pt-16 pb-8 border-t border-coffee-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-coffee-900/40">
            
            {/* Column 1: Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#FAF3EC] flex items-center justify-center text-coffee-950 border border-white/5">
                  <Coffee className="w-4 h-4" />
                </div>
                <span className="font-serif font-bold text-lg tracking-wider text-white">NOIRIC</span>
              </div>
              <p className="text-xs text-coffee-300 leading-relaxed max-w-xs">
                A premium digital cafe serving gourmet pizzas, coffee frappes, burgers, and sides. Experience cozy vibes and smart digital ordering on MG Road, Ambikapur.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-[#EADACF] mb-4">Explore</h4>
              <ul className="space-y-2.5 text-xs text-coffee-400">
                <li><a href="#experience" className="hover:text-white transition-colors">Our Experience</a></li>
                <li><a href="#menu" className="hover:text-white transition-colors">Gourmet Menu</a></li>
                <li><a href="#tech" className="hover:text-white transition-colors">Smart Features</a></li>
                <li><a href="#location" className="hover:text-white transition-colors">Location & Hours</a></li>
              </ul>
            </div>

            {/* Column 3: Contact Details */}
            <div>
              <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-[#EADACF] mb-4">Visit Us</h4>
              <ul className="space-y-2.5 text-xs text-coffee-400">
                <li className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-coffee-300 shrink-0" />
                  <span>MG Road, Near Goyal Super Mart, Ambikapur, CG</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-coffee-300 shrink-0" />
                  <span>10:00 AM – 10:30 PM (Daily)</span>
                </li>
                <li>
                  <a
                    href="https://instagram.com/noiric.cafe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                    id="footer-instagram-link"
                  >
                    <Instagram className="w-3.5 h-3.5 text-coffee-300" />
                    <span>@noiric.cafe</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter / Connect */}
            <div>
              <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-[#EADACF] mb-4">Newsletter</h4>
              <p className="text-[11px] text-coffee-400 mb-3 leading-relaxed">
                Subscribe to get token bonuses and weekend discount codes.
              </p>
              <div className="flex rounded-full overflow-hidden border border-coffee-800 bg-[#2B2523] p-1">
                <input
                  type="email"
                  placeholder="Enter email"
                  className="bg-transparent text-xs text-white placeholder-coffee-500 px-3 py-1.5 focus:outline-none w-full"
                  id="footer-email-input"
                />
                <button
                  onClick={() => alert("Subscribed! Your email has been added to our digital rewards list.")}
                  className="bg-[#FAF3EC] text-coffee-950 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full hover:bg-white transition-colors border border-white/5"
                  id="footer-email-submit"
                >
                  Join
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Agency Credit */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-coffee-400">
            <p>&copy; {new Date().getFullYear()} Noiric Cafe. All rights reserved.</p>
            <p className="flex items-center gap-1">
              <span>Engineered by</span>
              <a
                href="https://krytostudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-coffee-300 underline underline-offset-2 tracking-wider font-serif"
                id="agency-credit-link"
              >
                Kryto Studio
              </a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
