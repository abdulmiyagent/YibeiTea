import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============ CATEGORIES ============
const categories = [
  {
    slug: "brown-sugar",
    sortOrder: 1,
    translations: {
      nl: { name: "Brown Sugar", description: "Met verse tapioca parels" },
      en: { name: "Brown Sugar", description: "With fresh tapioca pearls" },
    },
  },
  {
    slug: "milk-tea",
    sortOrder: 2,
    translations: {
      nl: { name: "Milk Tea", description: "Klassieke melkthee variaties" },
      en: { name: "Milk Tea", description: "Classic milk tea varieties" },
    },
  },
  {
    slug: "cream-cheese",
    sortOrder: 3,
    translations: {
      nl: { name: "Cream Cheese", description: "Met tapioca en romige cream cheese topping" },
      en: { name: "Cream Cheese", description: "With tapioca and creamy cream cheese topping" },
    },
  },
  {
    slug: "iced-coffee",
    sortOrder: 4,
    translations: {
      nl: { name: "Iced Coffee", description: "Verfrissende ijskoffie variaties" },
      en: { name: "Iced Coffee", description: "Refreshing iced coffee varieties" },
    },
  },
  {
    slug: "hot-coffee",
    sortOrder: 5,
    translations: {
      nl: { name: "Hot Coffee", description: "Warme koffie specialiteiten" },
      en: { name: "Hot Coffee", description: "Hot coffee specialties" },
    },
  },
  {
    slug: "ice-tea",
    sortOrder: 6,
    translations: {
      nl: { name: "Ice Tea", description: "Met een topping naar keuze" },
      en: { name: "Ice Tea", description: "With one topping of your choice" },
    },
  },
  {
    slug: "mojito",
    sortOrder: 7,
    translations: {
      nl: { name: "Mojito", description: "Virgin mojito's - alcoholvrij" },
      en: { name: "Mojito", description: "Virgin mojitos - alcohol-free" },
    },
  },
  {
    slug: "kids-star",
    sortOrder: 8,
    translations: {
      nl: { name: "Kids Star", description: "Speciale drankjes voor kinderen" },
      en: { name: "Kids Star", description: "Special drinks for kids" },
    },
  },
  {
    slug: "latte-special",
    sortOrder: 9,
    translations: {
      nl: { name: "Latte Special", description: "Warme latte specialiteiten" },
      en: { name: "Latte Special", description: "Hot latte specialties" },
    },
  },
  {
    slug: "frappucchino",
    sortOrder: 10,
    translations: {
      nl: { name: "Frappucchino", description: "Romige ijskoude frappucchino's" },
      en: { name: "Frappucchino", description: "Creamy ice-cold frappucchinos" },
    },
  },
];

// ============ TOPPINGS ============
const toppings = [
  {
    slug: "tapioca",
    price: 0.5,
    sortOrder: 1,
    translations: {
      nl: { name: "Tapioca" },
      en: { name: "Tapioca" },
    },
  },
  {
    slug: "popping-boba",
    price: 0.5,
    sortOrder: 2,
    translations: {
      nl: { name: "Popping Boba" },
      en: { name: "Popping Boba" },
    },
  },
  {
    slug: "coco-jelly",
    price: 0.5,
    sortOrder: 3,
    translations: {
      nl: { name: "Coco Jelly" },
      en: { name: "Coco Jelly" },
    },
  },
];

// ============ CUSTOMIZATION GROUPS ============
const customizationGroups = [
  {
    type: "SUGAR_LEVEL" as const,
    sortOrder: 1,
    values: [
      { value: "0", sortOrder: 1, isDefault: false, translations: { nl: "Geen suiker", en: "No sugar" } },
      { value: "25", sortOrder: 2, isDefault: false, translations: { nl: "25% suiker", en: "25% sugar" } },
      { value: "50", sortOrder: 3, isDefault: false, translations: { nl: "50% suiker", en: "50% sugar" } },
      { value: "75", sortOrder: 4, isDefault: false, translations: { nl: "75% suiker", en: "75% sugar" } },
      { value: "100", sortOrder: 5, isDefault: true, translations: { nl: "100% suiker", en: "100% sugar" } },
    ],
  },
  {
    type: "ICE_LEVEL" as const,
    sortOrder: 2,
    values: [
      { value: "none", sortOrder: 1, isDefault: false, translations: { nl: "Geen ijs", en: "No ice" } },
      { value: "less", sortOrder: 2, isDefault: false, translations: { nl: "Weinig ijs", en: "Less ice" } },
      { value: "normal", sortOrder: 3, isDefault: true, translations: { nl: "Normaal", en: "Normal" } },
      { value: "extra", sortOrder: 4, isDefault: false, translations: { nl: "Extra ijs", en: "Extra ice" } },
    ],
  },
];

// ============ PRODUCTS ============
// Using category slugs that will be resolved to IDs
const products = [
  // ===== BROWN SUGAR (With Tapioca) =====
  {
    slug: "boba-milk-tea",
    categorySlug: "brown-sugar",
    price: 6.0,
    isFeatured: true,
    sortOrder: 1,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/boba-milk-tea.svg",
    translations: {
      nl: { name: "Boba Milk Tea", description: "Klassieke melkthee met bruine suiker en verse tapioca parels" },
      en: { name: "Boba Milk Tea", description: "Classic milk tea with brown sugar and fresh tapioca pearls" },
    },
  },
  {
    slug: "boba-coffee",
    categorySlug: "brown-sugar",
    price: 6.0,
    isFeatured: false,
    sortOrder: 2,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/boba-coffee.svg",
    translations: {
      nl: { name: "Boba Coffee", description: "Rijke koffie met bruine suiker siroop en tapioca" },
      en: { name: "Boba Coffee", description: "Rich coffee with brown sugar syrup and tapioca" },
    },
  },
  {
    slug: "brown-sugar-matcha-milk",
    categorySlug: "brown-sugar",
    price: 6.0,
    isFeatured: false,
    sortOrder: 3,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/matcha-milk.svg",
    translations: {
      nl: { name: "Matcha Milk", description: "Premium matcha met bruine suiker en tapioca" },
      en: { name: "Matcha Milk", description: "Premium matcha with brown sugar and tapioca" },
    },
  },
  {
    slug: "brown-sugar-chocolate-milk",
    categorySlug: "brown-sugar",
    price: 5.5,
    isFeatured: false,
    sortOrder: 4,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/chocolate-milk.svg",
    translations: {
      nl: { name: "Chocolate Milk", description: "Romige chocolademelk met bruine suiker tapioca" },
      en: { name: "Chocolate Milk", description: "Creamy chocolate milk with brown sugar tapioca" },
    },
  },
  {
    slug: "brown-sugar-fresh-milk",
    categorySlug: "brown-sugar",
    price: 5.5,
    isFeatured: false,
    sortOrder: 5,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/fresh-milk.svg",
    translations: {
      nl: { name: "Fresh Milk", description: "Verse melk met bruine suiker en tapioca parels" },
      en: { name: "Fresh Milk", description: "Fresh milk with brown sugar and tapioca pearls" },
    },
  },

  // ===== MILK TEA =====
  {
    slug: "taro-milk-tea",
    categorySlug: "milk-tea",
    price: 5.5,
    isFeatured: true,
    sortOrder: 1,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/taro.png",
    translations: {
      nl: { name: "Taro", description: "Romige taro melkthee met authentieke smaak" },
      en: { name: "Taro", description: "Creamy taro milk tea with authentic flavor" },
    },
  },
  {
    slug: "indian-chai",
    categorySlug: "milk-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 2,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/indian-chai.svg",
    translations: {
      nl: { name: "Indian Chai", description: "Aromatische Indiase chai met specerijen" },
      en: { name: "Indian Chai", description: "Aromatic Indian chai with spices" },
    },
  },
  {
    slug: "thai-tea",
    categorySlug: "milk-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 3,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/thai-tea.svg",
    translations: {
      nl: { name: "Thai Tea", description: "Klassieke Thaise thee met gecondenseerde melk" },
      en: { name: "Thai Tea", description: "Classic Thai tea with condensed milk" },
    },
  },
  {
    slug: "singapore-tea",
    categorySlug: "milk-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 4,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/singapore-tea.svg",
    translations: {
      nl: { name: "Singapore Tea", description: "Traditionele Singaporese melkthee" },
      en: { name: "Singapore Tea", description: "Traditional Singaporean milk tea" },
    },
  },
  {
    slug: "salted-caramel-milk-tea",
    categorySlug: "milk-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 5,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/salted-caramel-milk-tea.svg",
    translations: {
      nl: { name: "Salted Caramel", description: "Melkthee met gezouten karamel" },
      en: { name: "Salted Caramel", description: "Milk tea with salted caramel" },
    },
  },
  {
    slug: "honey-milk-tea",
    categorySlug: "milk-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 6,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/honey-milk-tea.svg",
    translations: {
      nl: { name: "Honey", description: "Zachte melkthee met natuurlijke honing" },
      en: { name: "Honey", description: "Smooth milk tea with natural honey" },
    },
  },
  {
    slug: "caramel-milk-tea",
    categorySlug: "milk-tea",
    price: 5.0,
    isFeatured: false,
    sortOrder: 7,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/caramel-milk-tea.svg",
    translations: {
      nl: { name: "Caramel", description: "Klassieke melkthee met karamel smaak" },
      en: { name: "Caramel", description: "Classic milk tea with caramel flavor" },
    },
  },
  {
    slug: "hazelnut-milk-tea",
    categorySlug: "milk-tea",
    price: 5.0,
    isFeatured: false,
    sortOrder: 8,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/hazelnut-milk-tea.svg",
    translations: {
      nl: { name: "Hazelnut", description: "Melkthee met hazelnoot smaak" },
      en: { name: "Hazelnut", description: "Milk tea with hazelnut flavor" },
    },
  },
  {
    slug: "vanilla-milk-tea",
    categorySlug: "milk-tea",
    price: 5.0,
    isFeatured: false,
    sortOrder: 9,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/vanilla-milk-tea.svg",
    translations: {
      nl: { name: "Vanilla", description: "Zachte melkthee met vanille" },
      en: { name: "Vanilla", description: "Smooth milk tea with vanilla" },
    },
  },
  {
    slug: "coconut-milk-tea",
    categorySlug: "milk-tea",
    price: 5.0,
    isFeatured: false,
    sortOrder: 10,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/coconut-milk-tea.svg",
    translations: {
      nl: { name: "Coconut", description: "Tropische melkthee met kokos" },
      en: { name: "Coconut", description: "Tropical milk tea with coconut" },
    },
  },

  // ===== CREAM CHEESE (With Tapioca) =====
  {
    slug: "cream-cheese-green-tea",
    categorySlug: "cream-cheese",
    price: 6.0,
    isFeatured: false,
    sortOrder: 1,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/cream-cheese-green-tea.svg",
    translations: {
      nl: { name: "Green Tea", description: "Groene thee met romige cream cheese topping" },
      en: { name: "Green Tea", description: "Green tea with creamy cream cheese topping" },
    },
  },
  {
    slug: "cream-cheese-salted-caramel",
    categorySlug: "cream-cheese",
    price: 6.0,
    isFeatured: false,
    sortOrder: 2,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/cream-cheese-salted-caramel.svg",
    translations: {
      nl: { name: "Salted Caramel", description: "Gezouten karamel met cream cheese" },
      en: { name: "Salted Caramel", description: "Salted caramel with cream cheese" },
    },
  },
  {
    slug: "cream-cheese-ovomaltine",
    categorySlug: "cream-cheese",
    price: 6.0,
    isFeatured: false,
    sortOrder: 3,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/cream-cheese-ovomaltine.svg",
    translations: {
      nl: { name: "Ovomaltine", description: "Ovomaltine met cream cheese topping" },
      en: { name: "Ovomaltine", description: "Ovomaltine with cream cheese topping" },
    },
  },
  {
    slug: "cream-cheese-matcha",
    categorySlug: "cream-cheese",
    price: 6.0,
    isFeatured: false,
    sortOrder: 4,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/cream-cheese-matcha.svg",
    translations: {
      nl: { name: "Matcha", description: "Premium matcha met cream cheese" },
      en: { name: "Matcha", description: "Premium matcha with cream cheese" },
    },
  },
  {
    slug: "cream-cheese-taro-milk",
    categorySlug: "cream-cheese",
    price: 6.0,
    isFeatured: true,
    sortOrder: 5,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/cream-cheese-taro-milk.png",
    translations: {
      nl: { name: "Taro Milk", description: "Romige taro melk met cream cheese topping" },
      en: { name: "Taro Milk", description: "Creamy taro milk with cream cheese topping" },
    },
  },

  // ===== ICED COFFEE =====
  {
    slug: "caramel-vanilla-latte",
    categorySlug: "iced-coffee",
    price: 5.5,
    isFeatured: true,
    sortOrder: 1,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/caramel-vanilla-latte.png",
    translations: {
      nl: { name: "Caramel Vanilla Latte", description: "Ijskoffie met karamel en vanille" },
      en: { name: "Caramel Vanilla Latte", description: "Iced coffee with caramel and vanilla" },
    },
  },
  {
    slug: "salted-caramel-biscoff",
    categorySlug: "iced-coffee",
    price: 5.5,
    isFeatured: false,
    sortOrder: 2,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/iced-latte.svg",
    translations: {
      nl: { name: "Salted Caramel Biscoff", description: "Ijskoffie met gezouten karamel en Biscoff" },
      en: { name: "Salted Caramel Biscoff", description: "Iced coffee with salted caramel and Biscoff" },
    },
  },
  {
    slug: "hazelnut-nutella",
    categorySlug: "iced-coffee",
    price: 5.5,
    isFeatured: true,
    sortOrder: 3,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/hazelnut-nutella.png",
    translations: {
      nl: { name: "Hazelnut Nutella", description: "Romige ijskoffie met hazelnoot en Nutella" },
      en: { name: "Hazelnut Nutella", description: "Creamy iced coffee with hazelnut and Nutella" },
    },
  },
  {
    slug: "baileys-ovomaltine",
    categorySlug: "iced-coffee",
    price: 5.5,
    isFeatured: false,
    sortOrder: 4,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/iced-mocha.svg",
    translations: {
      nl: { name: "Baileys Ovomaltine", description: "Ijskoffie met Baileys smaak en Ovomaltine" },
      en: { name: "Baileys Ovomaltine", description: "Iced coffee with Baileys flavor and Ovomaltine" },
    },
  },
  {
    slug: "black-forest",
    categorySlug: "iced-coffee",
    price: 5.5,
    isFeatured: false,
    sortOrder: 5,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/iced-mocha.svg",
    translations: {
      nl: { name: "Black Forest", description: "Chocolade koffie met kersen smaak" },
      en: { name: "Black Forest", description: "Chocolate coffee with cherry flavor" },
    },
  },

  // ===== HOT COFFEE =====
  {
    slug: "ristretto",
    categorySlug: "hot-coffee",
    price: 2.0,
    isFeatured: false,
    sortOrder: 1,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/hot-americano.svg",
    translations: {
      nl: { name: "Ristretto", description: "Geconcentreerde espresso shot" },
      en: { name: "Ristretto", description: "Concentrated espresso shot" },
    },
  },
  {
    slug: "espresso",
    categorySlug: "hot-coffee",
    price: 2.5,
    isFeatured: false,
    sortOrder: 2,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/hot-americano.svg",
    translations: {
      nl: { name: "Espresso", description: "Klassieke Italiaanse espresso" },
      en: { name: "Espresso", description: "Classic Italian espresso" },
    },
  },
  {
    slug: "doppio",
    categorySlug: "hot-coffee",
    price: 3.0,
    isFeatured: false,
    sortOrder: 3,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/hot-americano.svg",
    translations: {
      nl: { name: "Doppio", description: "Dubbele espresso" },
      en: { name: "Doppio", description: "Double espresso" },
    },
  },
  {
    slug: "coffee",
    categorySlug: "hot-coffee",
    price: 3.0,
    isFeatured: false,
    sortOrder: 4,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/hot-americano.svg",
    translations: {
      nl: { name: "Coffee", description: "Klassieke filterkoffie" },
      en: { name: "Coffee", description: "Classic filter coffee" },
    },
  },
  {
    slug: "cappuccino",
    categorySlug: "hot-coffee",
    price: 3.5,
    isFeatured: false,
    sortOrder: 5,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/hot-cappuccino.svg",
    translations: {
      nl: { name: "Cappuccino", description: "Espresso met gestoomde melk en schuim" },
      en: { name: "Cappuccino", description: "Espresso with steamed milk and foam" },
    },
  },
  {
    slug: "latte-macchiato",
    categorySlug: "hot-coffee",
    price: 4.0,
    isFeatured: false,
    sortOrder: 6,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/hot-latte.svg",
    translations: {
      nl: { name: "Latte Macchiato", description: "Gelaagde melkkoffie met espresso" },
      en: { name: "Latte Macchiato", description: "Layered milk coffee with espresso" },
    },
  },
  {
    slug: "flat-white",
    categorySlug: "hot-coffee",
    price: 4.0,
    isFeatured: false,
    sortOrder: 7,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/hot-latte.svg",
    translations: {
      nl: { name: "Flat White", description: "Romige koffie met microfoam" },
      en: { name: "Flat White", description: "Creamy coffee with microfoam" },
    },
  },

  // ===== ICED TEA (With One Topping) =====
  {
    slug: "berry-jasmin",
    categorySlug: "ice-tea",
    price: 6.0,
    isFeatured: false,
    sortOrder: 1,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-passion-fruit.svg",
    translations: {
      nl: { name: "Berry Jasmin", description: "Jasmijnthee met bessen blend" },
      en: { name: "Berry Jasmin", description: "Jasmine tea with berry blend" },
    },
  },
  {
    slug: "lemon-honey-ginger",
    categorySlug: "ice-tea",
    price: 6.0,
    isFeatured: false,
    sortOrder: 2,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-lemon.svg",
    translations: {
      nl: { name: "Lemon Honey Ginger", description: "Verfrissende thee met citroen, honing en gember" },
      en: { name: "Lemon Honey Ginger", description: "Refreshing tea with lemon, honey and gember" },
    },
  },
  {
    slug: "peach-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 3,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-peach.svg",
    translations: {
      nl: { name: "Peach", description: "Zoete perzik ijsthee" },
      en: { name: "Peach", description: "Sweet peach iced tea" },
    },
  },
  {
    slug: "mango-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 4,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-mango.svg",
    translations: {
      nl: { name: "Mango", description: "Tropische mango ijsthee" },
      en: { name: "Mango", description: "Tropical mango iced tea" },
    },
  },
  {
    slug: "lychee-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 5,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-lychee.svg",
    translations: {
      nl: { name: "Lychee", description: "Exotische lychee ijsthee" },
      en: { name: "Lychee", description: "Exotic lychee iced tea" },
    },
  },
  {
    slug: "passion-fruit-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 6,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-passion-fruit.svg",
    translations: {
      nl: { name: "Passion Fruit", description: "Tropische passievrucht ijsthee" },
      en: { name: "Passion Fruit", description: "Tropical passion fruit iced tea" },
    },
  },
  {
    slug: "strawberry-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: true,
    sortOrder: 7,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/strawberry.png",
    translations: {
      nl: { name: "Strawberry", description: "Zoete aardbeien ijsthee" },
      en: { name: "Strawberry", description: "Sweet strawberry iced tea" },
    },
  },
  {
    slug: "raspberry-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 8,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-passion-fruit.svg",
    translations: {
      nl: { name: "Raspberry", description: "Frisse frambozen ijsthee" },
      en: { name: "Raspberry", description: "Fresh raspberry iced tea" },
    },
  },
  {
    slug: "green-apple-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: true,
    sortOrder: 9,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/green-apple.png",
    translations: {
      nl: { name: "Green Apple", description: "Frisse groene appel ijsthee" },
      en: { name: "Green Apple", description: "Fresh green apple iced tea" },
    },
  },
  {
    slug: "watermelon-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 10,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-mango.svg",
    translations: {
      nl: { name: "Watermelon", description: "Verfrissende watermeloen ijsthee" },
      en: { name: "Watermelon", description: "Refreshing watermelon iced tea" },
    },
  },
  {
    slug: "kiwi-ice-tea",
    categorySlug: "ice-tea",
    price: 5.5,
    isFeatured: false,
    sortOrder: 11,
    caffeine: true,
    vegan: true,
    imageUrl: "/images/products/ice-tea-lychee.svg",
    translations: {
      nl: { name: "Kiwi", description: "Exotische kiwi ijsthee" },
      en: { name: "Kiwi", description: "Exotic kiwi iced tea" },
    },
  },

  // ===== MOJITO (Virgin) =====
  {
    slug: "blue-ocean",
    categorySlug: "mojito",
    price: 6.0,
    isFeatured: true,
    sortOrder: 1,
    caffeine: false,
    vegan: true,
    imageUrl: "/images/products/blue-ocean.png",
    translations: {
      nl: { name: "Blue Ocean", description: "Verfrissende blauwe mocktail met munt" },
      en: { name: "Blue Ocean", description: "Refreshing blue mocktail with mint" },
    },
  },
  {
    slug: "tokyo-kiwi",
    categorySlug: "mojito",
    price: 6.0,
    isFeatured: true,
    sortOrder: 2,
    caffeine: false,
    vegan: true,
    imageUrl: "/images/products/tokyo-kiwi.png",
    translations: {
      nl: { name: "Tokyo Kiwi", description: "Exotische kiwi mojito met Japanse twist" },
      en: { name: "Tokyo Kiwi", description: "Exotic kiwi mojito with Japanese twist" },
    },
  },
  {
    slug: "peach-garden",
    categorySlug: "mojito",
    price: 6.0,
    isFeatured: true,
    sortOrder: 3,
    caffeine: false,
    vegan: true,
    imageUrl: "/images/products/peach-garden.png",
    translations: {
      nl: { name: "Peach Garden", description: "Zoete perzik mojito met verse munt" },
      en: { name: "Peach Garden", description: "Sweet peach mojito with fresh mint" },
    },
  },
  {
    slug: "raspberry-mojito",
    categorySlug: "mojito",
    price: 6.0,
    isFeatured: false,
    sortOrder: 4,
    caffeine: false,
    vegan: true,
    imageUrl: "/images/products/mojito-original.svg",
    translations: {
      nl: { name: "Raspberry", description: "Frisse frambozen mojito" },
      en: { name: "Raspberry", description: "Fresh raspberry mojito" },
    },
  },
  {
    slug: "strawberry-mojito",
    categorySlug: "mojito",
    price: 6.0,
    isFeatured: false,
    sortOrder: 5,
    caffeine: false,
    vegan: true,
    imageUrl: "/images/products/mojito-strawberry.svg",
    translations: {
      nl: { name: "Strawberry", description: "Zoete aardbeien mojito" },
      en: { name: "Strawberry", description: "Sweet strawberry mojito" },
    },
  },
  {
    slug: "green-apple-mojito",
    categorySlug: "mojito",
    price: 6.0,
    isFeatured: false,
    sortOrder: 6,
    caffeine: false,
    vegan: true,
    imageUrl: "/images/products/mojito-original.svg",
    translations: {
      nl: { name: "Green Apple", description: "Frisse groene appel mojito" },
      en: { name: "Green Apple", description: "Fresh green apple mojito" },
    },
  },
  {
    slug: "watermelon-mojito",
    categorySlug: "mojito",
    price: 6.0,
    isFeatured: false,
    sortOrder: 7,
    caffeine: false,
    vegan: true,
    imageUrl: "/images/products/mojito-mango.svg",
    translations: {
      nl: { name: "Watermelon", description: "Verfrissende watermeloen mojito" },
      en: { name: "Watermelon", description: "Refreshing watermelon mojito" },
    },
  },

  // ===== KIDS STAR =====
  {
    slug: "unicorn",
    categorySlug: "kids-star",
    price: 5.5,
    isFeatured: false,
    sortOrder: 1,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/kids-vanilla.svg",
    translations: {
      nl: { name: "Unicorn", description: "Magische kleurrijke drankje voor kinderen" },
      en: { name: "Unicorn", description: "Magical colorful drink for kids" },
    },
  },
  {
    slug: "strawberry-milk",
    categorySlug: "kids-star",
    price: 5.5,
    isFeatured: false,
    sortOrder: 2,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/kids-strawberry.svg",
    translations: {
      nl: { name: "Strawberry Milk", description: "Romige aardbeienmelk" },
      en: { name: "Strawberry Milk", description: "Creamy strawberry milk" },
    },
  },
  {
    slug: "chocolate-cloud",
    categorySlug: "kids-star",
    price: 5.5,
    isFeatured: false,
    sortOrder: 3,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/kids-chocolate.svg",
    translations: {
      nl: { name: "Chocolate Cloud", description: "Fluffy chocolademelk met marshmallow" },
      en: { name: "Chocolate Cloud", description: "Fluffy chocolate milk with marshmallow" },
    },
  },
  {
    slug: "peach-butterfly",
    categorySlug: "kids-star",
    price: 5.5,
    isFeatured: false,
    sortOrder: 4,
    caffeine: false,
    vegan: true,
    imageUrl: "/images/products/ice-tea-peach.svg",
    translations: {
      nl: { name: "Peach Butterfly", description: "Zoete perzik drankje met vlinder effect" },
      en: { name: "Peach Butterfly", description: "Sweet peach drink with butterfly effect" },
    },
  },
  {
    slug: "ube-marshmallow",
    categorySlug: "kids-star",
    price: 5.5,
    isFeatured: false,
    sortOrder: 5,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/kids-vanilla.svg",
    translations: {
      nl: { name: "Ube Marshmallow", description: "Paarse ube melk met marshmallow" },
      en: { name: "Ube Marshmallow", description: "Purple ube milk with marshmallow" },
    },
  },

  // ===== LATTE SPECIAL =====
  {
    slug: "chai-latte",
    categorySlug: "latte-special",
    price: 4.5,
    isFeatured: false,
    sortOrder: 1,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/indian-chai.svg",
    translations: {
      nl: { name: "Chai Latte", description: "Kruidige chai met gestoomde melk" },
      en: { name: "Chai Latte", description: "Spiced chai with steamed milk" },
    },
  },
  {
    slug: "matcha-latte",
    categorySlug: "latte-special",
    price: 4.5,
    isFeatured: false,
    sortOrder: 2,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/matcha-milk.svg",
    translations: {
      nl: { name: "Matcha Latte", description: "Premium Japanse matcha latte" },
      en: { name: "Matcha Latte", description: "Premium Japanese matcha latte" },
    },
  },
  {
    slug: "caramel-latte",
    categorySlug: "latte-special",
    price: 4.5,
    isFeatured: false,
    sortOrder: 3,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/latte-caramel-vanilla.svg",
    translations: {
      nl: { name: "Caramel Latte", description: "Zoete karamel latte" },
      en: { name: "Caramel Latte", description: "Sweet caramel latte" },
    },
  },
  {
    slug: "butterscotch-seasalt",
    categorySlug: "latte-special",
    price: 4.5,
    isFeatured: false,
    sortOrder: 4,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/latte-caramel-vanilla.svg",
    translations: {
      nl: { name: "Butterscotch Seasalt", description: "Butterscotch latte met zeezout" },
      en: { name: "Butterscotch Seasalt", description: "Butterscotch latte with sea salt" },
    },
  },
  {
    slug: "mocha-latte",
    categorySlug: "latte-special",
    price: 4.5,
    isFeatured: false,
    sortOrder: 5,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/frappuccino-mocha.svg",
    translations: {
      nl: { name: "Mocha Latte", description: "Chocolade espresso latte" },
      en: { name: "Mocha Latte", description: "Chocolate espresso latte" },
    },
  },

  // ===== FRAPPUCCHINO =====
  {
    slug: "strawberry-frappucchino",
    categorySlug: "frappucchino",
    price: 5.5,
    isFeatured: false,
    sortOrder: 1,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/frappuccino-strawberry.svg",
    translations: {
      nl: { name: "Strawberry", description: "Romige aardbeien frappucchino" },
      en: { name: "Strawberry", description: "Creamy strawberry frappucchino" },
    },
  },
  {
    slug: "caramel-coffee-frappucchino",
    categorySlug: "frappucchino",
    price: 5.5,
    isFeatured: false,
    sortOrder: 2,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/frappuccino-caramel.svg",
    translations: {
      nl: { name: "Caramel Coffee", description: "Karamel koffie frappucchino" },
      en: { name: "Caramel Coffee", description: "Caramel coffee frappucchino" },
    },
  },
  {
    slug: "oreo-frappucchino",
    categorySlug: "frappucchino",
    price: 5.5,
    isFeatured: false,
    sortOrder: 3,
    caffeine: false,
    vegan: false,
    imageUrl: "/images/products/frappuccino-mocha.svg",
    translations: {
      nl: { name: "Oreo", description: "Romige Oreo frappucchino" },
      en: { name: "Oreo", description: "Creamy Oreo frappucchino" },
    },
  },
  {
    slug: "matcha-frappucchino",
    categorySlug: "frappucchino",
    price: 5.5,
    isFeatured: false,
    sortOrder: 4,
    caffeine: true,
    vegan: false,
    imageUrl: "/images/products/frappuccino-matcha.svg",
    translations: {
      nl: { name: "Matcha", description: "Groene matcha frappucchino" },
      en: { name: "Matcha", description: "Green matcha frappucchino" },
    },
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.customizationValueTranslation.deleteMany();
  await prisma.customizationValue.deleteMany();
  await prisma.customizationGroup.deleteMany();
  await prisma.productTranslation.deleteMany();
  await prisma.toppingTranslation.deleteMany();
  await prisma.categoryTranslation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.category.deleteMany();

  // Create categories first
  console.log("Creating categories...");
  const categoryMap: Record<string, string> = {};

  for (const category of categories) {
    const { translations, ...data } = category;

    const created = await prisma.category.create({
      data: {
        ...data,
        translations: {
          create: [
            { locale: "nl", name: translations.nl.name, description: translations.nl.description },
            { locale: "en", name: translations.en.name, description: translations.en.description },
          ],
        },
      },
    });

    categoryMap[category.slug] = created.id;
    console.log(`Created category: ${data.slug}`);
  }

  // Create toppings
  console.log("Creating toppings...");
  for (const topping of toppings) {
    const { translations, ...data } = topping;

    await prisma.topping.create({
      data: {
        ...data,
        translations: {
          create: [
            { locale: "nl", name: translations.nl.name },
            { locale: "en", name: translations.en.name },
          ],
        },
      },
    });

    console.log(`Created topping: ${data.slug}`);
  }

  // Create customization groups
  console.log("Creating customization groups...");
  for (const group of customizationGroups) {
    const createdGroup = await prisma.customizationGroup.create({
      data: {
        type: group.type,
        sortOrder: group.sortOrder,
        isActive: true,
      },
    });

    // Create values for this group
    for (const value of group.values) {
      await prisma.customizationValue.create({
        data: {
          groupId: createdGroup.id,
          value: value.value,
          sortOrder: value.sortOrder,
          isDefault: value.isDefault,
          isAvailable: true,
          priceModifier: 0,
          translations: {
            create: [
              { locale: "nl", label: value.translations.nl },
              { locale: "en", label: value.translations.en },
            ],
          },
        },
      });
    }

    console.log(`Created customization group: ${group.type} with ${group.values.length} values`);
  }

  // Create products
  console.log("Creating products...");
  for (const product of products) {
    const { translations, categorySlug, ...data } = product;
    const categoryId = categoryMap[categorySlug];

    if (!categoryId) {
      console.error(`Category not found for product ${data.slug}: ${categorySlug}`);
      continue;
    }

    await prisma.product.create({
      data: {
        ...data,
        categoryId,
        translations: {
          create: [
            { locale: "nl", name: translations.nl.name, description: translations.nl.description },
            { locale: "en", name: translations.en.name, description: translations.en.description },
          ],
        },
      },
    });

    console.log(`Created product: ${data.slug}`);
  }

  // Create/update store settings
  console.log("Creating store settings...");
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {
      openingHours: {
        monday: { open: "11:00", close: "20:00" },
        tuesday: { open: "11:00", close: "20:00" },
        wednesday: { open: "11:00", close: "20:00" },
        thursday: { open: "11:00", close: "20:00" },
        friday: { open: "11:00", close: "20:00" },
        saturday: { open: "11:00", close: "20:00" },
        sunday: { open: "10:00", close: "19:00" },
      },
    },
    create: {
      id: "default",
      openingHours: {
        monday: { open: "11:00", close: "20:00" },
        tuesday: { open: "11:00", close: "20:00" },
        wednesday: { open: "11:00", close: "20:00" },
        thursday: { open: "11:00", close: "20:00" },
        friday: { open: "11:00", close: "20:00" },
        saturday: { open: "11:00", close: "20:00" },
        sunday: { open: "10:00", close: "19:00" },
      },
      minPickupMinutes: 15,
      maxAdvanceOrderDays: 7,
      pointsPerEuro: 10,
    },
  });

  console.log(`\nSeeding completed!`);
  console.log(`- ${categories.length} categories created`);
  console.log(`- ${toppings.length} toppings created`);
  console.log(`- ${customizationGroups.length} customization groups created`);
  console.log(`- ${products.length} products created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
