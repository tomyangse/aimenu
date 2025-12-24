// 这是一个占位文件，用于 TypeScript 类型
// 如果使用 Supabase CLI，可以运行 `supabase gen types typescript --project-id <project-id>` 生成真实的类型
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
  }
}

