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

### Database Schema (Conceptueel)

```
Users
├── id, email, name, phone
├── password_hash
├── loyalty_points
├── loyalty_tier
└── created_at

Products
├── id, name, description
├── category, price
├── image_url
├── customization_options (JSON)
├── is_available
└── nutritional_info

Orders
├── id, user_id
├── status (pending/preparing/ready/completed)
├── pickup_time
├── total_amount
├── payment_status
└── created_at

OrderItems
├── id, order_id, product_id
├── quantity
├── customizations (JSON)
└── price

LoyaltyTransactions
├── id, user_id
├── points, type (earn/redeem)
└── order_id

Reviews
├── id, user_id, rating
├── comment
└── is_approved
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

### Fase 1: Foundation
- Project setup (Next.js, TypeScript, Tailwind)
- Database schema & Prisma setup
- Internationalisatie setup (next-intl, NL/EN)
- Basis authenticatie
- UI component library setup (shadcn/ui)

### Fase 2: Klant Features
- Homepage redesign
- Interactief menu met filters
- Drink customization interface
- Winkelwagen functionaliteit
- Checkout flow

### Fase 3: Betalingen & Bestellingen
- Mollie integratie (Bancontact, iDEAL, creditcard)
- Order management systeem
- Email notificaties (Resend)
- Bestelling tracking (real-time status updates)

### Fase 4: Admin Dashboard
- Dashboard layout
- Bestelbeheer interface
- Product management
- Basis analytics

### Fase 5: Loyaliteitsprogramma
- Puntensysteem
- Beloningen catalog
- Tier systeem
- Verjaardagsbeloningen

### Fase 6: Polish & Launch
- Performance optimalisatie
- SEO optimalisatie
- Mobile responsiveness
- Testing & bug fixes
- Deployment

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
│   │   ├── shop/               # Shop-specifieke componenten
│   │   └── admin/              # Admin componenten
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

### Voltooide Taken

#### Fase 1: Foundation
- [x] Node.js v24.12.0 LTS geïnstalleerd via winget
- [x] Next.js 14 project setup met TypeScript
- [x] Tailwind CSS configuratie met Yibei Tea branding kleuren
- [x] Prisma schema met volledige database modellen
- [x] next-intl internationalisatie (NL/EN)
- [x] NextAuth.js authenticatie (Google + credentials)
- [x] shadcn/ui componenten (Button, Card, Input, Badge, etc.)
- [x] Zustand cart store voor winkelwagen state

#### Fase 2: Klant Features
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

#### Fase 3: Backend & API
- [x] tRPC setup met type-safe API routes
- [x] Products router (CRUD operaties)
- [x] Orders router (aanmaken, ophalen, status updates)
- [x] Users router (profiel, favorieten, loyaliteit)
- [x] Mollie betaalintegratie
- [x] Mollie webhook handler

#### Fase 4: Admin Dashboard
- [x] Admin dashboard met statistieken
- [x] Bestellingen beheer pagina met status updates

#### Internationalisatie (i18n)
- [x] Volledige NL/EN vertalingen voor alle pagina's
- [x] About pagina vertalingen (missie, waarden, menu preview, bezoek info)
- [x] Contact pagina vertalingen (formulier, succes berichten)
- [x] Footer vertalingen (openingsuren, nieuwsbrief, tagline)
- [x] Homepage vertalingen (alle secties)
- [x] Bestelbevestiging vertalingen

#### Assets & Afbeeldingen
- [x] Logo geïmporteerd (/images/logo.png)
- [x] 9 productafbeeldingen van yibeitea.be (/images/products/)
  - cream-cheese-taro-milk.png
  - caramel-vanilla-latte.png
  - hazelnut-nutella.png
  - green-apple.png
  - strawberry.png
  - taro.png
  - blue-ocean.png
  - peach-garden.png
  - tokyo-kiwi.png

#### Ontwikkelomgeving
- [x] npm dependencies geïnstalleerd (598 packages)
- [x] Prisma client gegenereerd
- [x] .env bestand aangemaakt
- [x] Development server draait op http://localhost:3000

---

### Nog Uit Te Voeren

#### Database & Externe Services
- [ ] Supabase project aanmaken
- [ ] DATABASE_URL configureren in .env
- [ ] `npm run db:push` - Database schema pushen
- [ ] `npm run db:seed` - Producten seeden
- [ ] Mollie account aanmaken en API key configureren
- [ ] Google OAuth credentials configureren (optioneel)
- [ ] Resend API key configureren voor emails

#### Ontbrekende Pagina's
- [ ] Product detail pagina met customization
- [ ] Account bestellingen overzicht
- [ ] Account favorieten pagina
- [ ] Account instellingen pagina
- [ ] Admin producten beheer pagina
- [ ] Admin klanten pagina
- [ ] Admin analytics pagina
- [ ] Privacy & Terms pagina's

#### Functionaliteit
- [x] Echte product afbeeldingen toevoegen (8 top picks van yibeitea.be)
- [ ] Email notificaties bij bestelling
- [ ] Real-time order status updates
- [ ] Loyaliteitspunten uitwisselen voor beloningen
- [ ] Reviews systeem voltooien

#### Fase 6: Polish & Launch
- [ ] Performance optimalisatie
- [ ] SEO meta tags per pagina
- [ ] Mobile testing en fixes
- [ ] Vercel deployment setup
- [ ] Custom domein configureren

---

### Gemaakte Bestanden (50+)

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
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── badge.tsx
│       ├── separator.tsx
│       ├── skeleton.tsx
│       └── textarea.tsx
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── mollie.ts
├── stores/
│   └── cart-store.ts
├── server/trpc/
│   ├── context.ts
│   ├── trpc.ts
│   └── routers/
│       ├── index.ts
│       ├── products.ts
│       ├── orders.ts
│       └── users.ts
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
├── schema.prisma
└── seed.ts

public/
├── images/
│   ├── logo.png
│   └── products/
│       ├── cream-cheese-taro-milk.png
│       ├── caramel-vanilla-latte.png
│       ├── hazelnut-nutella.png
│       ├── green-apple.png
│       ├── strawberry.png
│       ├── taro.png
│       ├── blue-ocean.png
│       ├── peach-garden.png
│       └── tokyo-kiwi.png

Root files:
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── .eslintrc.json
├── .gitignore
├── .env.example
└── .env
```

---

### Snelstart Commando's

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

## 8. Bronnen

- [Bubble Tea Website Examples - Zarla](https://www.zarla.com/guides/bubble-tea-website-examples)
- [Bubble Tea POS Systems - Lingaro](https://www.lingaros.com/pos-systems/restaurant/bubble-tea-pos/)
- [POS System with Loyalty Program - Toki](https://www.buildwithtoki.com/blog-post/pos-system-with-loyalty-program)
- [Customer Loyalty Program Guide - Appstle](https://appstle.com/blog/customer-loyalty-program-guide-for-food-and-beverage-brands/)
- [Restaurant Loyalty Programs - UpMenu](https://www.upmenu.com/blog/restaurant-loyalty-programs/)
