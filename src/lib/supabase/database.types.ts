/**
 * Supabaseデータベース型定義
 * 
 * 設計参照: technical-requirements.md § 3.1 テーブル構造
 * 技術仕様: technical-requirements.md § 3.2 TypeScript型定義
 * 
 * 関連ファイル:
 * - types/index.ts: アプリケーション共通型定義
 * 
 * 実装要件:
 * - Supabase CLIで生成される型定義
 * - 手動で管理（初期段階）
 * - 将来的にはSupabase CLIで自動生成
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'inactive'
          color: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'inactive'
          color?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'inactive'
          color?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          name: string
          project_id: string
          assignee: string | null
          start_date: string
          end_date: string
          status: 'pending' | 'completed'
          completed_at: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          project_id: string
          assignee?: string | null
          start_date: string
          end_date: string
          status?: 'pending' | 'completed'
          completed_at?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          project_id?: string
          assignee?: string | null
          start_date?: string
          end_date?: string
          status?: 'pending' | 'completed'
          completed_at?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sales_targets: {
        Row: {
          id: string
          project_id: string
          year_month: string
          target_amount: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          year_month: string
          target_amount: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          year_month?: string
          target_amount?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      focus_modes: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          deadline: string | null
          goal: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          deadline?: string | null
          goal?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          deadline?: string | null
          goal?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_tab_orders: {
        Row: {
          id: string
          user_id: string
          project_orders: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_orders?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_orders?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}