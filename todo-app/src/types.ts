export type Priority = 'low' | 'medium' | 'high'

export interface Todo {
  id: string
  title: string
  notes?: string
  completed: boolean
  priority: Priority
  category: string
  dueDate?: string
  createdAt: string
  completedAt?: string
}

export type Filter = 'all' | 'active' | 'completed' | 'today' | 'upcoming'
export type SortBy = 'created' | 'due' | 'priority' | 'alphabetical'
