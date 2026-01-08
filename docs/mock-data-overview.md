# Overzicht van alle Mock Data in YibeiTea

## 1. Database Seed File

**Locatie:** `prisma/seed.ts`

### Categorieën (10 items)

| Naam | Slug |
|------|------|
| Brown Sugar | brown-sugar |
| Milk Tea | milk-tea |
| Cream Cheese | cream-cheese |
| Iced Coffee | iced-coffee |
| Hot Coffee | hot-coffee |
| Ice Tea | ice-tea |
| Mojito | mojito |
| Kids Star | kids-star |
| Latte Special | latte-special |
| Frappucchino | frappucchino |

*Elke categorie heeft tweetalige vertalingen (nl, en) en beschrijvingen*

### Producten (118 items)

| Categorie | Aantal | Voorbeelden |
|-----------|--------|-------------|
| Brown Sugar | 5 | Boba Milk Tea, Boba Coffee, Matcha Milk, Chocolate Milk, Fresh Milk |
| Milk Tea | 11 | Taro, Indian Chai, Thai Tea, Singapore Tea, Salted Caramel, etc. |
| Cream Cheese | 5 | Green Tea, Salted Caramel, Ovomaltine, Matcha, Taro Milk |
| Iced Coffee | 5 | Caramel Vanilla Latte, Salted Caramel Biscoff, Hazelnut Nutella, etc. |
| Hot Coffee | 7 | Ristretto, Espresso, Doppio, Coffee, Cappuccino, Latte Macchiato, Flat White |
| Ice Tea | 11 | Berry Jasmin, Lemon Honey Ginger, Peach, Mango, Lychee, etc. |
| Mojito | 7 | Blue Ocean, Tokyo Kiwi, Peach Garden, Raspberry, Strawberry, etc. |
| Kids Star | 5 | Unicorn, Strawberry Milk, Chocolate Cloud, Peach Butterfly, Ube Marshmallow |
| Latte Special | 5 | Chai Latte, Matcha Latte, Caramel Latte, Butterscotch Seasalt, Mocha Latte |
| Frappucchino | 4 | Strawberry, Caramel Coffee, Oreo, Matcha |

*Alle producten hebben prijzen, beschikbaarheidsstatus, cafeïne/vegan flags, afbeeldings-URLs en tweetalige vertalingen*

### Toppings (3 items)

| Naam | Prijs |
|------|-------|
| Tapioca | €0.50 |
| Popping Boba | €0.50 |
| Coco Jelly | €0.50 |

### Customization Groups (2 groepen)

**SUGAR_LEVEL** (5 opties):
- No sugar (0%)
- 25% sugar
- 50% sugar
- 75% sugar
- 100% sugar (default)

**ICE_LEVEL** (4 opties):
- No ice
- Less ice
- Normal (default)
- Extra ice

### Rewards (5 items)

| Reward | Punten |
|--------|--------|
| Free Topping | 50 |
| €1 Discount | 100 |
| Free Size Upgrade | 150 |
| €2 Discount | 200 |
| Free Drink | 500 |

### Store Settings

- Opening hours voor alle dagen van de week
- Min pickup time: 15 minuten
- Max advance order days: 7
- Points per euro: 10

### Admin User

- Email: `admin@yibeitea.be`
- Role: SUPER_ADMIN
- Password: `Gonxo5-sevnyj-xuqjiw` (gehasht met bcrypt)

---

## 2. Test Files

**Locatie:** `src/__tests__/`

### auth.test.ts

**Mock Objects:**
- Mock bcrypt module met `compare()` functie
- Mock database met user queries
- Mock user objects:
  - IDs: "user-123", "admin-123", "superadmin-123"
  - Email: "test@example.com", "nonexistent@example.com"
  - Gehashte password: "$2a$10$hashedpassword"
  - Two-factor authentication velden
  - Roles: USER, ADMIN, SUPER_ADMIN

**Mock Sessions:**
- Geldige sessions met user ID en role
- Lege sessions (geen user)
- Session zonder authenticatie

### orders.test.ts

**Mock Database Objects:**
- Mock products:
  - "product-1": prijs €5.50, beschikbaar
  - "product-2": prijs €6.00, beschikbaar
  - Niet-beschikbare producten voor error state testing

**Mock Promo Codes:**
- Code "SAVE10" (10% percentage korting, geldige datums 2020-2030)
- Fixed amount korting (€5.00)
- Promo code met minimum bestelbedeagen

**Mock Orders:**
- Order "order-123" met order number "YBT-TEST-1234"
- Totaal: €15.00
- Payment statuses: PENDING, PAID, CANCELLED

**Test Data:**
- Subtotaal berekeningen: €17.00 (2 × €5.50 + 1 × €6.00)
- Korting berekeningen: €2.00 (10% van €20.00)
- Guest order rate limiting (5 orders per 60 minuten)

### payments.test.ts

**Mock Mollie Payment:**
- Payment ID: "tr_test123"
- Status: "paid"
- Order ID: "order-123"
- Checkout URL: "https://checkout.mollie.com/test"

**Mock Orders:**
- Order ID: "order-123"
- Order Number: "YBT-TEST-1234"
- Totaal: €15.00
- Payment statuses: PENDING, PAID, FAILED

**Mock Loyalty Data:**
- User ID: "user-123"
- Starting points: 100
- Points earned: 150
- Points redeemed: 200
- Loyalty tiers: BRONZE (0-499), SILVER (500-999), GOLD (1000+)

**Mock Loyalty Transaction:**
- ID: "test-uuid-1234"
- Type: ADJUSTMENT
- Description: "Teruggestort: Bestelling order-123 geannuleerd"

### utils.test.ts

**Test Data:**
- Order number format test: "YBT-TIMESTAMP-RANDOM"
- Loyalty tier thresholds:
  - BRONZE: 0-499 punten
  - SILVER: 500-999 punten
  - GOLD: 1000+ punten
- Prijsformattering: €5.50, €10.00 (nl-BE locale)
- Datumformattering: 2026-01-15

### setup.ts

**Mock Implementations:**
- Next.js router mock met functies:
  - `push()`, `replace()`, `prefetch()`
  - `useRouter()`, `useSearchParams()`, `usePathname()`
- Global crypto.randomUUID stub die "test-uuid-1234" retourneert

---

## 3. Test Configuratie

**Locatie:** `vitest.config.ts`

- Test Framework: Vitest
- Environment: jsdom
- Setup files: `./src/__tests__/setup.ts`
- Test file patterns: `src/__tests__/**/*.test.ts`, `src/__tests__/**/*.test.tsx`

---

## 4. Samenvatting

| Categorie | Aantal | Locatie |
|-----------|--------|---------|
| Test Files | 4 | `src/__tests__/` |
| Database Categorieën | 10 | `prisma/seed.ts` |
| Database Producten | 118 | `prisma/seed.ts` |
| Database Toppings | 3 | `prisma/seed.ts` |
| Database Rewards | 5 | `prisma/seed.ts` |
| Customization Groups | 2 | `prisma/seed.ts` |
| Mock User Accounts | 6+ | Test files |
| Mock Orders | 3+ | Test files |
| Mock Promo Codes | 2+ | Test files |
| Mock Payments | 1 | Test files |

---

## 5. Data Organisatie per Doel

**Development/Testing:**
- Seed script vult database met realistische e-commerce data
- Mock data maakt testen mogelijk zonder live APIs
- Test fixtures valideren business logic

**Security Testing:**
- Password hashing demonstraties
- Role-based access control (USER, ADMIN, SUPER_ADMIN)
- Rate limiting mechanismes

**Payment Processing Testing:**
- Mollie payment API mocking
- Order payment status workflows
- Webhook handling scenarios

**Loyalty System Testing:**
- Punten berekeningen
- Tier progressie
- Reward redemptions

---

*Alle mock data wordt uitsluitend gebruikt voor development, testing en initiële database seeding doeleinden. Geen mock data verschijnt in productie-gerichte code.*
