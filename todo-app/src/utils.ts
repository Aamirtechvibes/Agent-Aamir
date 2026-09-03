import type { Priority, Todo } from './types'

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const todayISO = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const isOverdue = (iso?: string, completed?: boolean) => {
  if (!iso || completed) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(iso) < today
}

export const isToday = (iso?: string) => iso === todayISO()

export const priorityWeight = (p: Priority) =>
  p === 'high' ? 3 : p === 'medium' ? 2 : 1

export const sortTodos = (list: Todo[], by: 'created' | 'due' | 'priority' | 'alphabetical') => {
  const arr = [...list]
  switch (by) {
    case 'created':
      arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      break
    case 'due':
      arr.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return +new Date(a.dueDate) - +new Date(b.dueDate)
      })
      break
    case 'priority':
      arr.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
      break
    case 'alphabetical':
      arr.sort((a, b) => a.title.localeCompare(b.title))
      break
  }
  return arr
}

export const defaultCategories = [
  { name: 'Personal', color: '#a855f7' },
  { name: 'Work', color: '#3b82f6' },
  { name: 'Health', color: '#10b981' },
  { name: 'Learning', color: '#f59e0b' },
  { name: 'Errands', color: '#ec4899' },
] as const

export type Category = { name: string; color: string }

export const colorForCategory = (name: string, list: Category[]): string => {
  const found = list.find((c) => c.name === name)
  if (found) return found.color
  // deterministic fallback
  const palette = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}
