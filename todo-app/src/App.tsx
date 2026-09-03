import { useState, useMemo, useRef, useEffect } from 'react'
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion'
import {
  Sun, Moon, Plus, Search, CheckCircle2, Circle, Trash2,
  Calendar, Tag, Star, X, ChevronDown, Flame, Zap, Clock,
  Filter, SortAsc, Sparkles, LayoutList, LayoutGrid, XCircle
} from 'lucide-react'
import { useLocalStorage, useTheme } from './hooks'
import type { Todo, Filter as FilterType, SortBy, Priority } from './types'
import { uid, todayISO, formatDate, isOverdue, isToday, sortTodos, defaultCategories, colorForCategory } from './utils'

const App = () => {
  const [theme, setTheme] = useTheme()
  const [todos, setTodos] = useLocalStorage<Todo[]>('flow-todos', [])
  const [categories] = useLocalStorage('flow-categories', defaultCategories.map(c => c))
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortBy>('created')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Stats
  const completed = todos.filter((t) => t.completed).length
  const total = todos.length
  const streak = useMemo(() => {
    let s = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const hasTodo = todos.some((t) => t.dueDate === iso)
      const hasCompleted = todos.some((t) => t.completedAt?.slice(0, 10) === iso)
      if (hasTodo || hasCompleted) {
        if (hasCompleted || hasTodo) s++
      } else if (i > 0) break
    }
    return s
  }, [todos])

  // Filter & search
  const filtered = useMemo(() => {
    let list = [...todos]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }
    switch (filter) {
      case 'active': list = list.filter((t) => !t.completed); break
      case 'completed': list = list.filter((t) => t.completed); break
      case 'today': list = list.filter((t) => t.dueDate === todayISO()); break
      case 'upcoming': list = list.filter((t) => t.dueDate && t.dueDate > todayISO() && !t.completed); break
    }
    return sortTodos(list, sort)
  }, [todos, filter, sort, search])

  // Add todo
  const addTodo = (data: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => {
    setTodos((prev) => [
      {
        ...data,
        id: uid(),
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  // Toggle
  const toggle = (id: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
          : t
      )
    )
  }

  // Delete
  const remove = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  // Update
  const update = (id: string, data: Partial<Todo>) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <Header theme={theme} setTheme={setTheme} streak={streak} completed={completed} total={total} />

        {/* Add form */}
        <AddTodoForm
          categories={categories}
          show={showAdd}
          onClose={() => setShowAdd(false)}
          onAdd={addTodo}
        />

        {/* Controls */}
        <Controls
          filter={filter}
          setFilter={setFilter}
          sort={sort}
          setSort={setSort}
          search={search}
          setSearch={setSearch}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onAddClick={() => setShowAdd(true)}
        />

        {/* Todo list */}
        <LayoutGroup>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'}>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <EmptyState filter={filter} search={search} onAddClick={() => setShowAdd(true)} />
              ) : (
                filtered.map((todo, i) =>
                  viewMode === 'grid' ? (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      index={i}
                      categories={categories}
                      onToggle={toggle}
                      onDelete={remove}
                      onUpdate={update}
                      onEdit={() => setEditingId(todo.id)}
                      isEditing={editingId === todo.id}
                      onEditClose={() => setEditingId(null)}
                    />
                  ) : (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      index={i}
                      categories={categories}
                      onToggle={toggle}
                      onDelete={remove}
                      onUpdate={update}
                      onEdit={() => setEditingId(todo.id)}
                      isEditing={editingId === todo.id}
                      onEditClose={() => setEditingId(null)}
                    />
                  )
                )
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>

        {/* Footer */}
        <footer className="text-center text-xs opacity-40 py-8 font-medium tracking-wide uppercase">
          Flow — Stay in the flow
        </footer>
      </div>
    </div>
  )
}

const Header = ({
  theme, setTheme, streak, completed, total,
}: {
  theme: string; setTheme: (t: 'light' | 'dark') => void
  streak: number; completed: number; total: number
}) => (
  <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start justify-between gap-4"
  >
    <div>
      <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text leading-tight">
        Flow
      </h1>
      <p className="mt-1 text-sm opacity-50 font-medium">
        {total === 0 ? 'Start crushing it today!' : `${completed}/${total} tasks done`}
      </p>
    </div>
    <div className="flex items-center gap-3">
      {streak > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 glass rounded-2xl px-3.5 py-2 text-sm font-semibold"
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-orange-500">{streak}d</span>
        </motion.div>
      )}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="glass rounded-2xl p-2.5 transition-transform hover:scale-110 active:scale-95"
        aria-label="Toggle theme"
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.div>
      </button>
    </div>
  </motion.header>
)

const Controls = ({
  filter, setFilter, sort, setSort, search, setSearch, viewMode, setViewMode, onAddClick,
}: {
  filter: FilterType; setFilter: (f: FilterType) => void
  sort: SortBy; setSort: (s: SortBy) => void
  search: string; setSearch: (s: string) => void
  viewMode: 'list' | 'grid'; setViewMode: (v: 'list' | 'grid') => void
  onAddClick: () => void
}) => {
  const filters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'active', label: 'Active', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'completed', label: 'Done', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { key: 'today', label: 'Today', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'upcoming', label: 'Upcoming', icon: <Calendar className="w-3.5 h-3.5" /> },
  ]

  const sorts: { key: SortBy; label: string }[] = [
    { key: 'created', label: 'Recent' },
    { key: 'priority', label: 'Priority' },
    { key: 'due', label: 'Due Date' },
    { key: 'alphabetical', label: 'A-Z' },
  ]

  return (
    <div className="space-y-3">
      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={onAddClick} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        <div className="flex items-center gap-1.5 p-1 glass rounded-2xl">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filter === f.key
                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortBy)}
            className="glass rounded-xl px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer opacity-60 hover:opacity-100 transition-opacity appearance-none pr-6"
            style={{ backgroundImage: 'none' }}
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          <div className="flex glass rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/20' : 'opacity-50'}`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/20' : 'opacity-50'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AddTodoForm = ({
  show, onClose, onAdd, categories,
}: {
  show: boolean; onClose: () => void; onAdd: (t: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => void
  categories: { name: string; color: string }[]
}) => {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState(categories[0]?.name || 'Personal')
  const [dueDate, setDueDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (show) setTimeout(() => inputRef.current?.focus(), 100)
  }, [show])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), notes: notes.trim() || undefined, priority, category, dueDate: dueDate || undefined })
    setTitle(''); setNotes(''); setPriority('medium'); setDueDate('')
    onClose()
  }

  const priorities: { key: Priority; label: string; color: string }[] = [
    { key: 'low', label: 'Low', color: '#10b981' },
    { key: 'medium', label: 'Medium', color: '#f59e0b' },
    { key: 'high', label: 'High', color: '#f43f5e' },
  ]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="gradient-border p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">New Task</h2>
            <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-base"
              required
            />
            <textarea
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field text-sm resize-none h-16"
            />
            <div className="grid grid-cols-3 gap-3">
              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-50 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Priority
                </label>
                <div className="flex gap-1">
                  {priorities.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriority(p.key)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        priority === p.key ? 'scale-110 shadow-md' : 'opacity-50 hover:opacity-80'
                      }`}
                      style={{ backgroundColor: priority === p.key ? p.color + '20' : undefined, color: priority === p.key ? p.color : undefined }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-50 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-50 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Add Task
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const TodoItem = ({
  todo, index, onToggle, onDelete, onUpdate, onEdit, isEditing, onEditClose, categories,
}: {
  todo: Todo
  index: number
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Todo>) => void
  onEdit: () => void
  isEditing: boolean
  onEditClose: () => void
  categories: { name: string; color: string }[]
}) => {
  const catColor = colorForCategory(todo.category, categories)
  const overdue = isOverdue(todo.dueDate, todo.completed)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={`group glass rounded-2xl p-4 transition-all duration-200 ${
        todo.completed ? 'opacity-60' : 'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20'
      }`}
    >
      {isEditing ? (
        <EditForm todo={todo} onSave={(data) => { onUpdate(todo.id, data); onEditClose() }} onCancel={onEditClose} categories={categories} />
      ) : (
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggle(todo.id)}
            className={`mt-0.5 check-circle ${todo.completed ? 'check-circle-checked' : 'check-circle-unchecked'}`}
          >
            {todo.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className={`font-medium leading-snug ${todo.completed ? 'line-through opacity-50' : ''}`}>
              {todo.title}
            </p>
            {todo.notes && (
              <p className="text-xs opacity-50 mt-1 line-clamp-2">{todo.notes}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="chip text-xs font-semibold"
                style={{ backgroundColor: catColor + '15', color: catColor }}
              >
                <Tag className="w-2.5 h-2.5" />
                {todo.category}
              </span>
              {todo.dueDate && (
                <span className={`chip text-xs ${overdue ? 'bg-rose-500/10 text-rose-500' : isToday(todo.dueDate) ? 'bg-amber-500/10 text-amber-500' : ''}`}>
                  <Calendar className="w-2.5 h-2.5" />
                  {isToday(todo.dueDate) ? 'Today' : formatDate(todo.dueDate)}
                </span>
              )}
              <span className={`chip text-xs priority-${todo.priority}`}>
                {todo.priority === 'high' ? <Star className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
                {todo.priority}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

const TodoCard = ({
  todo, index, onToggle, onDelete, onUpdate, onEdit, isEditing, onEditClose, categories,
}: {
  todo: Todo
  index: number
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<Todo>) => void
  onEdit: () => void
  isEditing: boolean
  onEditClose: () => void
  categories: { name: string; color: string }[]
}) => {
  const catColor = colorForCategory(todo.category, categories)
  const overdue = isOverdue(todo.dueDate, todo.completed)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group glass rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
        todo.completed ? 'opacity-60' : 'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20'
      }`}
      onClick={() => !isEditing && onToggle(todo.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="chip text-xs font-semibold"
          style={{ backgroundColor: catColor + '15', color: catColor }}
        >
          {todo.category}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="p-1 rounded-md hover:bg-white/10"
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(todo.id) }}
            className="p-1 rounded-md hover:bg-rose-500/10 text-rose-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <EditForm todo={todo} onSave={(data) => { onUpdate(todo.id, data); onEditClose() }} onCancel={onEditClose} categories={categories} />
        </div>
      ) : (
        <>
          <p className={`font-medium leading-snug text-sm ${todo.completed ? 'line-through opacity-50' : ''}`}>
            {todo.title}
          </p>
          {todo.notes && <p className="text-xs opacity-40 mt-1">{todo.notes}</p>}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              {todo.dueDate && (
                <span className={`text-xs ${overdue ? 'text-rose-500' : isToday(todo.dueDate) ? 'text-amber-500' : 'opacity-40'}`}>
                  <Calendar className="w-3 h-3" />
                </span>
              )}
              <span className={`w-2 h-2 rounded-full ${
                todo.priority === 'high' ? 'bg-rose-500' : todo.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
            </div>
            {todo.completed && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}

const EditForm = ({
  todo, onSave, onCancel, categories,
}: {
  todo: Todo
  onSave: (data: Partial<Todo>) => void
  onCancel: () => void
  categories: { name: string; color: string }[]
}) => {
  const [title, setTitle] = useState(todo.title)
  const [notes, setNotes] = useState(todo.notes || '')
  const [priority, setPriority] = useState<Priority>(todo.priority)
  const [category, setCategory] = useState(todo.category)
  const [dueDate, setDueDate] = useState(todo.dueDate || '')

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ title, notes: notes || undefined, priority, category, dueDate: dueDate || undefined }) }} className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field text-sm" autoFocus />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field text-xs resize-none h-12" placeholder="Notes" />
      <div className="flex gap-2">
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input-field text-xs flex-1">
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-xs flex-1">
          {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field text-xs flex-1" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 text-sm">Cancel</button>
        <button type="submit" className="btn-primary flex-1 text-sm">Save</button>
      </div>
    </form>
  )
}

const EmptyState = ({ filter, search, onAddClick }: { filter: FilterType; search: string; onAddClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16 space-y-4"
  >
    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
      {search ? (
        <Search className="w-8 h-8 opacity-30" />
      ) : filter === 'completed' ? (
        <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
      ) : filter === 'active' ? (
        <Zap className="w-8 h-8 text-amber-500/50" />
      ) : (
        <Sparkles className="w-8 h-8 text-violet-500/50" />
      )}
    </div>
    <div>
      <p className="font-display font-semibold text-lg opacity-80">
        {search ? 'No results found' : filter === 'completed' ? 'Nothing completed yet' : filter === 'active' ? 'All clear!' : filter === 'today' ? 'Nothing due today' : 'No tasks yet'}
      </p>
      <p className="text-sm opacity-40 mt-1">
        {search ? `Try a different search` : 'Add a task to get started'}
      </p>
    </div>
    {!search && (
      <button onClick={onAddClick} className="btn-primary inline-flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add your first task
      </button>
    )}
  </motion.div>
)

export default App
