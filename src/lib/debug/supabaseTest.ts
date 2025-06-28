/**
 * Supabaseデバッグ用のテスト関数
 * フォーカスモードのデータベース状態を確認するためのユーティリティ
 */

import { createClient } from '@/lib/supabase/client'

export async function testSupabaseConnection() {
  const supabase = createClient()
  
  try {
    console.log('=== Supabase接続テスト開始 ===')
    
    // 1. 認証状態確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('認証セッション:', { session: session?.user, error: sessionError })
    
    // 2. focus_modesテーブルの全データ取得（開発環境用）
    const { data: allFocusModes, error: allError } = await supabase
      .from('focus_modes')
      .select('*')
    
    console.log('focus_modesテーブル全データ:', { data: allFocusModes, error: allError })
    
    // 3. 現在認証中のユーザーのfocus_modesデータ取得
    if (session?.user) {
      const { data: userFocusModes, error: userError } = await supabase
        .from('focus_modes')
        .select('*')
        .eq('user_id', session.user.id)
      
      console.log('認証ユーザーのfocus_modesデータ:', { data: userFocusModes, error: userError })
      
      // 4. アクティブなfocus_modeの取得テスト
      const { data: activeFocus, error: activeError } = await supabase
        .from('focus_modes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()
      
      console.log('アクティブなfocus_mode:', { data: activeFocus, error: activeError })
    }
    
    // 5. テーブル構造確認
    const { data: tableInfo, error: tableError } = await supabase
      .from('focus_modes')
      .select('*')
      .limit(1)
    
    console.log('テーブル構造確認:', { data: tableInfo, error: tableError })
    
    return {
      session,
      allFocusModes,
      connected: true
    }
  } catch (error) {
    console.error('Supabase接続テストエラー:', error)
    return {
      session: null,
      allFocusModes: null,
      connected: false,
      error
    }
  }
}

export async function testFocusModeInsert() {
  const supabase = createClient()
  
  try {
    console.log('=== フォーカスモード挿入テスト開始 ===')
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('認証されていないため、挿入テストをスキップ')
      return { success: false, reason: 'not_authenticated' }
    }
    
    const testData = {
      user_id: session.user.id,
      goal: 'テスト目標 - ' + new Date().toISOString(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true
    }
    
    console.log('挿入テストデータ:', testData)
    
    const { data, error } = await supabase
      .from('focus_modes')
      .insert(testData)
      .select()
      .single()
    
    console.log('挿入結果:', { data, error })
    
    return { success: !error, data, error }
  } catch (error) {
    console.error('フォーカスモード挿入テストエラー:', error)
    return { success: false, error }
  }
}

export async function testFocusModeUpdate(id: string) {
  const supabase = createClient()
  
  try {
    console.log('=== フォーカスモード更新テスト開始 ===')
    console.log('更新対象ID:', id)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('認証されていないため、更新テストをスキップ')
      return { success: false, reason: 'not_authenticated' }
    }
    
    const updateData = {
      goal: 'テスト更新目標 - ' + new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('更新データ:', updateData)
    
    const { data, error } = await supabase
      .from('focus_modes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()
    
    console.log('更新結果:', { data, error })
    
    return { success: !error, data, error }
  } catch (error) {
    console.error('フォーカスモード更新テストエラー:', error)
    return { success: false, error }
  }
}

export async function cleanupTestData() {
  const supabase = createClient()
  
  try {
    console.log('=== テストデータクリーンアップ開始 ===')
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('認証されていないため、クリーンアップをスキップ')
      return { success: false, reason: 'not_authenticated' }
    }
    
    // テスト用のフォーカスモードデータを削除
    const { data, error } = await supabase
      .from('focus_modes')
      .delete()
      .eq('user_id', session.user.id)
      .like('goal', 'テスト%')
    
    console.log('クリーンアップ結果:', { data, error })
    
    return { success: !error, data, error }
  } catch (error) {
    console.error('テストデータクリーンアップエラー:', error)
    return { success: false, error }
  }
}

export async function createSampleFocusMode() {
  const supabase = createClient()
  
  try {
    console.log('=== サンプルフォーカスモード作成開始 ===')
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('認証されていないため、サンプル作成をスキップ')
      return { success: false, reason: 'not_authenticated' }
    }
    
    // 既存のアクティブなフォーカスモードを無効化
    await supabase
      .from('focus_modes')
      .update({ is_active: false })
      .eq('user_id', session.user.id)
      .eq('is_active', true)
    
    // 新しいサンプルフォーカスモードを作成
    const sampleData = {
      user_id: session.user.id,
      goal: 'プロジェクト完了までに残タスクを全て完了する',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2週間後
      is_active: true,
      project_id: null
    }
    
    console.log('サンプルデータ:', sampleData)
    
    const { data, error } = await supabase
      .from('focus_modes')
      .insert(sampleData)
      .select()
      .single()
    
    console.log('サンプル作成結果:', { data, error })
    
    return { success: !error, data, error }
  } catch (error) {
    console.error('サンプルフォーカスモード作成エラー:', error)
    return { success: false, error }
  }
}

// ブラウザのコンソールからテスト関数を実行できるように、windowオブジェクトに追加
if (typeof window !== 'undefined') {
  (window as any).supabaseDebug = {
    testConnection: testSupabaseConnection,
    testInsert: testFocusModeInsert,
    testUpdate: testFocusModeUpdate,
    cleanup: cleanupTestData,
    createSample: createSampleFocusMode
  }
}