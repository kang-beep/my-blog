// Supabase SDK 클라이언트를 앱 전역에서 재사용하기 위한 초기화 모듈
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase env vars. Locally check .env.local; in production set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel Environment Variables."
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
