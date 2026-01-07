# Yibei Tea - Project Documentation

> **Version:** 1.2.0
> **Last Updated:** 2026-01-07
> **Status:** Production Ready
> **Repository:** github.com/abdulmiyagent/YibeiTea

---

## TL;DR

**Wat:** Online bestelplatform voor Yibei Tea, een bubble tea shop in Gent.

**Stack:** Next.js 14 + TypeScript + Tailwind + tRPC + Prisma + Supabase

**Status:** Meer dan MVP. Productie-klaar met betalingen (Mollie), e-mail (Brevo), loyaliteitspunten, promotiecode systeem, newsletter campaigns, GDPR compliance en admin dashboard. Juridisch gereviewed.

**Key beslissingen:**
- Horizontale compacte kaarten op menu (6-7 items zichtbaar per scherm)
- Intercepting route modals voor product customization
- Data-driven customization (database, niet hardcoded)
- Zustand voor state (voorbereiding React Native app)

---

## 1. Project Overview

### What is Yibei Tea?
A **web-based ordering platform** for Yibei Tea, a bubble tea shop in Ghent, Belgium. The platform enables customers to browse the menu, customize drinks, and place pickup orders online.

### Business Context
| Attribute | Value |
|-----------|-------|
| Business Type | Bubble tea shop (physical location) |
| Location | Sint-Niklaasstraat 36, 9000 Gent |
| Opening Hours | Mon-Sat 11:00-20:00, Sun 10:00-19:00 |
| Price Range | €5.00 - €6.00 |
| Product Count | 64 drinks across 10 categories |

### Project Goals
1. Enable online ordering with drink customization
2. Reduce in-store wait times via pickup scheduling
3. Build customer loyalty through points system
4. Provide admin tools for order and product management
5. Prepare architecture for future native mobile app

---

## 2. Product Scope & Non-Goals

### In Scope (MVP)
- [x] Online menu with filtering (vegan, caffeine-free, category)
- [x] Drink customization (sugar level, ice level, toppings)
- [x] Shopping cart with persistence
- [x] User accounts with order history
- [x] Checkout flow with pickup time selection
- [x] Admin dashboard for orders
- [x] Payment processing (Mollie)
- [x] Email notifications (Brevo)
- [x] Loyalty points system (earning on order)

### In Scope (Post-MVP)
- ~~Admin product management (CRUD)~~ ✅ Done
- ~~Admin analytics dashboard~~ ✅ Done
- ~~Rewards redemption~~ ✅ Done (checkout integration)
- ~~Promo code system~~ ✅ Done
- ~~Newsletter campaigns~~ ✅ Done (Brevo integration)
- ~~GDPR compliance~~ ✅ Done (data export, account deletion, consent tracking)
- ~~Google OAuth login~~ ✅ Done
- Birthday rewards automation

### Explicitly Out of Scope
| Feature | Reason |
|---------|--------|
| Delivery | Business model is pickup-only |
| Table reservations | Not applicable to bubble tea shop |
| Multi-location support | Single location business |
| Inventory management | Handled separately by business |
| POS integration | Not requested |

---

## 3. Target Users & Use Cases

### Primary Users

**1. Repeat Customers (60-70% of traffic)**
- Know what they want
- Expect fast ordering (<30 seconds)
- Value saved preferences and order history

**2. New Customers (Discovery Mode)**
- Browse menu to explore options
- Need visual cues and descriptions
- May filter by dietary preferences

**3. Store Owner/Admin**
- View and manage incoming orders
- Update product availability
- Track sales and popular items

### Key User Flows

```
New Customer Flow:
Menu → Browse → Select Product → Customize → Add to Cart → Checkout → Payment → Confirmation

Repeat Customer Flow:
Menu → Find Favorite → Quick Add → Cart → Checkout → Payment → Confirmation

Admin Flow:
Dashboard → View Orders → Update Status (Preparing → Ready) → Customer Notified
```

---

## 4. UX/UI Decisions

### Design System

**Decision:** Glassmorphic design language with tea-inspired color palette.

**Reason:** Appeals to young, visually-conscious target demographic while maintaining professionalism.

**Implementation:**
- Primary: `tea-600` (#9B7B5B) - warm brown
- Accent: `matcha-500` - green for vegan indicators
- Glass effects: `bg-white/90 backdrop-blur-xl border-white/30`
- Animations: `animate-in fade-in zoom-in-95`

---

### Menu Page: Horizontal Compact List

**Decision:** Use horizontal list cards (thumbnail left, info right) instead of grid cards.

**Reason:** UX research showed original grid cards (~300px height) displayed only 1.5-2 items per mobile screen. Industry benchmarks (Starbucks, Heytea) show 4-7 items.

**Implementation:**
- Card height: ~80px
- Thumbnail: 64x64px
- Gap: 12px
- Items visible per screen: 6-7

**Implication:** Faster browsing, reduced scroll fatigue, aligns with repeat-customer optimization.

---

### Product Customization: Intercepting Route Modal

**Decision:** Product customization opens in a floating modal (intercepting route) rather than navigating to a new page.

**Reason:** Maintains browsing context, faster interaction, industry-standard pattern for food ordering.

**Implementation:**
- Route: `@modal/(.)menu/[slug]`
- Fallback page: `/menu/[slug]` for direct links and SEO
- Close: Click outside, Escape key, or X button

**Implication:** SEO preserved via static pages, UX improved via modal overlay.

---

### Cart: Slide-in Drawer

**Decision:** Cart accessible via slide-in drawer from header icon, not separate page navigation.

**Reason:** Reduces friction, keeps user on menu page, standard pattern in food ordering apps.

**Implementation:**
- Trigger: Cart icon in header
- Animation: Slide from right
- Features: Quantity controls, customization badges, scroll lock

---

## 5. Technical Architecture

### Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 14 (App Router) + TypeScript + Tailwind CSS        │
│  UI: shadcn/ui | State: Zustand | Data: tRPC + React Query  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  Next.js API Routes + tRPC | Auth: NextAuth.js              │
│  ORM: Prisma | Database: PostgreSQL (Supabase)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  Payments: Mollie | Email: Brevo | Hosting: Vercel          │
└─────────────────────────────────────────────────────────────┘
```

### Technology Choices

| Layer | Technology | Decision Rationale |
|-------|------------|-------------------|
| Framework | Next.js 14 | SSR, App Router, full-stack, optimal for SEO |
| Language | TypeScript | Type safety, better DX, fewer runtime errors |
| Styling | Tailwind CSS | Rapid development, consistent design tokens |
| Components | shadcn/ui | Accessible, customizable, no lock-in |
| State | Zustand | Lightweight, works with React Native |
| API | tRPC | End-to-end type safety, great DX |
| Database | Supabase (PostgreSQL) | Free tier, hosted, real-time capable |
| ORM | Prisma | Type-safe queries, migrations, studio |
| Auth | NextAuth.js | Flexible, supports social login |
| i18n | next-intl | Best App Router integration |
| Payments | Mollie | Benelux focus, Bancontact/iDEAL support |
| Email | Brevo | EU-based (France), GDPR native, 300/day free |
| Hosting | Vercel | Optimal for Next.js, free tier |

---

## 6. Data & Backend

### Database Schema (Core Models)

```
User
├── id, email, name, phone, dateOfBirth
├── role: USER | ADMIN | SUPER_ADMIN
├── loyaltyPoints, loyaltyTier: BRONZE | SILVER | GOLD
└── relations: orders, favorites, addresses

Product
├── id, slug, categoryId, price
├── imageUrl, isAvailable, isFeatured
├── calories, caffeine, vegan
├── allowSugarCustomization, allowIceCustomization, allowToppings
└── relations: translations, category

Category
├── id, slug, sortOrder, isActive
└── relations: translations, products

CustomizationGroup (Data-Driven)
├── id, type: SUGAR_LEVEL | ICE_LEVEL | SIZE | MILK_TYPE
├── isActive, sortOrder
└── values: CustomizationValue[]

CustomizationValue
├── id, groupId, value, priceModifier
├── isDefault, isAvailable
└── translations[]

Order
├── id, orderNumber, userId, status
├── paymentStatus, subtotal, discount, total
├── pointsEarned, pointsRedeemed, pickupTime
└── items: OrderItem[]

OrderItem
├── id, orderId, productId, quantity
├── unitPrice, totalPrice
└── customizations: JSON

Topping
├── id, slug, price, isAvailable
└── translations[]
```

### Data-Driven Customization

**Decision:** Customization options (sugar levels, ice levels, toppings) are stored in the database, not hardcoded.

**Reason:** Allows admin to modify options without code changes. Essential for future native app (single source of truth).

**Current Options:**
- Sugar: 0%, 25%, 50%, 75%, 100% (default)
- Ice: None, Less, Normal (default), Extra
- Toppings: Tapioca Pearls (+€0.50), Coconut Jelly (+€0.50), Aloe Vera (+€0.50)

---

## 7. Frontend Structure

### Route Structure

```
src/app/[locale]/
├── page.tsx                    # Homepage
├── menu/
│   ├── page.tsx               # Menu listing (compact horizontal cards)
│   └── [slug]/page.tsx        # Product detail (SEO fallback)
├── @modal/(.)menu/[slug]/     # Intercepting route modal
├── cart/page.tsx              # Full cart page
├── checkout/page.tsx          # 3-step checkout
├── account/page.tsx           # User dashboard
├── login/page.tsx             # Auth
├── about/page.tsx             # Brand story
├── contact/page.tsx           # Contact form
├── order/confirmation/page.tsx # Post-payment
└── admin/
    ├── page.tsx               # Admin dashboard
    └── orders/page.tsx        # Order management
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| ProductCustomization | `components/products/` | Shared customization UI (modal + page) |
| CartDrawer | `components/cart/` | Slide-in cart panel |
| Header | `components/layout/` | Navigation, cart icon, user menu |
| LanguageSwitcher | `components/layout/` | NL/EN toggle |

### State Management

**Cart Store** (`stores/cart-store.ts`)
- Zustand with localStorage persistence
- Actions: addItem, removeItem, updateQuantity, clearCart
- Selectors: getItemCount, getSubtotal, getTotal

**Decision:** Zustand over Redux/Context for cart state.

**Reason:** Lightweight, no boilerplate, works identically in React Native.

---

## 8. Key Decisions & Rationale

### Architecture Decisions

| Decision | Reason | Implication |
|----------|--------|-------------|
| Monorepo (Next.js full-stack) | Simpler deployment, shared types | Single Vercel project |
| tRPC over REST | Type safety, no API schema maintenance | Faster development |
| Supabase over self-hosted | Managed service, free tier sufficient | Vendor dependency |
| Intercepting routes for modals | UX + SEO balance | More complex routing |

### UX Decisions

| Decision | Reason | Implication |
|----------|--------|-------------|
| Horizontal list cards | Better mobile scannability | Different from typical grid |
| No product description on card | Progressive disclosure | Details in modal |
| Glassmorphic modals | Modern aesthetic for young audience | Requires backdrop-blur support |
| Dutch as default language | Primary market is Flanders | URL structure: /nl/, /en/ |

### Business Decisions

| Decision | Reason | Implication |
|----------|--------|-------------|
| Pickup only (no delivery) | Matches current business model | Simpler logistics |
| Loyalty tiers (Bronze/Silver/Gold) | Encourage repeat purchases | Requires points tracking |
| Admin-managed promo codes | Marketing flexibility | No user-generated codes |

---

## 9. Risks & Dependencies

### External Dependencies

| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| Supabase (Database) | Medium | Free tier limits; upgrade path available. EU datacenter (Frankfurt). |
| Vercel (Hosting) | Low | Standard Next.js deployment; easy to migrate. DPA available. |
| Mollie (Payments) | Low | Netherlands-based (EU). PCI-DSS certified. |
| Brevo (Email) | Low | France-based (EU). Native GDPR compliance, no SCCs needed. |
| Google OAuth | Low | Optional login method; SCCs via Google DPA. |

### GDPR/Legal Compliance

| Requirement | Implementation |
|-------------|----------------|
| Data export (Art. 20) | Account settings → Download data (JSON) |
| Account deletion (Art. 17) | Account settings → Delete account (email confirmation required) |
| Newsletter consent (Art. 7) | Opt-in default OFF, explicit toggle required |
| Consent tracking | Timestamp + IP stored on newsletter signup |
| International transfers | SCCs with US-based processors (Google, Vercel) |
| Privacy Policy | /privacy page (NL/EN), lists all processors |
| Terms of Service | /terms page (NL/EN), Belgian law |

**Legal documentation:** See `docs/` folder for legal advisor materials.

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase free tier exceeded | High | Low | Monitor usage; upgrade plan if needed |
| Next.js breaking changes | Medium | Medium | Pin versions; test before upgrading |
| Browser compatibility (backdrop-blur) | Low | Low | Fallback solid backgrounds |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption | High | Marketing plan; in-store promotion |
| Payment failures | High | Comprehensive error handling; manual order option |
| Peak time overload | Medium | Pickup time slot limits; queue management |

---

## 10. Open Questions & Future Ideas

### Open Questions
- [ ] What are the exact loyalty point thresholds for tier upgrades?
- [ ] Should seasonal menu items have an expiry date in the database?
- [ ] Integration with existing POS system needed?

### Future Ideas (Not Committed)
- Native iOS/Android app (architecture is prepared)
- Push notifications for order status
- QR code ordering at store
- Gift card system
- Reviews and ratings
- Homepage section reordering (drag & drop UI for super admin, softcoded section order in DB)

### Future Architecture: Delivery Support

> **Note:** This architecture is designed for future projects (e.g., sushi restaurant) that require delivery. Yibei Tea is pickup-only.

#### Current State (Pickup Only)
- Order model has `pickupTime: DateTime?`
- No `orderType` enum
- No delivery address fields on Order
- User has `addresses` relation but unused for orders

#### Required Schema Changes

```prisma
enum OrderType {
  PICKUP
  DELIVERY
}

model Order {
  // Existing fields...
  orderType         OrderType      @default(PICKUP)
  pickupTime        DateTime?      // For PICKUP orders
  deliveryAddress   String?        // For DELIVERY orders
  deliveryCity      String?
  deliveryPostcode  String?
  deliveryNotes     String?
  deliveryFee       Decimal?       @db.Decimal(10, 2)
  estimatedDelivery DateTime?      // For DELIVERY orders
}

model DeliveryZone {
  id          String   @id @default(cuid())
  postcode    String   @unique
  city        String
  fee         Decimal  @db.Decimal(10, 2)
  minOrder    Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  deliveryMin Int      // Minimum delivery time in minutes
  deliveryMax Int      // Maximum delivery time in minutes
}
```

#### Configuration-Driven Approach

```typescript
// lib/fulfillment-config.ts
export const fulfillmentConfig = {
  supportedTypes: ["PICKUP"] as const, // Add "DELIVERY" when ready
  delivery: {
    enabled: false,
    defaultFee: 2.50,
    freeThreshold: 25.00,
    zones: [] // Loaded from DB
  },
  pickup: {
    enabled: true,
    leadTimeMinutes: 15
  }
};
```

#### Checkout Flow Modifications
1. Add fulfillment type selector (Pickup/Delivery)
2. Conditional rendering based on selection:
   - **Pickup**: Time slot picker (current)
   - **Delivery**: Address form + delivery zone validation
3. Order summary shows appropriate fees
4. Confirmation page shows pickup time OR delivery estimate

#### Implementation Phases

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | Schema migration + config flag | 2-3 hours |
| 2 | Checkout UI (type selector + address form) | 4-6 hours |
| 3 | Delivery zone validation + fee calculation | 2-3 hours |
| 4 | Admin: zone management UI | 3-4 hours |
| 5 | Order confirmation + tracking updates | 2-3 hours |

#### Key Design Decisions
- **Config-driven**: Feature flag controls availability
- **Zone-based pricing**: Different fees per postcode
- **Minimum order**: Enforce per zone
- **Address reuse**: Link to User.addresses for repeat orders

### Deprecated/Removed
- ~~Large grid cards for menu~~ → Replaced with horizontal compact list (Jan 2026)
- ~~Full-page product customization~~ → Replaced with intercepting route modal (Jan 2026)

---

## 11. How to Work on This Project

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, MOLLIE_API_KEY, BREVO_API_KEY

# Push database schema
npm run db:push

# Seed database with products
npm run db:seed

# Start development server
npm run dev
```

### Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed products and categories |
| `npm run db:studio` | Open Prisma Studio GUI |

### Environment Variables

```env
DATABASE_URL=           # Supabase PostgreSQL connection string
NEXTAUTH_URL=           # http://localhost:3000 for dev
NEXTAUTH_SECRET=        # Random string for session encryption
MOLLIE_API_KEY=         # Mollie API key (test_ for dev)
BREVO_API_KEY=          # Brevo API key for emails
```

### Working with AI Assistants

When using Claude or other AI assistants on this project:

1. **Reference this document** for architectural context
2. **Check "Key Decisions"** before proposing alternatives
3. **Update this document** when making significant changes
4. **Use Decision/Reason/Implication** format for new decisions

### Updating This Document

**When to update:**
- New feature implemented
- Architecture decision made
- Technology added or removed
- Scope change

**How to mark changes:**
- Add date to "Last Updated"
- Use `[DEPRECATED]` prefix for outdated sections
- Move deprecated items to "Deprecated/Removed" section
- Never delete historical decisions (they provide context)

### Session Shutdown (AI)

At the end of a work session, the command **"sluit af"** is used.

When triggered, AI must:

- Check whether decisions, UX changes, architectural changes, or workflow changes made during the session require updates to this README.md
- Update README.md first if needed
- Commit and immediately push documentation changes
- Commit completed, working code changes
- Push all safe commits
- Never commit or push broken, incomplete, or experimental work
- Report actions taken (README updated / commits / push)
- End the session without introducing new tasks or suggestions

---

## Appendix: File Structure

```
yibei-tea/
├── src/
│   ├── app/[locale]/           # Pages (i18n routing)
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── layout/             # Header, Footer
│   │   ├── products/           # Product-related
│   │   └── cart/               # Cart-related
│   ├── hooks/                  # Custom hooks
│   ├── stores/                 # Zustand stores
│   ├── lib/                    # Utilities (db, auth, email, utils)
│   ├── server/trpc/            # tRPC routers
│   └── i18n/                   # Translations (nl.json, en.json)
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
├── docs/                       # Legal documentation
│   ├── legal-tech-overview.html    # Technical overview for legal advisor
│   ├── legal-documents.html        # Privacy Policy + Terms (printable)
│   ├── legal-response.html         # Response to legal assessment
│   ├── TIA_v4.0.html               # Transfer Impact Assessment v4.0
│   └── Verwerkingsregister_v4.0.html # Records of Processing v4.0
├── public/images/              # Static assets
└── package.json
```

---

## Appendix: Current Status

### Completed
- [x] Full-stack Next.js setup with TypeScript
- [x] Database schema with Prisma + Supabase
- [x] User authentication (NextAuth.js + Google OAuth)
- [x] Menu page with filtering and compact cards
- [x] Product customization modal (intercepting routes)
- [x] Cart drawer with persistence
- [x] Checkout flow (3 steps)
- [x] Admin dashboard with order management
- [x] i18n (Dutch + English)
- [x] 64 products seeded across 10 categories
- [x] Mollie payment integration
- [x] Email notifications (Brevo)
- [x] Newsletter campaign sending (Brevo)
- [x] Loyalty points redemption at checkout
- [x] Admin analytics dashboard
- [x] Promo code system
- [x] GDPR compliance (data export, account deletion, consent tracking)
- [x] Legal documentation (Privacy Policy, Terms of Service)

### In Progress
- [ ] Production deployment

### Recently Completed
- [x] Email provider migration: Resend (US) → Brevo (France/EU) for native GDPR compliance, no SCCs needed (Jan 2026)
- [x] Legal documents v4.0: TIA and Verwerkingsregister updated, 60% of processors now EU-based (Jan 2026)
- [x] Newsletter campaign sending: Brevo integration with batch processing (Jan 2026)
- [x] GDPR compliance: newsletter opt-in default OFF (Art. 7 AVG), explicit consent required (Jan 2026)
- [x] Privacy Policy updates: international transfers disclosure, SCCs, sub-processor list (Jan 2026)
- [x] Legal documentation: tech overview, privacy policy, terms of service for legal review (Jan 2026)
- [x] Google OAuth social login (Jan 2026)
- [x] Data export API: users can download all personal data (GDPR Art. 20) (Jan 2026)
- [x] Account deletion API: users can delete account with email confirmation (GDPR Art. 17) (Jan 2026)
- [x] Consent tracking: timestamps + IP for newsletter signups (Jan 2026)
- [x] Social media links system: admin-configurable priority order, mobile dropdown, desktop inline icons, footer integration (Jan 2026)
- [x] Compact mobile header: smaller icons (32px), reduced spacing, sleeker look on mobile devices (Jan 2026)
- [x] Product carousel: infinite scroll, floating add-to-cart buttons, category-based colors (Jan 2026)
- [x] Favorites system: users can mark products as favorites, dedicated favorites page (Jan 2026)
- [x] Newsletter subscription: footer signup form, admin subscriber management (Jan 2026)
- [x] Store status badge in header: shows "Open tot XX:XX" (green) or "Opent om XX:XX" (red) with dynamic opening hours from database (Jan 2026)
- [x] Pre-order flow: customers can order when store is closed, with amber pre-order banner in checkout and automatic date/time slot selection (Jan 2026)
- [x] Dynamic time slot filtering: filters out past time slots, auto-switches to tomorrow if no slots available today (Jan 2026)
- [x] Shared store status hook (`useStoreStatus`) for reusable open/closed logic across components (Jan 2026)
- [x] Mollie payment integration with Bancontact, iDEAL, Credit Card, PayPal (Jan 2026)
- [x] Email notifications: order confirmation + order ready (Jan 2026)
- [x] Promo code system: percentage and fixed amount discounts (Jan 2026)
- [x] Admin promo codes management page (Jan 2026)
- [x] Loyalty rewards redemption at checkout (Jan 2026)
- [x] Admin analytics dashboard with revenue, orders, customers stats (Jan 2026)
- [x] Loyalty points earning on order creation (Jan 2026)
- [x] Admin dashboard with real database stats (Jan 2026)
- [x] Admin login redirect (admins → /admin, users → /account) (Jan 2026)
- [x] Password visibility toggle on login page (Jan 2026)
- [x] Order confirmation: fetch real order data from DB (Jan 2026)
- [x] Admin orders: connect to database with status updates (Jan 2026)
- [x] Checkout form validation (Jan 2026)
- [x] Checkout: save customizations to OrderItem (Jan 2026)
- [x] Admin product management with per-product customization settings (Jan 2026)
- [x] Per-product sugar/ice/toppings toggle (allowSugarCustomization, allowIceCustomization, allowToppings) (Jan 2026)

### Not Started
- [ ] Birthday rewards automation
- [ ] Production deployment
