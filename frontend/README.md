# Vibey Hub - Next.js Migration

This is the **Next.js 15 (App Router)** version of Vibey Hub, migrated from the original Vite + React setup.

## ✅ What's Been Done

- ✅ Created Next.js project structure with App Router
- ✅ Migrated all lib files (api.ts, supabase.ts, utils.ts)
- ✅ Migrated auth context (AppAuthContext)
- ✅ Created providers setup for QueryClient, Auth, and Toaster
- ✅ Migrated DashboardLayout with Next.js navigation
- ✅ Created root layout with dark theme
- ✅ Created login page (root `/`)
- ✅ Created dashboard page (`/dashboard`)
- ✅ Set up layouts for all dashboard routes

## 📦 What Still Needs To Be Copied

### 1. UI Components (Shadcn)
All the shadcn/ui components from `frontend/client/src/components/ui/` need to be copied to:
```
frontend/nextjs/src/components/ui/
```

Copy all 53 `.tsx` files from the old location to the new one. No modifications needed — they work the same in Next.js.

### 2. Page Components
Copy & adapt these page files from `frontend/client/src/pages/` to `frontend/nextjs/src/app/[route]/page.tsx`:

- ✅ Dashboard.tsx → Already created (`/dashboard/page.tsx`)
- ❌ Team.tsx → Copy to `/team/page.tsx` and add `"use client";`
- ❌ Tasks.tsx → Copy to `/tasks/page.tsx` and add `"use client";`
- ❌ Contributions.tsx → Copy to `/contributions/page.tsx` and add `"use client";`
- ❌ Projects.tsx → Copy to `/projects/page.tsx` and add `"use client";`
- ❌ Settings.tsx → Copy to `/settings/page.tsx` and add `"use client";`
- ❌ Incentives.tsx → Copy to `/incentives/page.tsx` and add `"use client";`
- ❌ Notifications.tsx → Copy to `/notifications/page.tsx` and add `"use client";`
- ❌ UserProfile.tsx → Copy to `/team/[userId]/page.tsx` and add `"use client";`

**Migration steps for each page:**

1. Add `"use client";` at the top
2. Replace any `Link` from "wouter" with `Link` from "next/link"
3. Replace `useLocation()` from "wouter" with `useRouter()` / `usePathname()` from "next/navigation"
4. Everything else stays the same!

## 🚀 Next Steps

1. **Copy all UI components:**
   ```bash
   # From frontend/client/src/components/ui/ to frontend/nextjs/src/components/ui/
   cp -r ../client/src/components/ui/* src/components/ui/
   ```

2. **Migrate remaining pages** (see list above)

3. **Install dependencies:**
   ```bash
   cd frontend/nextjs
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Then edit .env.local with your actual values
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📝 Key Migration Changes

### Changed:
- `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`
- `wouter` (Link, useLocation) → `next/link` & `next/navigation`
- `main.tsx` → App Router with `providers.tsx`
- File routing: `pages/Dashboard.tsx` → `app/dashboard/page.tsx`

### Stayed the same:
- All UI components (shadcn)
- All API logic
- All hooks (React Query, auth)
- All styling (Tailwind, globals.css)
- Context providers

## 🎯 File Structure

```
frontend/nextjs/
├── src/
│   ├── app/
│   │   ├── layout.tsx             (Root layout, dark theme)
│   │   ├── page.tsx               (Login page)
│   │   ├── providers.tsx          (QueryClient, Auth)
│   │   ├── globals.css            (Tailwind + custom styles)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx         (DashboardLayout wrapper)
│   │   │   └── page.tsx           (Dashboard page)
│   │   ├── team/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           (TODO: migrate)
│   │   │   └── [userId]/
│   │   │       └── page.tsx       (TODO: migrate)
│   │   ├── tasks/, contributions/, projects/, etc.
│   │
│   ├── components/
│   │   ├── ui/                    (TODO: copy all shadcn components)
│   │   ├── DashboardLayout.tsx
│   │   ├── DashboardLayoutSkeleton.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── contexts/
│   │   └── AppAuthContext.tsx
│   │
│   ├── hooks/
│   │   └── useMobile.tsx
│   │
│   └── lib/
│       ├── api.ts
│       ├── supabase.ts
│       └── utils.ts
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local.example
```

## 💡 Tips

- All pages that use hooks/state need `"use client";` directive
- Server Components (no directive) = faster, but can't use useState/useEffect
- Our app is client-heavy (auth, React Query), so most pages will be client components
- Layouts can share the DashboardLayout wrapper

## 🐛 Troubleshooting

If you get module errors:
```bash
npm install
```

If TypeScript complains:
```bash
npm run lint
```

If styles are missing:
- Make sure `globals.css` is imported in `layout.tsx`
- Check tailwind.config.ts paths include all files

## 📚 Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Next.js Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Shadcn UI with Next.js](https://ui.shadcn.com/docs/installation/next)
