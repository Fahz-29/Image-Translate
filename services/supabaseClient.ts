
import { createClient } from '@supabase/supabase-js';

// ค่าเหล่านี้จะถูกแทนที่โดย Vite ระหว่างการ build จากไฟล์ .env หรือการตั้งค่าใน dashboard
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

// ตรวจสอบว่า URL มีรูปแบบที่ถูกต้อง (ต้องขึ้นต้นด้วย https://)
const isValidUrl = supabaseUrl && /^https:\/\//.test(supabaseUrl);
const isValidKey = supabaseAnonKey && supabaseAnonKey.length > 10;

/**
 * สร้าง Supabase Client อย่างปลอดภัย
 * หากค่าคอนฟิกไม่ถูกต้อง เราจะส่ง Proxy Object ออกไปแทน เพื่อให้แอปยังสามารถรันส่วนอื่นๆ ต่อไปได้
 * และจะมีการแจ้งเตือนทาง Console เมื่อมีการเรียกใช้งานฐานข้อมูล
 */
export const supabase = (isValidUrl && isValidKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(_, prop) {
        return (...args: any[]) => {
          console.warn(
            `Supabase: มีการเรียกใช้งานฟังก์ชัน '${String(prop)}' แต่ระบบยังไม่ได้ตั้งค่าคอนฟิกที่ถูกต้อง (URL หรือ Key หายไป)`
          );
          // ส่งกลับโครงสร้างข้อมูลที่เลียนแบบการตอบกลับของ Supabase เพื่อป้องกัน code ส่วนอื่นพัง
          return Promise.resolve({ data: null, error: { message: "Supabase not configured" } });
        };
      }
    });
