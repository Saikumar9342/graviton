'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Sparkles,
  Search, Pencil, Check, X, Folder, FolderPlus, ChevronDown, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Chat } from '@/lib/types'
import { renameChat } from '@/lib/api'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  color: string
}

const PROJECT_COLORS = ['violet', 'blue', 'emerald', 'amber', 'rose', 'sky', 'orange', 'pink']
const COLOR_CLASSES: Record<string, string> = {
  violet: 'bg-violet-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
}

function genId() { return Math.random().toString(36).slice(2, 10) }

// ── Persistence ───────────────────────────────────────────────────────────────

function loadProjects(): Project[] {
  try { return JSON.parse(localStorage.getItem('graviton_projects') || '[]') }
  catch { return [] }
}
function saveProjects(p: Project[]) { localStorage.setItem('graviton_projects', JSON.stringify(p)) }

function loadChatProject(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('graviton_chat_project') || '{}') }
  catch { return {} }
}
function saveChatProject(m: Record<string, string>) { localStorage.setItem('graviton_chat_project', JSON.stringify(m)) }

// ── Date grouping ─────────────────────────────────────────────────────────────

function getChatGroup(date: Date): string {
  const d = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d <= 7) return 'This week'
  if (d <= 30) return 'This month'
  return 'Earlier'
}
const GROUP_ORDER = ['Today', 'Yesterday', 'This week', 'This month', 'Earlier']

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
  onRenameChat: (id: string, title: string) => void
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

// ── Project picker ────────────────────────────────────────────────────────────

function ProjectPicker({
  projects, current, onPick, onClose,
}: {
  projects: Project[]
  current: string | null
  onPick: (id: string | null) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border/30 bg-popover shadow-xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="p-1 space-y-0.5">
        <button
          onClick={() => { onPick(null); onClose() }}
          className={cn('w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-colors', current === null ? 'bg-primary/10 text-primary' : 'text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground')}
        >
          <MessageSquare className="h-3 w-3 shrink-0" /> No project
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => { onPick(p.id); onClose() }}
            className={cn('w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-colors', current === p.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground')}
          >
            <span className={cn('h-2 w-2 rounded-full shrink-0', COLOR_CLASSES[p.color] ?? 'bg-primary')} />
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Chat row ──────────────────────────────────────────────────────────────────

interface ChatRowProps {
  chat: Chat
  isActive: boolean
  projects: Project[]
  chatProject: Record<string, string>
  editingId: string | null
  editValue: string
  isPendingDelete: boolean
  onSelect: () => void
  onRequestDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onStartEdit: (e: React.MouseEvent) => void
  onEditChange: (v: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onAssign: (projectId: string | null) => void
}

function ChatRow({
  chat, isActive, projects, chatProject, editingId, editValue,
  isPendingDelete, onSelect, onRequestDelete, onConfirmDelete, onCancelDelete,
  onStartEdit, onEditChange, onCommitEdit, onCancelEdit, onAssign,
}: ChatRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  if (editingId === chat.id) {
    return (
      <div className="flex items-center gap-1 px-1 py-0.5">
        <Input autoFocus value={editValue} onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCancelEdit() }}
          className="h-7 flex-1 text-[13px] py-0 px-2 rounded-lg" />
        <button onClick={onCommitEdit} className="h-6 w-6 rounded-md flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10">
          <Check className="h-3 w-3" />
        </button>
        <button onClick={onCancelEdit} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:bg-muted/50">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  if (isPendingDelete) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-destructive/8 border border-destructive/20 animate-in fade-in duration-150">
        <AlertTriangle className="h-3 w-3 text-destructive/70 shrink-0" />
        <span className="flex-1 text-[11px] text-destructive/80 truncate">Delete this chat?</span>
        <button onClick={onConfirmDelete} className="h-6 px-2 rounded-md text-[11px] font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors">
          Delete
        </button>
        <button onClick={onCancelDelete} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:bg-muted/50 transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="group relative">
      {/* Use div instead of button to allow nested action buttons */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
        className={cn(
          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-all duration-150 cursor-pointer select-none',
          isActive ? 'bg-primary/10 text-foreground' : 'text-muted-foreground/55 hover:text-foreground hover:bg-muted/40',
        )}
      >
        <MessageSquare className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/25')} />
        <div className="flex-1 min-w-0 pr-1">
          <p className="truncate text-[12px] font-medium leading-tight">{chat.title}</p>
          <p className="text-[10px] text-muted-foreground/30 mt-0.5 leading-none">
            {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
          </p>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Folder: only on hover */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v) }}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Folder className="h-2.5 w-2.5" />
            </button>
            {pickerOpen && (
              <ProjectPicker projects={projects} current={chatProject[chat.id] ?? null}
                onPick={onAssign} onClose={() => setPickerOpen(false)} />
            )}
          </div>
          {/* Edit & Delete: always faintly visible (opacity-based, works on both themes) */}
          <button
            onClick={(e) => { e.stopPropagation(); onStartEdit(e) }}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground opacity-[0.35] group-hover:opacity-100 hover:opacity-100 hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRequestDelete() }}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground opacity-[0.35] group-hover:opacity-100 hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ChatSidebar({
  chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat,
  isOpen, isCollapsed, onClose, onToggleCollapse,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [chatProject, setChatProject] = useState<Record<string, string>>({})
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editProjectValue, setEditProjectValue] = useState('')

  useEffect(() => {
    setProjects(loadProjects())
    setChatProject(loadChatProject())
  }, [])

  // ── Project actions ───────────────────────────────────────────────────────

  const createProject = () => {
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
    const p: Project = { id: genId(), name: 'New project', color }
    const next = [...projects, p]
    setProjects(next)
    saveProjects(next)
    setEditingProjectId(p.id)
    setEditProjectValue(p.name)
  }

  const deleteProject = (id: string) => {
    const next = projects.filter((p) => p.id !== id)
    setProjects(next)
    saveProjects(next)
    const nextMap = { ...chatProject }
    for (const k of Object.keys(nextMap)) { if (nextMap[k] === id) delete nextMap[k] }
    setChatProject(nextMap)
    saveChatProject(nextMap)
  }

  const commitProjectEdit = (id: string) => {
    const trimmed = editProjectValue.trim()
    if (trimmed) {
      const next = projects.map((p) => p.id === id ? { ...p, name: trimmed } : p)
      setProjects(next)
      saveProjects(next)
    }
    setEditingProjectId(null)
  }

  const toggleProjectCollapse = (id: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const assignChat = (chatId: string, projectId: string | null) => {
    const next = { ...chatProject }
    if (projectId === null) delete next[chatId]
    else next[chatId] = projectId
    setChatProject(next)
    saveChatProject(next)
  }

  // ── Chat edit ─────────────────────────────────────────────────────────────

  const startEdit = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(chat.id)
    setEditValue(chat.title)
  }

  const commitEdit = async (id: string) => {
    const trimmed = editValue.trim()
    const original = chats.find((c) => c.id === id)?.title
    if (trimmed && trimmed !== original) {
      try { await renameChat(id, trimmed); onRenameChat(id, trimmed) }
      catch { /* silent */ }
    }
    setEditingId(null)
  }

  // ── Filtering & grouping ──────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return chats
    const q = search.toLowerCase()
    return chats.filter((c) => c.title.toLowerCase().includes(q))
  }, [chats, search])

  const assignedIds = useMemo(
    () => new Set(Object.keys(chatProject).filter((k) => chatProject[k])),
    [chatProject],
  )

  const unassigned = useMemo(
    () => filtered.filter((c) => !assignedIds.has(c.id)),
    [filtered, assignedIds],
  )

  const grouped = useMemo(() => {
    const map: Record<string, Chat[]> = {}
    for (const chat of unassigned) {
      const g = getChatGroup(chat.updatedAt)
      if (!map[g]) map[g] = []
      map[g].push(chat)
    }
    return GROUP_ORDER.filter((g) => map[g]?.length > 0).map((g) => ({ label: g, chats: map[g] }))
  }, [unassigned])

  const chatsInProject = (projectId: string) =>
    filtered.filter((c) => chatProject[c.id] === projectId)

  const sharedRowProps = (chat: Chat) => ({
    chat,
    isActive: currentChatId === chat.id,
    projects,
    chatProject,
    editingId,
    editValue,
    isPendingDelete: pendingDeleteId === chat.id,
    onSelect: () => onSelectChat(chat.id),
    onRequestDelete: () => setPendingDeleteId(chat.id),
    onConfirmDelete: () => { onDeleteChat(chat.id); setPendingDeleteId(null) },
    onCancelDelete: () => setPendingDeleteId(null),
    onStartEdit: (e: React.MouseEvent) => startEdit(chat, e),
    onEditChange: setEditValue,
    onCommitEdit: () => commitEdit(chat.id),
    onCancelEdit: () => setEditingId(null),
    onAssign: (pid: string | null) => assignChat(chat.id, pid),
  })

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/40 bg-sidebar transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:relative',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-[60px]' : 'w-[260px]',
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-border/40 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 animate-in fade-in duration-200">
              <span className="text-sm font-semibold">Graviton</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={onToggleCollapse}
            className={cn('h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0', isCollapsed && 'mx-auto')}>
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* New chat + search */}
        <div className={cn('p-2 space-y-1.5 shrink-0', isCollapsed && 'px-1.5')}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onNewChat} variant="ghost" size="icon"
                  className="h-9 w-9 mx-auto flex rounded-xl border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">New chat</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Button onClick={onNewChat}
                className="w-full justify-start gap-2 h-9 text-sm font-medium rounded-xl bg-primary/10 text-primary hover:bg-primary/15 border-none shadow-none">
                <Plus className="h-3.5 w-3.5 shrink-0" /> New chat
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/35 pointer-events-none" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats…"
                  className="h-8 pl-8 pr-7 text-xs bg-muted/25 border-border/25 focus-visible:ring-1 rounded-lg placeholder:text-muted-foreground/30" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/35 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-2 pb-4">

            {/* Projects section */}
            {!isCollapsed && (
              <div className="mb-2">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-widest">Projects</p>
                  <button onClick={createProject}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors">
                    <FolderPlus className="h-3 w-3" />
                  </button>
                </div>

                {projects.length === 0 && (
                  <button onClick={createProject}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-muted-foreground/30 hover:text-foreground hover:bg-muted/40 transition-all text-[12px]">
                    <FolderPlus className="h-3.5 w-3.5" /> New project
                  </button>
                )}

                <div className="space-y-0.5">
                  {projects.map((project) => {
                    const projectChats = chatsInProject(project.id)
                    const isCollapsedP = collapsedProjects.has(project.id)
                    return (
                      <div key={project.id}>
                        <div className="group flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => toggleProjectCollapse(project.id)}>
                          <ChevronDown className={cn('h-3 w-3 text-muted-foreground/30 shrink-0 transition-transform duration-200', isCollapsedP && '-rotate-90')} />
                          <span className={cn('h-2 w-2 rounded-full shrink-0', COLOR_CLASSES[project.color] ?? 'bg-primary')} />
                          {editingProjectId === project.id ? (
                            <Input autoFocus value={editProjectValue} onChange={(e) => setEditProjectValue(e.target.value)}
                              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') commitProjectEdit(project.id); if (e.key === 'Escape') setEditingProjectId(null) }}
                              onClick={(e) => e.stopPropagation()} onBlur={() => commitProjectEdit(project.id)}
                              className="h-5 flex-1 text-[12px] py-0 px-1.5 rounded-md min-w-0" />
                          ) : (
                            <span className="flex-1 text-[12px] font-medium text-muted-foreground/70 truncate">{project.name}</span>
                          )}
                          {!editingProjectId && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <span className="text-[10px] text-muted-foreground/30 mr-1">{projectChats.length}</span>
                              <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); setEditProjectValue(project.name) }}
                                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-muted/60">
                                <Pencil className="h-2.5 w-2.5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id) }}
                                className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {!isCollapsedP && (
                          <div className="ml-4 pl-2 border-l border-border/20 space-y-0.5 mb-1">
                            {projectChats.length === 0 ? (
                              <p className="px-2 py-1.5 text-[11px] text-muted-foreground/25 italic">No chats yet</p>
                            ) : (
                              projectChats.map((chat) => <ChatRow key={chat.id} {...sharedRowProps(chat)} />)
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Collapsed project icons */}
            {isCollapsed && projects.length > 0 && (
              <div className="mb-2 space-y-0.5">
                {projects.map((p) => (
                  <Tooltip key={p.id}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 mx-auto flex rounded-xl text-muted-foreground/35 hover:text-foreground hover:bg-muted/50">
                        <Folder className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{p.name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* Date-grouped chats */}
            {filtered.length === 0 && !isCollapsed && (
              <p className="px-2 py-8 text-center text-xs text-muted-foreground/35">
                {search ? 'No chats match your search' : 'No conversations yet'}
              </p>
            )}

            {grouped.map(({ label, chats: groupChats }) => (
              <div key={label} className="mb-2">
                {!isCollapsed && (
                  <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-widest">{label}</p>
                )}
                <div className="space-y-0.5">
                  {groupChats.map((chat) =>
                    isCollapsed ? (
                      <Tooltip key={chat.id}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onSelectChat(chat.id)}
                            className={cn('h-9 w-9 mx-auto flex rounded-xl transition-all', currentChatId === chat.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground/35 hover:text-foreground hover:bg-muted/50')}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs max-w-[200px] truncate">{chat.title}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <ChatRow key={chat.id} {...sharedRowProps(chat)} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
    </TooltipProvider>
  )
}
