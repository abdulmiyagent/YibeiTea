# Yibei Tea - Website Analyse & Projectplan

## 1. Huidige Situatie Analyse

### Over Yibei Tea
- **Type bedrijf:** Bubble tea shop in Gent, België
- **Producten:** Bubble teas, milk teas, iced teas, iced coffees, mojitos
- **Prijsklasse:** €5.50 - €6.00
- **Locatie:** Sint-Niklaasstraat 36, 9000 Gent
- **Openingsuren:** Ma-Za 11:00-20:00, Zo 10:00-19:00
- **Contact:** 0484/24.06.11 | info@yibeitea.be

### Huidige Website (yibeitea.be)
De huidige website is een eenvoudige single-page informatiewebsite met:
- Menu overzicht met 9 top picks
- Klantenreviews sectie
- Contactinformatie en openingsuren
- Social media links (Instagram, TikTok, Google Maps)
- "Order Now" button (geen echte e-commerce functionaliteit)

### Gemiste Kansen
- Geen online bestelsysteem
- Geen loyaliteitsprogramma
- Geen mogelijkheid tot vooraf bestellen/afhalen
- Geen gepersonaliseerde ervaring
- Geen admin dashboard voor eigenaar

---

## 2. Aanbevolen Functies

### A. Klantgerichte Functies (User Experience)

#### Online Bestelsysteem
- **Drink customization:** Suikerniveau (0%, 25%, 50%, 75%, 100%), ijsniveau, toppings kiezen
- **Winkelwagen functionaliteit**
- **Afhaal tijdslot selectie** (voorkom wachtrijen)
- **Favorieten opslaan** voor terugkerende klanten
- **Herhaalde bestellingen** met één klik

#### Gebruikersaccounts
- Registratie via email of social login (Google/Facebook)
- Bestelgeschiedenis bekijken
- Persoonlijke voorkeuren opslaan
- Push notificaties voor bestellingsstatus

#### Loyaliteitsprogramma
- **Puntensysteem:** Verdien punten per aankoop
- **Beloningen:** Gratis drankjes, korting, exclusieve smaken
- **Verjaardagsbeloning:** Gratis drankje op verjaardag
- **Niveaus:** Bronze → Silver → Gold met toenemende voordelen

#### Menu & Producten
- Volledig interactief menu met filtering (vegan, caffeïnevrij, etc.)
- Seizoensgebonden specials sectie
- Allergenen informatie per product
- Voedingswaarden (calorieën)
- Productfoto's en beschrijvingen

#### Betalingen
- Online betalen: Bancontact, iDEAL, creditcard, PayPal
- Betalen bij afhalen optie
- Cadeaubonnen kopen en inwisselen

### B. Eigenaar Functies (Admin Dashboard)

#### Bestelbeheer
- Real-time bestelling overzicht
- Bestellingsstatus updates (ontvangen → in bereiding → klaar)
- Dagelijkse/wekelijkse/maandelijkse rapporten
- Piekuren analyse

#### Menu Management
- Producten toevoegen/bewerken/verwijderen
- Prijzen aanpassen
- Producten tijdelijk uitschakelen (uitverkocht)
- Seizoensmenu's beheren

#### Klantenbeheer
- Klantdatabase met bestelgeschiedenis
- Loyaliteitspunten beheren
- Gepersonaliseerde promoties versturen
- Reviews modereren

#### Analytics & Rapportage
- Omzet dashboard
- Bestsellers overzicht
- Klant retentie metrics
- Conversie tracking

#### Marketing Tools
- E-mail campagnes naar klanten
- Push notificaties versturen
- Kortingscodes aanmaken
- Social media integratie

---

## 3. Aanbevolen Architectuur

### Architectuur Overzicht

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Klant Website  │  │ Admin Dashboard │                   │
│  │   (Next.js)     │  │   (Next.js)     │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js API Routes / tRPC                │   │
│  │  • Authentication  • Orders  • Products  • Users     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   PostgreSQL    │  │     Prisma      │                   │
│  │   (Supabase)    │  │     (ORM)       │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Mollie  │ │ Resend   │ │Cloudinary│ │  Vercel  │       │
│  │(Payments)│ │ (Email)  │ │ (Images) │ │ (Hosting)│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema (Geïmplementeerd)

Het Prisma schema is uitgebreid met de volgende modellen:

```
Users
├── id, email, name, phone, dateOfBirth
├── role (USER, ADMIN, SUPER_ADMIN)
├── loyaltyPoints, loyaltyTier (BRONZE, SILVER, GOLD)
├── preferredLanguage
├── twoFactorSecret, twoFactorEnabled  (2FA ondersteuning)
└── relations: accounts, sessions, orders, reviews, favorites, addresses

Address (nieuw)
├── id, userId, name
├── street, city, postalCode, country
└── isDefault

Products
├── id, slug, categoryId, price
├── imageUrl, isAvailable, isFeatured
├── calories, caffeine, vegan
└── relations: translations, customizationOptions, customizationConfigs

CustomizationGroup (nieuw - data-driven)
├── id, type (SUGAR_LEVEL, ICE_LEVEL, SIZE, MILK_TYPE)
├── isActive, sortOrder
└── values: CustomizationValue[]

CustomizationValue (nieuw)
├── id, groupId, value
├── priceModifier, isDefault, isAvailable
└── translations: CustomizationValueTranslation[]

Orders
├── id, orderNumber, userId
├── status, paymentStatus
├── subtotal, discount, total
├── pointsEarned, pointsRedeemed
├── pickupTime, notes
└── items: OrderItem[]

OrderItem
├── id, orderId, productId, quantity
├── unitPrice, totalPrice
└── customizations (JSON)

LoyaltyTransaction
├── id, userId, orderId
├── type (EARN, REDEEM, BONUS, EXPIRE, ADJUSTMENT)
├── points, description

Reward (nieuw)
├── id, slug, pointsCost
├── rewardType, rewardValue
└── translations

PromoCode (nieuw)
├── id, code, discountType, discountValue
├── minOrderAmount, maxUses, usedCount
└── validFrom, validUntil, isActive

StoreSettings (nieuw)
├── openingHours (JSON)
├── minPickupMinutes, maxAdvanceOrderDays
└── pointsPerEuro
```

---

## 4. Aanbevolen Tech Stack

### Frontend
| Technologie | Doel | Reden |
|-------------|------|-------|
| **Next.js 14+** | Framework | SSR, App Router, optimale SEO, full-stack mogelijkheden |
| **TypeScript** | Taal | Type safety, betere developer experience |
| **Tailwind CSS** | Styling | Snelle development, consistent design |
| **shadcn/ui** | UI Components | Moderne, toegankelijke componenten |
| **React Query** | Data fetching | Caching, optimistic updates |
| **Zustand** | State management | Lichtgewicht, eenvoudig voor winkelwagen |

### Backend
| Technologie | Doel | Reden |
|-------------|------|-------|
| **Next.js API Routes** | API | Unified codebase, serverless |
| **tRPC** | API layer | End-to-end type safety |
| **Prisma** | ORM | Type-safe database queries |
| **NextAuth.js** | Authenticatie | Flexibel, social logins |

### Database & Infrastructure
| Technologie | Doel | Reden |
|-------------|------|-------|
| **Supabase** | Database (PostgreSQL) | Gratis tier, real-time, auth built-in |
| **Vercel** | Hosting | Gratis tier, optimaal voor Next.js |
| **Cloudinary** | Afbeeldingen | CDN, optimalisatie, gratis tier |

### Betalingen & Communicatie
| Technologie | Doel | Reden |
|-------------|------|-------|
| **Mollie** | Betalingen | Populair in Benelux, Bancontact/iDEAL/creditcard, Nederlandse support |
| **Resend** | Transactionele emails | Developer-friendly, gratis tier |

### Internationalisatie
| Technologie | Doel | Reden |
|-------------|------|-------|
| **next-intl** | i18n | Beste Next.js App Router integratie |
| **NL + EN** | Talen | Bereik lokale + internationale klanten in Gent |

### Development Tools
| Technologie | Doel |
|-------------|------|
| **ESLint + Prettier** | Code quality |
| **Husky** | Git hooks |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |

---

## 5. Project Fasen

### Fase 1: Foundation ✅
- Project setup (Next.js, TypeScript, Tailwind)
- Database schema & Prisma setup
- Internationalisatie setup (next-intl, NL/EN)
- Basis authenticatie
- UI component library setup (shadcn/ui)

### Fase 2: Klant Features 🔄
- Homepage redesign ✅
- Interactief menu met filters ✅
- Drink customization interface ✅
- Winkelwagen functionaliteit ✅
- Checkout flow ✅

### Fase 3: Betalingen & Bestellingen 🔄
- Mollie integratie (Bancontact, iDEAL, creditcard) ✅
- Order management systeem ✅
- Email notificaties (Resend) ⏳
- Bestelling tracking (real-time status updates) ⏳

### Fase 4: Admin Dashboard 🔄
- Dashboard layout ✅
- Bestelbeheer interface ✅
- Product management ⏳
- Basis analytics ⏳

### Fase 5: Loyaliteitsprogramma ⏳
- Puntensysteem ⏳
- Beloningen catalog ⏳
- Tier systeem ⏳
- Verjaardagsbeloningen ⏳

### Fase 6: Polish & Launch ⏳
- Performance optimalisatie ⏳
- SEO optimalisatie ⏳
- Mobile responsiveness ⏳
- Testing & bug fixes ⏳
- Deployment ⏳

---

## 6. Projectstructuur

```
yibei-tea/
├── src/
│   ├── app/
│   │   └── [locale]/           # i18n routing (nl/en)
│   │       ├── (shop)/         # Klant-facing pages
│   │       │   ├── page.tsx    # Homepage
│   │       │   ├── menu/       # Menu pagina
│   │       │   ├── cart/       # Winkelwagen
│   │       │   ├── checkout/   # Checkout
│   │       │   └── account/    # Gebruikersaccount
│   │       └── admin/          # Admin dashboard
│   │           ├── orders/     # Bestelbeheer
│   │           ├── products/   # Productbeheer
│   │           ├── customers/  # Klantenbeheer
│   │           └── analytics/  # Rapportages
│   ├── components/             # React componenten
│   │   ├── ui/                 # shadcn/ui componenten
│   │   ├── products/           # Product componenten (NIEUW)
│   │   ├── shop/               # Shop-specifieke componenten
│   │   └── admin/              # Admin componenten
│   ├── hooks/                  # Custom React hooks (NIEUW)
│   ├── stores/                 # Zustand stores (NIEUW)
│   ├── lib/                    # Utilities
│   │   ├── db.ts               # Prisma client
│   │   ├── auth.ts             # NextAuth config
│   │   └── mollie.ts           # Mollie config
│   ├── server/                 # Server-side code
│   │   ├── api/                # API routes
│   │   └── trpc/               # tRPC routers
│   ├── i18n/                   # Internationalisatie
│   │   ├── nl.json             # Nederlandse vertalingen
│   │   └── en.json             # Engelse vertalingen
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
└── package.json
```

---

## 7. Implementatie Status

### ✅ Gedane Wijzigingen / Beslissingen

#### Fase 1: Foundation (VOLTOOID)
- [x] Node.js v24.12.0 LTS geïnstalleerd via winget
- [x] Next.js 14 project setup met TypeScript
- [x] Tailwind CSS configuratie met Yibei Tea branding kleuren
- [x] Prisma schema met volledige database modellen
- [x] next-intl internationalisatie (NL/EN)
- [x] NextAuth.js authenticatie (Google + credentials)
- [x] shadcn/ui componenten (Button, Card, Input, Badge, etc.)
- [x] Zustand cart store voor winkelwagen state

#### Fase 2: Klant Features (VOLTOOID)
- [x] Homepage met hero, features, producten en reviews
- [x] Homepage "Onze Favorieten" met echte productafbeeldingen van yibeitea.be
- [x] Menu pagina met filters (vegan, cafeïnevrij, categorie)
- [x] Winkelwagen pagina met promo codes
- [x] Checkout flow (3 stappen: gegevens, afhalen, betaling)
- [x] Login/Registratie pagina
- [x] Account pagina met loyaliteitspunten overzicht
- [x] Bestelbevestiging pagina
- [x] Over Ons pagina met complete merkverhaal (missie, waarden, menu preview)
- [x] Contact pagina met formulier en locatie-info

#### Fase 3: Backend & API (VOLTOOID)
- [x] tRPC setup met type-safe API routes
- [x] Products router (CRUD operaties)
- [x] Orders router (aanmaken, ophalen, status updates)
- [x] Users router (profiel, favorieten, loyaliteit)
- [x] Mollie betaalintegratie
- [x] Mollie webhook handler

#### Fase 4: Admin Dashboard (DEELS)
- [x] Admin dashboard met statistieken
- [x] Bestellingen beheer pagina met status updates

#### Internationalisatie (i18n) (VOLTOOID)
- [x] Volledige NL/EN vertalingen voor alle pagina's
- [x] About pagina vertalingen (missie, waarden, menu preview, bezoek info)
- [x] Contact pagina vertalingen (formulier, succes berichten)
- [x] Footer vertalingen (openingsuren, nieuwsbrief, tagline)
- [x] Homepage vertalingen (alle secties)
- [x] Bestelbevestiging vertalingen

#### Assets & Afbeeldingen (VOLTOOID)
- [x] Logo geïmporteerd (/images/logo.png)
- [x] 45 product SVG illustraties (/images/products/)
- [x] Placeholder images toegevoegd aan alle 64 producten in seed.ts

#### Ontwikkelomgeving (VOLTOOID)
- [x] npm dependencies geïnstalleerd (598 packages)
- [x] Prisma client gegenereerd
- [x] .env bestand aangemaakt
- [x] Development server draait op http://localhost:3000

---

### 🆕 Recente Wijzigingen (Uncommitted)

#### Database Schema Uitbreidingen
> **📱 App-ready:** Het uitgebreide data model is platform-agnostisch ontworpen. Dezelfde API en data-structuren kunnen hergebruikt worden voor iOS/Android apps via de bestaande tRPC endpoints.

- [x] **User model uitgebreid:**
  - `role` enum (USER, ADMIN, SUPER_ADMIN)
  - `loyaltyTier` enum (BRONZE, SILVER, GOLD)
  - 2FA ondersteuning (`twoFactorSecret`, `twoFactorEnabled`, `twoFactorVerified`)
  - `dateOfBirth` voor verjaardagsbeloningen
  - `preferredLanguage` voor i18n voorkeuren

- [x] **Address model (nieuw):** Meerdere afleveradressen per gebruiker

- [x] **Data-driven Customization System (nieuw):**
  - `CustomizationGroup` - Groepen (suiker, ijs, maat, melktype)
  - `CustomizationValue` - Opties per groep met prijsmodifier
  - `CustomizationValueTranslation` - NL/EN vertalingen
  - `ProductCustomizationConfig` - Per-product configuratie
  > **📱 App-ready:** Customization opties komen uit de database, niet hardcoded. Dit maakt het eenvoudig om dezelfde opties in een native app te tonen.

- [x] **Loyalty & Rewards (nieuw):**
  - `LoyaltyTransaction` - Punten verdienen/inwisselen tracking
  - `Reward` model met vertalingen

- [x] **E-commerce uitbreidingen (nieuw):**
  - `PromoCode` - Kortingscodes met validatie
  - `StoreSettings` - Openingsuren, pickup instellingen, punten per euro
  - `Order` uitgebreid met `pointsEarned`, `pointsRedeemed`

#### Nieuwe Componenten
> **📱 App-ready:** Componenten zijn gebouwd met Zustand stores en tRPC queries. De business logic in stores en API calls kan 1-op-1 hergebruikt worden in React Native.

- [x] **ProductModal** (`src/components/products/product-modal.tsx`)
  - Volledige customization dialog (suiker, ijs, toppings)
  - Dynamische prijsberekening met modifiers
  - Quantity selector
  - Add to cart integratie

- [x] **ProductQuickCustomize** (`src/components/products/product-quick-customize.tsx`)
  - Compacte popover voor snelle customization
  - Geïntegreerd op menu pagina
  > **📱 App-ready:** Op mobile apps zou dit een bottom sheet worden - de state logic blijft identiek.

- [x] **UI Componenten (shadcn/ui):**
  - Dialog component
  - Popover component

#### Nieuwe Hooks
> **📱 App-ready:** Zustand stores werken ook in React Native. De `useProductModal` en `useCartStore` kunnen direct hergebruikt worden.

- [x] **useProductModal** (`src/hooks/use-product-modal.ts`)
  - Zustand store voor modal state
  - `openModal(slug)`, `closeModal()` actions

- [x] **useLongPress** (`src/hooks/use-long-press.ts`)
  - Touch gesture support voor mobile
  > **📱 App-ready:** Long press is een standaard mobile interactie pattern.

#### Nieuwe Stores
- [x] **Cart Store** (`src/stores/cart-store.ts`)
  - Zustand met localStorage persistence
  - Items met customizations (sugarLevel, iceLevel, toppings)
  - Promo code ondersteuning
  - `addItem`, `removeItem`, `updateQuantity`, `clearCart`
  - Computed: `getItemCount()`, `getSubtotal()`, `getTotal()`
  > **📱 App-ready:** Voor native apps kan AsyncStorage i.p.v. localStorage gebruikt worden met dezelfde API.

#### Nieuwe tRPC Routers
- [x] **Customizations Router** (`src/server/trpc/routers/customizations.ts`)
  - `getAll` - Publieke endpoint voor customization opties
  - `getAllAdmin` - Admin view inclusief inactieve
  - `updateGroup` - Admin: groep instellingen wijzigen
  - `createValue` / `updateValue` / `deleteValue` - Admin CRUD
  - `reorderValues` - Admin: volgorde aanpassen
  > **📱 App-ready:** tRPC endpoints zijn ook bereikbaar vanuit React Native via `@trpc/react-query`.

#### Seed Data Uitbreidingen
- [x] Customization groups toegevoegd:
  - SUGAR_LEVEL: 0%, 25%, 50%, 75%, 100% (default)
  - ICE_LEVEL: Geen, Weinig, Normaal (default), Extra
- [x] Vertalingen voor alle customization waarden (NL/EN)
- [x] StoreSettings met openingsuren

---

### ✅ Recent Voltooid (Sessie 5 jan 2026)

#### Database & Infrastructuur
- [x] **Database migratie uitvoeren** - Schema was al in sync
- [x] **Database opnieuw seeden** - 64 producten, 10 categorieën, customization groups
- [x] **Supabase project gekoppeld** - DATABASE_URL geconfigureerd
- [x] **Favicon toegevoegd** - Logo als `src/app/icon.png`
- [x] **Hydration error gefixed** - Cart count in header met mounted state

#### Product Customization Flow (Intercepting Routes)
- [x] **ProductCustomization shared component** - Alle business logic op één plek
- [x] **Modal shell** - `@modal/(.)menu/[slug]` met server-side data fetching
- [x] **Product detail page** - `/menu/[slug]` voor directe links & SEO
- [x] **Menu pagina: klik opent modal** - Link navigatie i.p.v. direct add-to-cart
- [x] **Layout updated** - `{modal}` parallel route slot toegevoegd

---

### ⏳ Openstaande To-Do's

#### Prioriteit 1: Mollie Betalingen Configureren
- [ ] **Mollie account aanmaken** op mollie.com
- [ ] **API key toevoegen** in `.env` (MOLLIE_API_KEY)
- [ ] **Test betaling uitvoeren** via checkout flow

#### Prioriteit 2: Cart & Checkout Verbeteren
- [ ] **Cart drawer/sidebar implementeren**
  - Slide-in panel vanuit header cart icon
  - Snelle toegang zonder pagina navigatie
  > **📱 App-ready:** In native apps wordt dit een bottom sheet of modal.

- [ ] **Cart items tonen met customizations**
  - Suikerniveau, ijsniveau, toppings weergeven
  - Edit mogelijkheid (terug naar customization)

- [ ] **Checkout flow: customizations meesturen**
  - OrderItem.customizations correct vullen bij bestelling

#### Prioriteit 3: Admin Dashboard Uitbreiden
- [ ] **Admin producten beheer pagina**
  - CRUD voor producten
  - Vertalingen beheren (NL/EN)
  - Beschikbaarheid toggles

- [ ] **Admin customizations beheer**
  - UI voor CustomizationGroup/Value management
  - Drag & drop reordering

- [ ] **Admin klanten pagina**
  - Klantenoverzicht met bestelgeschiedenis
  - Loyaliteitspunten handmatig aanpassen

- [ ] **Admin analytics pagina**
  - Omzet grafieken
  - Populaire producten
  - Piekuren analyse

#### Prioriteit 4: Loyaliteitsprogramma Activeren
- [ ] **Punten verdienen bij bestelling**
  - Na betaling: LoyaltyTransaction aanmaken
  - pointsPerEuro uit StoreSettings gebruiken

- [ ] **Punten inwisselen**
  - UI voor rewards selectie
  - Korting toepassen op checkout

- [ ] **Tier upgrades**
  - Automatische upgrade bij puntendrempel
  - Notificatie aan gebruiker

- [ ] **Verjaardagsbeloning**
  - Cronjob/scheduled function voor automatische toekenning

#### Prioriteit 5: Communicatie & Notificaties
- [ ] **Resend API configureren**
  - API key in .env

- [ ] **Email templates maken:**
  - Bestelbevestiging
  - Bestelling klaar voor afhalen
  - Wachtwoord reset
  - Verjaardagsbeloning

- [ ] **Push notificaties** (optioneel)
  - Web push voor order status updates

#### Prioriteit 6: Polish & Launch
- [ ] **Performance optimalisatie**
  - Image optimization
  - Code splitting
  - Lighthouse audit

- [ ] **SEO optimalisatie**
  - Meta tags per pagina
  - Structured data (JSON-LD)
  - Sitemap genereren

- [ ] **Mobile testing**
  - Touch targets
  - Responsive breakpoints
  - Gesture support

- [ ] **Vercel deployment**
  - Environment variables instellen
  - Custom domein koppelen

#### Nog Niet Gepland
- [ ] Privacy & Terms pagina's
- [ ] Reviews systeem voltooien
- [ ] Cadeaubonnen functionaliteit
- [ ] Social login (Google OAuth)

---

### Gemaakte Bestanden (60+)

```
src/
├── app/
│   ├── globals.css
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── trpc/[trpc]/route.ts
│   │   └── webhooks/mollie/route.ts
│   └── [locale]/
│       ├── layout.tsx
│       ├── page.tsx (Homepage)
│       ├── about/page.tsx (Over Ons - compleet merkverhaal)
│       ├── contact/page.tsx (Contact met formulier)
│       ├── menu/page.tsx
│       ├── cart/page.tsx
│       ├── checkout/page.tsx
│       ├── login/page.tsx
│       ├── account/page.tsx
│       ├── order/confirmation/page.tsx
│       └── admin/
│           ├── page.tsx (Dashboard)
│           └── orders/page.tsx
├── components/
│   ├── providers.tsx
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── language-switcher.tsx
│   ├── products/                          # NIEUW
│   │   ├── product-modal.tsx
│   │   └── product-quick-customize.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── badge.tsx
│       ├── separator.tsx
│       ├── skeleton.tsx
│       ├── textarea.tsx
│       ├── dialog.tsx                     # NIEUW
│       └── popover.tsx                    # NIEUW
├── hooks/                                 # NIEUW
│   ├── use-product-modal.ts
│   └── use-long-press.ts
├── stores/                                # NIEUW
│   └── cart-store.ts
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── mollie.ts
├── server/trpc/
│   ├── context.ts
│   ├── trpc.ts
│   └── routers/
│       ├── index.ts
│       ├── products.ts
│       ├── orders.ts
│       ├── users.ts
│       ├── toppings.ts
│       ├── categories.ts
│       ├── two-factor.ts
│       └── customizations.ts              # NIEUW
├── i18n/
│   ├── request.ts
│   ├── navigation.ts
│   └── messages/
│       ├── nl.json
│       └── en.json
├── types/
│   └── next-auth.d.ts
└── middleware.ts

prisma/
├── schema.prisma                          # UITGEBREID
└── seed.ts                                # UITGEBREID

public/
├── images/
│   ├── logo.png
│   └── products/           # 45 SVG product illustraties
│       ├── boba-milk-tea.svg, boba-coffee.svg, matcha-milk.svg, ...
│       ├── cream-cheese-*.svg (4 varianten)
│       ├── ice-tea-*.svg (5 varianten)
│       ├── mojito-*.svg (6 varianten)
│       ├── iced-*.svg, hot-*.svg (7 koffie varianten)
│       ├── kids-*.svg (3 varianten)
│       ├── latte-*.svg (2 varianten)
│       └── frappuccino-*.svg (4 varianten)

Root files:
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── .eslintrc.json
├── .gitignore
├── .env.example
├── .env
└── PROJECTPLAN.md
```

---

## 8. App-Readiness Overwegingen

> De website is opgezet als **inspiratie én potentiële basis** voor toekomstige iOS/Android apps. De volgende architectuurkeuzes ondersteunen dit:

### ✅ Wat al app-ready is

| Aspect | Web Implementatie | App Herbruikbaarheid |
|--------|-------------------|---------------------|
| **API Layer** | tRPC endpoints | Direct bruikbaar via `@trpc/react-query` in React Native |
| **State Management** | Zustand stores | Werkt identiek in React Native |
| **Data Models** | Prisma schema | Platform-agnostisch, API responses zijn JSON |
| **Customization Logic** | Data-driven (uit DB) | Geen hardcoded UI, flexibel voor native componenten |
| **Cart Logic** | `cart-store.ts` | Kan AsyncStorage gebruiken i.p.v. localStorage |
| **Auth Flow** | NextAuth.js | API sessions werken ook voor native clients |
| **i18n** | `next-intl` messages | JSON bestanden herbruikbaar in `i18n-js` voor RN |

### 🎯 Aandachtspunten voor App Ontwikkeling

1. **Bottom Sheets**: Web popovers → native bottom sheets
2. **Navigation**: Next.js routing → React Navigation
3. **Push Notifications**: Web push → Firebase Cloud Messaging
4. **Offline Support**: Zustand persist → MMKV/AsyncStorage met offline queue
5. **Payment**: Mollie web → Mollie mobile SDK of deep links
6. **Biometrics**: N/A → TouchID/FaceID voor 2FA

### 📱 Componenten met App-Equivalent

| Web Component | Potentieel Native Equivalent |
|---------------|------------------------------|
| `ProductModal` | Full-screen modal met gestures |
| `ProductQuickCustomize` | Bottom sheet |
| `CartDrawer` (nog te maken) | Tab navigator cart screen |
| `LanguageSwitcher` | Settings screen picker |

---

## 9. Snelstart Commando's

```bash
# Development server starten
npm run dev

# Database schema pushen (na Supabase setup)
npm run db:push

# Database seeden met producten
npm run db:seed

# Prisma Studio (database GUI)
npm run db:studio

# Build voor productie
npm run build

# Productie server
npm start
```

---

## 10. Bronnen

- [Bubble Tea Website Examples - Zarla](https://www.zarla.com/guides/bubble-tea-website-examples)
- [Bubble Tea POS Systems - Lingaro](https://www.lingaros.com/pos-systems/restaurant/bubble-tea-pos/)
- [POS System with Loyalty Program - Toki](https://www.buildwithtoki.com/blog-post/pos-system-with-loyalty-program)
- [Customer Loyalty Program Guide - Appstle](https://appstle.com/blog/customer-loyalty-program-guide-for-food-and-beverage-brands/)
- [Restaurant Loyalty Programs - UpMenu](https://www.upmenu.com/blog/restaurant-loyalty-programs/)
