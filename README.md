# Furnihub V1.0 · Web App

> Integrated furniture sourcing · 5-piece MOQ · FOB pricing · Direct from verified Chinese factories.

## Stack

- **Next.js 14** (App Router) + TypeScript + TailwindCSS
- **Prisma** + SQLite (dev) · Postgres-ready (prod)
- **bcryptjs** for password hashing
- **Session-cookie auth** (V1.0 simple impl; upgrade to NextAuth.js for V1.5+)

## Quick Start

```bash
cd E:\openclaw\workspace\shared\furnihub\tech\furnihub-web
npm install
npx prisma db push      # create SQLite DB + tables
npm run db:seed         # 10 products, 5 categories, admin/demo user
npm run dev             # → http://localhost:3000
```

## Demo Accounts (V1.0 seed)

| Role | Email | Password |
|------|-------|----------|
| Customer | `demo@buyer.com` | `demo1234` |
| Admin | `admin@furnihub.local` | `admin123` |

## Pages

| Path | Description | Auth? |
|------|-------------|-------|
| `/` | Home · Hero + Categories + Factory+GEO | No |
| `/products` | Hub · 5 categories + featured + scenes | No |
| `/products/[category]` | Category listing with filters | No |
| `/products/[category]/[sku]` | PDP · specs · add to container | Optional (price gated) |
| `/signup` | Sign up · auto-approve · 8 fields | No |
| `/login` | Sign in | No |
| `/container` | MY Container · 9 decision points · inquiry form | Yes |
| `/about` | About Furnihub | No |
| `/faq` | FAQ · 5 categories · accordion | No |
| `/insights` | GEO articles · 3 seed | No |
| `/admin` | Dashboard | Admin |
| `/admin/inquiries` | Quote request inbox | Admin |
| `/admin/products` | Product list (read-only V1.0) | Admin |
| `/admin/users` | User list | Admin |

## API Routes

- `POST /api/auth/logout`
- `POST /api/container/add`
- `POST /api/container/update`
- `POST /api/container/remove`
- `POST /api/inquiry`

## V1.0 Scope (delivered)

- [x] 6-tab site (Home / Products / MY Container / About / FAQ / Insights)
- [x] Auto-approve registration (interface reserved for V1.5 manual review)
- [x] FOB price gated to authenticated users
- [x] MY Container · 9 decision points (load rate, service fee, overbox, inquiry)
- [x] Admin dashboard + inquiries + products + users
- [x] 10 seed products across 5 categories
- [x] Mobile-responsive (Tailwind defaults)

## V1.5 / V2.0 Backlog (not in V1.0)

- [ ] Product CRUD UI in admin (currently DB-only)
- [ ] File upload for product images (currently placehold.co)
- [ ] Email notifications (inquiry received, registration confirmation)
- [ ] Real auth providers (Google OAuth / Apple)
- [ ] Multi-language (i18n keys from v3 plan reserved, UI currently English-only)
- [ ] Production DB migration to Postgres
- [ ] Production deployment (Vercel / Railway / Fly.io)

## Notes for Agent Team

- **业务决策** = `E:\openclaw\workspace\shared\furnihub\decisions\Furnihub-V1-Development-Plan-v3.md`（南宮沉淀）
- **Wireframes** = `E:\openclaw\workspace\nangong\wireframe\web\` + `mobile\`（HTML 静态参考）
- **本仓库** = coder 实施代码 · DB schema 严格按 v3 plan 字段
- **协作规则** = A+ 模式 (coder requireMention=true · 不在群里 @ nangong)

## Local Dev Reference

- **Port**: 3000
- **DB file**: `./prisma/dev.db`
- **Hot reload**: enabled (Next.js dev)
- **Status**: ✅ local dev running
