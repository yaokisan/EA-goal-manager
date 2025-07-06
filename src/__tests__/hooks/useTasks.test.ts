/**
 * useTasks フックのテスト
 * 
 * カスタムフックのテスト例
 * React Hooks Testing Library を使用
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { createMockTask, createMockProject } from '../utils/test-utils'

// useTasks フックの簡易モック版（テスト用）
// 実際のテストでは本物のフックをモックして使用
const useMockTasks = () => {
  const [tasks, setTasks] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const createTask = async (taskData: any) => {
    setLoading(true)
    try {
      const newTask = {
        ...createMockTask(),
        ...taskData,
        id: `task-${Date.now()}`,
      }
      setTasks(prev => [...prev, newTask])
      return newTask
    } catch (err) {
      setError('タスク作成に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateTask = async (id: string, updates: any) => {
    setLoading(true)
    try {
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ))
    } catch (err) {
      setError('タスク更新に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteTask = async (id: string) => {
    setLoading(true)
    try {
      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      setError('タスク削除に失敗しました')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const toggleTaskArchive = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task) {
      await updateTask(id, {
        is_archived: !task.is_archived,
        archived_at: !task.is_archived ? new Date().toISOString() : null
      })
    }
  }

  const archivedTasks = tasks.filter(task => task.is_archived)
  const activeTasks = tasks.filter(task => !task.is_archived)

  return {
    tasks: activeTasks,
    allTasks: tasks,
    archivedTasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskArchive,
  }
}

// Reactのimportをモック
const React = require('react')

describe('useTasks Hook', () => {
  describe('初期状態', () => {
    it('正しい初期値を返す', () => {
      const { result } = renderHook(() => useMockTasks())
      
      expect(result.current.tasks).toEqual([])
      expect(result.current.allTasks).toEqual([])
      expect(result.current.archivedTasks).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('タスク作成', () => {
    it('新しいタスクを作成できる', async () => {
      const { result } = renderHook(() => useMockTasks())
      
      const taskData = {
        name: '新しいタスク',
        project_id: 'project-1',
        assignees: ['ユーザー1'],
      }

      await act(async () => {
        await result.current.createTask(taskData)
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0].name).toBe('新しいタスク')
      expect(result.current.tasks[0].project_id).toBe('project-1')
    })

    it('作成中はloadingがtrueになる', async () => {
      const { result } = renderHook(() => useMockTasks())
      
      const taskData = { name: 'テストタスク' }

      act(() => {
        result.current.createTask(taskData)
      })

      expect(result.current.loading).toBe(true)
    })
  })

  describe('タスク更新', () => {
    it('既存のタスクを更新できる', async () => {
      const { result } = renderHook(() => useMockTasks())
      
      // まずタスクを作成
      await act(async () => {
        await result.current.createTask({ name: '元のタスク' })
      })

      const taskId = result.current.tasks[0].id
      
      // タスクを更新
      await act(async () => {
        await result.current.updateTask(taskId, { name: '更新されたタスク' })
      })

      expect(result.current.tasks[0].name).toBe('更新されたタスク')
    })
  })

  describe('タスク削除', () => {
    it('タスクを削除できる', async () => {
      const { result } = renderHook(() => useMockTasks())
      
      // タスクを作成
      await act(async () => {
        await result.current.createTask({ name: '削除対象タスク' })
      })

      expect(result.current.tasks).toHaveLength(1)
      
      const taskId = result.current.tasks[0].id
      
      // タスクを削除
      await act(async () => {
        await result.current.deleteTask(taskId)
      })

      expect(result.current.tasks).toHaveLength(0)
    })
  })

  describe('アーカイブ機能', () => {
    it('タスクをアーカイブできる', async () => {
      const { result } = renderHook(() => useMockTasks())
      
      // タスクを作成
      await act(async () => {
        await result.current.createTask({ name: 'アーカイブ対象タスク' })
      })

      const taskId = result.current.tasks[0].id
      
      // タスクをアーカイブ
      await act(async () => {
        await result.current.toggleTaskArchive(taskId)
      })

      expect(result.current.tasks).toHaveLength(0) // アクティブタスクが0件
      expect(result.current.archivedTasks).toHaveLength(1) // アーカイブタスクが1件
      expect(result.current.archivedTasks[0].is_archived).toBe(true)
      expect(result.current.archivedTasks[0].archived_at).toBeTruthy()
    })

    it('アーカイブされたタスクを元に戻せる', async () => {
      const { result } = renderHook(() => useMockTasks())
      
      // タスクを作成してアーカイブ
      await act(async () => {
        await result.current.createTask({ name: 'テストタスク' })
      })

      const taskId = result.current.tasks[0].id
      
      await act(async () => {
        await result.current.toggleTaskArchive(taskId)
      })

      expect(result.current.archivedTasks).toHaveLength(1)
      
      // アーカイブを解除
      await act(async () => {
        await result.current.toggleTaskArchive(taskId)
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.archivedTasks).toHaveLength(0)
      expect(result.current.tasks[0].is_archived).toBe(false)
      expect(result.current.tasks[0].archived_at).toBe(null)
    })
  })
})