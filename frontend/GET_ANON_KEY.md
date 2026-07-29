# How to Get Your Supabase Anon Key

## Quick Steps

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Log in with your account
   - Select your project: `vsiidhhzwpgbuvjzngwr`

2. **Navigate to API Settings**
   - Click **Settings** (gear icon in left sidebar)
   - Click **API** in the settings menu

3. **Copy the Anon Key**
   - Look for section: **Project API keys**
   - Find the key labeled: **`anon` `public`**
   - It starts with: `eyJ...` (very long)
   - Click the **Copy** button

4. **Paste into .env.local**
   - Open: `frontend/.env.local`
   - Replace `your_anon_key_here` with the copied key
   - Save the file

## Example

Your `.env.local` should look like:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://vsiidhhzwpgbuvjzngwr.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```

## ⚠️ Important Notes

- **DO NOT** use the `service_role` key (the one in `backend/.env`)
- **DO** use the `anon` / `public` key (safe for browsers)
- The anon key is safe to put in frontend code
- The service key must stay in backend only

## After Setting the Key

1. Save `.env.local`
2. Restart the dev server if it's running
3. Run: `npm run dev` (or double-click `run-dev.bat`)
4. Open: http://localhost:3000

That's it! 🎉
