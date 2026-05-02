'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Search, Pencil, Check, X,
  Folder, FolderPlus, ChevronDown, MoreHorizontal, Pin, AlertTriangle, Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Chat } from '@/lib/types'
import { renameChat } from '@/lib/api'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  color: string
  icon?: string  // kept for backward compat
}

const PROJECT_COLORS = ['violet', 'blue', 'emerald', 'amber', 'rose', 'sky', 'orange', 'pink']
const COLOR_DOT: Record<string, string> = {
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

// ── Persistence ────────────────────────────────────────────────────────────────

function loadProjects(): Project[] {
  try { return JSON.parse(localStorage.getItem('graviton_projects') || '[]') } catch { return [] }
}
function saveProjects(p: Project[]) { localStorage.setItem('graviton_projects', JSON.stringify(p)) }

function loadChatProject(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('graviton_chat_project') || '{}') } catch { return {} }
}
function saveChatProject(m: Record<string, string>) { localStorage.setItem('graviton_chat_project', JSON.stringify(m)) }

function loadPinned(): string[] {
  try { return JSON.parse(localStorage.getItem('graviton_pinned') || '[]') } catch { return [] }
}
function savePinned(ids: string[]) { localStorage.setItem('graviton_pinned', JSON.stringify(ids)) }

// ── Date grouping ──────────────────────────────────────────────────────────────

function getChatGroup(date: Date): string {
  const d = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d <= 7) return 'Previous 7 days'
  if (d <= 30) return 'Previous 30 days'
  return 'Earlier'
}
const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days', 'Earlier']

// ── Props ──────────────────────────────────────────────────────────────────────

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

// ── Create Project Dialog ──────────────────────────────────────────────────────

function CreateProjectDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreate: (name: string) => void
}) {
  const [name, setName] = useState('')

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim())
    setName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setName(''); onOpenChange(v) }}>
      <DialogContent className="max-w-[380px] rounded-2xl p-0 gap-0 overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Create project</DialogTitle>
        <DialogDescription className="sr-only">Create a new project to organize your chats</DialogDescription>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <p className="text-sm font-semibold">Create project</p>
          <button
            onClick={() => { setName(''); onOpenChange(false) }}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground/70 block mb-2">
              Project name
            </label>
            <Input
              autoFocus
              placeholder="e.g. Work, Research, Personal…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="h-10 text-sm rounded-xl bg-muted/20 border-border/40"
            />
          </div>

          <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-muted/20 border border-border/25">
            <Lightbulb className="h-4 w-4 text-amber-400/60 mt-0.5 shrink-0" />
            <p className="text-[12px] text-muted-foreground/55 leading-relaxed">
              Projects keep chats, files, and custom instructions in one place. Use them for ongoing work, or just to keep things tidy.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setName(''); onOpenChange(false) }}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!name.trim()}
              className="h-8 px-4 text-xs rounded-xl"
            >
              Create project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Chat Row ───────────────────────────────────────────────────────────────────

interface ChatRowProps {
  chat: Chat
  isActive: boolean
  isPinned: boolean
  projects: Project[]
  chatProject: Record<string, string>
  editingId: string | null
  editValue: string
  isPendingDelete: boolean
  onSelect: () => void
  onRequestDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onStartEdit: () => void
  onEditChange: (v: string) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  onAssign: (projectId: string | null) => void
  onTogglePin: () => void
}

function ChatRow({
  chat, isActive, isPinned, projects, chatProject, editingId, editValue,
  isPendingDelete, onSelect, onRequestDelete, onConfirmDelete, onCancelDelete,
  onStartEdit, onEditChange, onCommitEdit, onCancelEdit, onAssign, onTogglePin,
}: ChatRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  if (editingId === chat.id) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5">
        <Input
          autoFocus
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCancelEdit() }}
          className="h-7 flex-1 text-[13px] py-0 px-2 rounded-lg"
        />
        <button onClick={onCommitEdit} className="h-6 w-6 rounded-md flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 shrink-0">
          <Check className="h-3 w-3" />
        </button>
        <button onClick={onCancelEdit} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:bg-muted/50 shrink-0">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  if (isPendingDelete) {
    return (
      <div className="flex items-center gap-2 mx-1 px-2.5 py-2 rounded-xl border border-destructive/20 bg-destructive/5 animate-in fade-in duration-150">
        <AlertTriangle className="h-3 w-3 text-destructive/70 shrink-0" />
        <span className="flex-1 text-[11px] text-destructive/70 truncate">Delete this chat?</span>
        <button onClick={onConfirmDelete} className="h-6 px-2 rounded-md text-[11px] font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shrink-0">
          Delete
        </button>
        <button onClick={onCancelDelete} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:bg-muted/50 shrink-0">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  const shortTitle = chat.title.length > 28 ? chat.title.slice(0, 28) + '…' : chat.title

  return (
    <div
      ref={menuRef}
      className={cn(
        'group/row flex items-center gap-1 mx-1 pl-3 pr-1.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors duration-100',
        isActive ? 'bg-muted/50' : 'hover:bg-muted/30',
      )}
    >
      {/* Active stripe removed as per user request */}

      {/* Title */}
      <span
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
        className={cn(
          'flex-1 min-w-0 text-[13px] leading-snug truncate',
          isActive ? 'font-medium text-foreground' : 'font-normal text-foreground/60',
        )}
      >
        {shortTitle}
      </span>

      {/* ⋮ button + dropdown */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
          className={cn(
            'h-6 w-6 rounded-md flex items-center justify-center transition-colors',
            menuOpen
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground/50 hover:bg-muted hover:text-foreground',
          )}
          title="More options"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-[60] w-48 rounded-xl border border-border/40 bg-popover shadow-xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-1 space-y-0.5">
              <button
                onClick={() => { setMenuOpen(false); onStartEdit() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-left text-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                Rename
              </button>

              <div className="relative">
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-left text-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors"
                >
                  <Folder className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  Move to project
                </button>
                {pickerOpen && (
                  <div className="absolute right-full top-0 mr-1 z-[70] w-44 rounded-xl border border-border/30 bg-popover shadow-xl shadow-black/20 overflow-hidden animate-in fade-in duration-150">
                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => { onAssign(null); setPickerOpen(false); setMenuOpen(false) }}
                        className={cn('w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] text-left transition-colors', !chatProject[chat.id] ? 'bg-primary/10 text-primary' : 'text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground')}
                      >
                        No project
                      </button>
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { onAssign(p.id); setPickerOpen(false); setMenuOpen(false) }}
                          className={cn('w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] text-left transition-colors', chatProject[chat.id] === p.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground')}
                        >
                          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', COLOR_DOT[p.color] ?? 'bg-primary')} />
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="my-0.5 mx-2 border-t border-border/25" />

              <button
                onClick={() => { setMenuOpen(false); onTogglePin() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-left text-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <Pin className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                {isPinned ? 'Unpin chat' : 'Pin chat'}
              </button>

              <div className="my-0.5 mx-2 border-t border-border/25" />

              <button
                onClick={() => { setMenuOpen(false); onRequestDelete() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-left text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3 shrink-0" />
                Delete chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Sidebar ───────────────────────────────────────────────────────────────

export function ChatSidebar({
  chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat,
  isOpen, isCollapsed, onClose, onToggleCollapse,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [chatProject, setChatProject] = useState<Record<string, string>>({})
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editProjectValue, setEditProjectValue] = useState('')
  const [pinnedIds, setPinnedIds] = useState<string[]>([])

  useEffect(() => {
    setProjects(loadProjects())
    setChatProject(loadChatProject())
    setPinnedIds(loadPinned())
  }, [])

  // ── Project actions ──────────────────────────────────────────────────────────

  const createProject = (name: string) => {
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
    const p: Project = { id: genId(), name, color, icon: 'folder' }
    const next = [...projects, p]
    setProjects(next)
    saveProjects(next)
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
    if (!trimmed) { setEditingProjectId(null); return }
    const next = projects.map((p) => p.id === id ? { ...p, name: trimmed } : p)
    setProjects(next)
    saveProjects(next)
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

  const togglePin = (chatId: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
      savePinned(next)
      return next
    })
  }

  // ── Chat edit ────────────────────────────────────────────────────────────────

  const commitEdit = async (id: string) => {
    const trimmed = editValue.trim()
    const original = chats.find((c) => c.id === id)?.title
    if (trimmed && trimmed !== original) {
      try { await renameChat(id, trimmed); onRenameChat(id, trimmed) }
      catch { /* silent */ }
    }
    setEditingId(null)
  }

  // ── Filtering & grouping ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return chats
    const q = search.toLowerCase()
    return chats.filter((c) => c.title.toLowerCase().includes(q))
  }, [chats, search])

  const assignedIds = useMemo(
    () => new Set(Object.keys(chatProject).filter((k) => chatProject[k])),
    [chatProject],
  )

  const pinnedChats = useMemo(
    () => filtered.filter((c) => pinnedIds.includes(c.id)),
    [filtered, pinnedIds],
  )

  const unassignedUnpinned = useMemo(
    () => filtered.filter((c) => !assignedIds.has(c.id) && !pinnedIds.includes(c.id)),
    [filtered, assignedIds, pinnedIds],
  )

  const grouped = useMemo(() => {
    const map: Record<string, Chat[]> = {}
    for (const chat of unassignedUnpinned) {
      const g = getChatGroup(new Date(chat.createdAt))
      if (!map[g]) map[g] = []
      map[g].push(chat)
    }
    return GROUP_ORDER.filter((g) => map[g]?.length > 0).map((g) => ({ label: g, chats: map[g] }))
  }, [unassignedUnpinned])

  const chatsInProject = (projectId: string) =>
    filtered.filter((c) => chatProject[c.id] === projectId)

  const sharedRowProps = (chat: Chat) => ({
    chat,
    isActive: currentChatId === chat.id,
    isPinned: pinnedIds.includes(chat.id),
    projects,
    chatProject,
    editingId,
    editValue,
    isPendingDelete: pendingDeleteId === chat.id,
    onSelect: () => onSelectChat(chat.id),
    onRequestDelete: () => setPendingDeleteId(chat.id),
    onConfirmDelete: () => { onDeleteChat(chat.id); setPendingDeleteId(null) },
    onCancelDelete: () => setPendingDeleteId(null),
    onStartEdit: () => { setEditingId(chat.id); setEditValue(chat.title) },
    onEditChange: setEditValue,
    onCommitEdit: () => commitEdit(chat.id),
    onCancelEdit: () => setEditingId(null),
    onAssign: (pid: string | null) => assignChat(chat.id, pid),
    onTogglePin: () => togglePin(chat.id),
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
            <span className="text-sm font-semibold animate-in fade-in duration-200">Graviton</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn('h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0', isCollapsed && 'mx-auto')}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* New chat + search */}
        <div className={cn('p-2 space-y-1.5 shrink-0', isCollapsed && 'px-1.5')}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewChat}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 mx-auto flex rounded-2xl border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">New chat</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Button
                onClick={onNewChat}
                className="w-full justify-start gap-2 h-9 text-sm font-medium rounded-2xl bg-primary/10 text-primary hover:bg-primary/15 border-none shadow-none"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" /> New chat
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats…"
                  className="w-full h-8 pl-8 pr-7 text-xs bg-muted/20 border border-border/25 focus:outline-none focus:ring-1 focus:ring-primary/30 rounded-2xl placeholder:text-muted-foreground/25 text-foreground/70"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/35 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1 min-h-0 [&>[data-slot=scroll-area-scrollbar]]:hidden">
          <div className="pb-4">

            {/* Pinned section */}
            {!isCollapsed && pinnedChats.length > 0 && (
              <div className="mb-1">
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <Pin className="h-2.5 w-2.5 text-muted-foreground/30" />
                  <p className="text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-widest">Pinned</p>
                </div>
                <div className="space-y-0.5">
                  {pinnedChats.map((chat) => <ChatRow key={chat.id} {...sharedRowProps(chat)} />)}
                </div>
              </div>
            )}

            {/* Projects section */}
            {!isCollapsed && (
              <div className="mb-1">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-widest">Projects</p>
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground/25 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="New project"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {projects.length === 0 ? (
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 mx-1 text-[12px] text-muted-foreground/30 hover:text-foreground/60 hover:bg-muted/30 rounded-lg transition-all w-[calc(100%-8px)]"
                  >
                    <FolderPlus className="h-3.5 w-3.5" /> New project
                  </button>
                ) : (
                  <div className="space-y-0.5 px-1">
                    {projects.map((project) => {
                      const projectChats = chatsInProject(project.id)
                      const isCollapsedP = collapsedProjects.has(project.id)
                      return (
                        <div key={project.id}>
                          {/* Project header row */}
                          <div
                            className="group/proj flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted/25 transition-colors cursor-pointer select-none"
                            onClick={() => toggleProjectCollapse(project.id)}
                          >
                            <ChevronDown className={cn('h-3 w-3 text-muted-foreground/25 shrink-0 transition-transform duration-200', isCollapsedP && '-rotate-90')} />
                            <div className={cn('h-2 w-2 rounded-full shrink-0 transition-colors', COLOR_DOT[project.color] ?? 'bg-primary/50')} />

                            {editingProjectId === project.id ? (
                              <div className="flex-1 flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  value={editProjectValue}
                                  onChange={(e) => setEditProjectValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitProjectEdit(project.id)
                                    if (e.key === 'Escape') setEditingProjectId(null)
                                  }}
                                  className="h-6 flex-1 min-w-0 text-[12px] px-2 bg-muted/30 border border-border/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); commitProjectEdit(project.id) }}
                                  className="h-5 w-5 rounded flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 shrink-0"
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingProjectId(null) }}
                                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/40 hover:bg-muted/50 shrink-0"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="flex-1 text-[12px] font-medium text-foreground/55 truncate">{project.name}</span>
                            )}

                            {!editingProjectId && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover/proj:opacity-100 transition-opacity shrink-0">
                                <span className="text-[10px] text-muted-foreground/25 mr-0.5">{projectChats.length}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); setEditProjectValue(project.name) }}
                                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/25 hover:text-foreground hover:bg-muted/60"
                                >
                                  <Pencil className="h-2.5 w-2.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteProject(project.id) }}
                                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/25 hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Project chats */}
                          {!isCollapsedP && (
                            <div className="ml-5 pl-2 border-l border-border/20 space-y-0.5 mb-0.5">
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
                )}
              </div>
            )}

            {/* Date-grouped chats */}
            {filtered.length === 0 && !isCollapsed && (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground/30">
                {search ? 'No chats match your search' : 'No conversations yet'}
              </p>
            )}

            {grouped.map(({ label, chats: groupChats }) => (
              <div key={label} className="mb-1">
                {!isCollapsed && (
                  <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-widest">{label}</p>
                )}
                <div className="space-y-0.5">
                  {groupChats.map((chat) =>
                    isCollapsed ? (
                      <Tooltip key={chat.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSelectChat(chat.id)}
                            className={cn(
                              'h-9 w-9 mx-auto flex rounded-xl transition-all',
                              currentChatId === chat.id
                                ? 'bg-primary/15 text-primary'
                                : 'text-muted-foreground/35 hover:text-foreground hover:bg-muted/50',
                            )}
                          >
                            <div className="h-2 w-2 rounded-full bg-current opacity-50" />
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

        {/* Create project dialog */}
        <CreateProjectDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={createProject}
        />
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
    </TooltipProvider>
  )
}
