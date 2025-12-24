import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// 单例 Supabase 客户端（避免多个实例）
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

// 客户端 Supabase 客户端（用于客户端组件）
export function createSupabaseClient() {
  // 如果已经创建过，直接返回
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

