# Vibey Hub Next.js - Quick Start Guide

## ⚡ Fast Setup (Windows)

### Step 1: Install Dependencies

**Option A - Double-click the batch file:**
```
Double-click: install.bat
```

**Option B - Open Command Prompt (cmd) and run:**
```cmd
cd c:\Users\HomePC\Documents\Vibey_world\frontend\nextjs
npm install
```

This will take 2-5 minutes depending on your internet speed.

### Step 2: Set Up Environment Variables

1. Copy the example file:
   ```cmd
   copy .env.local.example .env.local
   ```

2. Open `.env.local` in a text editor and add your values:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
   ```

### Step 3: Run the Development Server

**Option A - Double-click the batch file:**
```
Double-click: run-dev.bat
```

**Option B - Command Prompt:**
```cmd
npm run dev
```

### Step 4: Open in Browser

Open: **http://localhost:3000**

---

## 🔧 If npm Commands Don't Work

The batch files (`install.bat` and `run-dev.bat`) work around PowerShell security issues by using `node` directly.

Alternatively, you can:

1. **Use Command Prompt (cmd) instead of PowerShell**
   - Press `Win + R`
   - Type `cmd` and press Enter
   - Navigate to the project folder
   - Run `npm install`

2. **Or fix PowerShell execution policy** (requires admin):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

---

## 📋 What's Already Done

✅ All infrastructure (layouts, contexts, providers)
✅ Login page
✅ Dashboard
✅ Team page
✅ Tasks page  
✅ All UI components copied

## 📝 What You Need To Do

Still need to copy these page files from the old project:

1. **Contributions** - Copy from `frontend/client/src/pages/Contributions.tsx`
2. **Projects** - Copy from `frontend/client/src/pages/Projects.tsx`
3. **Settings** - Copy from `frontend/client/src/pages/Settings.tsx`
4. **Incentives** - Copy from `frontend/client/src/pages/Incentives.tsx`
5. **Notifications** - Copy from `frontend/client/src/pages/Notifications.tsx`

**How to migrate each page:**
- Copy the file content
- Create new file: `frontend/nextjs/src/app/[pagename]/page.tsx`
- Add `"use client";` at the very top
- Replace any `Link` imports from "wouter" with `Link` from "next/link"
- Everything else stays the same!

---

## 🐛 Troubleshooting

**Problem: "npm is not recognized"**
- Make sure Node.js is installed: https://nodejs.org
- Restart your terminal after installing Node.js

**Problem: "Cannot load npm.ps1"**
- Use the `.bat` files instead
- Or use Command Prompt (cmd) instead of PowerShell

**Problem: Port 3000 is already in use**
- Stop the old Vite dev server (if running)
- Or Next.js will automatically use port 3001

**Problem: Module not found errors**
- Make sure `npm install` completed successfully
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

---

## 🎯 Next Steps After Setup

1. Test the login page
2. Create a test account
3. Check the dashboard loads
4. Migrate the remaining pages (see list above)
5. Test all features work

---

## 📚 Full Documentation

- **README.md** - Detailed migration info
- **MIGRATION_COMPLETE.md** - Complete checklist
- **Next.js Docs** - https://nextjs.org/docs

Need help? Check the error message carefully and search for the specific error online.
