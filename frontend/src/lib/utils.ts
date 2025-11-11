import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL
// const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY

// export const supabase = createClient(supabaseUrl, supabaseKey)
