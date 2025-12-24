
import { createClient } from '@supabase/supabase-js';

// ค่าเหล่านี้ต้องถูกตั้งค่าใน Environment ของระบบ
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

// ตรวจสอบความถูกต้องเบื้องต้น
const isValidUrl = supabaseUrl && /^https:\/\//.test(supabaseUrl);
const isValidKey = supabaseAnonKey && supabaseAnonKey.length > 20;

if (!isValidUrl || !isValidKey) {
    console.error("❌ Supabase Configuration Missing: กรุณาตรวจสอบว่าได้ตั้งค่า SUPABASE_URL และ SUPABASE_ANON_KEY ใน environment แล้ว");
}

/**
 * สร้าง Supabase Client
 * หากตั้งค่าไม่ครบ ระบบจะใช้ Proxy เพื่อป้องกันแอปพัง แต่จะแจ้งเตือนเมื่อมีการเรียกใช้
 */
export const supabase = (isValidUrl && isValidKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(_, prop) {
        return (...args: any[]) => {
          const msg = `⚠️ Supabase Error: มีการเรียกใช้ '${String(prop)}' แต่แอปยังไม่ได้เชื่อมต่อกับ Supabase (URL/Key ไม่ถูกต้อง)`;
          console.warn(msg);
          return Promise.resolve({ data: null, error: { message: msg } });
        };
      }
    });
