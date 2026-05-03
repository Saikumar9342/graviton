'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Search, Pencil, Check, X,
  Folder, FolderPlus, ChevronDown, MoreHorizontal, Pin, AlertTriangle, Lightbulb,
  MessageSquare, Clock, Zap,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'

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

// ── Search Chats Dialog ────────────────────────────────────────────────────────

function SearchChatsDialog({
  chats,
  onSelectChat,
}: {
  chats: Chat[]
  onSelectChat: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chats.slice(0, 10) // Show recent 10 if no search
    return chats.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [chats, searchTerm])

  const handleSelectChat = (id: string) => {
    onSelectChat(id)
    setOpen(false)
    setSearchTerm('')
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full justify-start gap-3 h-11 text-sm font-medium rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <span className="flex-1 text-left">Search chats…</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-0 gap-0 overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">Search chats</DialogTitle>
          <DialogDescription className="sr-only">Find and open your chats</DialogDescription>

          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-muted/10">
            <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            <input
              autoFocus
              placeholder="Search chats by title…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <ScrollArea className="max-h-[400px] w-full">
            <div className="p-2">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground/60">
                    {searchTerm ? 'No chats found' : 'No chats yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className="w-full flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-colors group text-left"
                    >
                      <MessageSquare className="h-4 w-4 text-primary/60 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {chat.title}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {new Date(chat.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Zap className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
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
              className="h-10 text-sm rounded-xl bg-muted/20 border-border/60 focus:border-primary/50"
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
        <span className="flex-1 text-[11px] text-destructive/90 font-medium truncate">Delete this chat?</span>
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
          isActive ? 'font-medium text-foreground' : 'font-normal text-foreground/80',
        )}
      >
        {shortTitle}
      </span>

      {/* ⋮ button + dropdown */}
      <div className="shrink-0">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
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
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="right" 
            align="start" 
            sideOffset={8}
            className="w-48 rounded-xl border border-border/40 bg-popover shadow-xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-left-1 duration-150 z-[100]"
          >
            <div className="p-1 space-y-0.5">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onStartEdit() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] cursor-pointer text-foreground/70 focus:bg-muted/60 focus:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                Rename
              </DropdownMenuItem>

              <DropdownMenuSub open={pickerOpen} onOpenChange={setPickerOpen}>
                <DropdownMenuSubTrigger
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] cursor-pointer text-foreground/70 focus:bg-muted/60 focus:text-foreground transition-colors"
                >
                  <Folder className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  Move to project
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent
                    className="w-44 rounded-xl border border-border/30 bg-popover shadow-xl shadow-black/20 overflow-hidden animate-in fade-in slide-in-from-left-1 duration-150 z-[110]"
                  >
                    <div className="p-1 space-y-0.5">
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onAssign(null) }}
                        className={cn('w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors', !chatProject[chat.id] ? 'bg-primary/10 text-primary' : 'text-muted-foreground/70 focus:bg-muted/50 focus:text-foreground')}
                      >
                        No project
                      </DropdownMenuItem>
                      {projects.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={(e) => { e.stopPropagation(); onAssign(p.id) }}
                          className={cn('w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors', chatProject[chat.id] === p.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground/70 focus:bg-muted/50 focus:text-foreground')}
                        >
                          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', COLOR_DOT[p.color] ?? 'bg-primary')} />
                          <span className="truncate">{p.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="my-0.5 mx-2 bg-border/25" />

              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onTogglePin() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] cursor-pointer text-foreground/70 focus:bg-muted/60 focus:text-foreground transition-colors"
              >
                <Pin className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                {isPinned ? 'Unpin chat' : 'Pin chat'}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-0.5 mx-2 bg-border/25" />

              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onRequestDelete() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] cursor-pointer text-destructive/80 focus:bg-destructive/10 focus:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3 shrink-0" />
                Delete chat
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
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
          isCollapsed ? 'w-[60px]' : 'w-[var(--sidebar-width)]',
        )}
        style={{ 
          backgroundColor: `color-mix(in srgb, var(--sidebar), transparent calc(100% - (var(--sidebar-opacity) * 100%)))`,
          backdropFilter: 'blur(var(--glass-blur))'
        }}
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
        <div className={cn('space-y-2 shrink-0', isCollapsed ? 'p-1.5' : 'p-[var(--sidebar-padding)]')}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewChat}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 mx-auto flex rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/20 hover:border-primary/50 text-primary hover:text-primary/90 transition-all"
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
                className="w-full justify-center gap-2 h-11 text-sm font-bold rounded-2xl"
              >
                <Plus className="h-5 w-5 shrink-0" />New Chat
              </Button>
              <SearchChatsDialog
                chats={chats}
                onSelectChat={onSelectChat}
              />
            </>
          )}
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1 min-h-0 scrollbar-none [&>[data-slot=scroll-area-viewport]]:scrollbar-none">
          <div className="pb-4">

            {/* Pinned section */}
            {!isCollapsed && pinnedChats.length > 0 && (
              <div className="mb-1">
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <Pin className="h-2.5 w-2.5 text-muted-foreground/60" />
                  <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Pinned</p>
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
                  <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Projects</p>
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="New project"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {projects.length === 0 ? (
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 mx-1 text-[12px] text-muted-foreground/80 font-medium hover:text-foreground hover:bg-muted/40 rounded-lg transition-all w-[calc(100%-8px)]"
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
                            <ChevronDown className={cn('h-3 w-3 text-muted-foreground/60 shrink-0 transition-transform duration-200', isCollapsedP && '-rotate-90')} />
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
                              <span className="flex-1 text-[12px] font-medium text-foreground/85 truncate">{project.name}</span>
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
                            <div className="ml-5 pl-2 project-indent-line space-y-0.5 mb-0.5">
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
                  <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">{label}</p>
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
