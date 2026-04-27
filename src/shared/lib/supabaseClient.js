// Supabase SDK 클라이언트를 앱 전역에서 재사용하기 위한 초기화 모듈
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase 환경변수가 누락되었습니다. .env.local의 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY를 확인하세요."
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
