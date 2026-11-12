import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let client = null;
if (url && key) {
  try {
    client = createClient(url, key);
  } catch {
    // 配置错误时仍能显示登录页和中文说明。
  }
}

export const supabase = client;
