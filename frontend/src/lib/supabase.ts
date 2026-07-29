import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Copy .env.local.example to .env.local and fill these in."
  );
}

// Safe to use in the browser: this is the publishable/anon key, not the secret key.
export const supabase = createClient(supabaseUrl, supabaseKey);
