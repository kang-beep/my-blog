// 인증 도메인 Supabase Auth 접근 함수 모음
import { supabase } from "../../../shared/lib/supabaseClient";

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

export function subscribeAuthState(listener) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listener(session);
  });
  return data.subscription;
}
