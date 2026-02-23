import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ต้องมีคำว่า export นำหน้า เพื่อให้ไฟล์อื่น (เช่น AuthPage) ดึงไปใช้ได้
export const supabase = createClient(supabaseUrl, supabaseKey);