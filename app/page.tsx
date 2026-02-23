'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import {
  HiUsers,
  HiClipboardDocumentList,
  HiCalendarDays,
  HiExclamationTriangle,
  HiChatBubbleLeftRight,
  HiPaperAirplane,
  HiPlus,
  HiBell,
  HiMagnifyingGlass,
  HiChevronLeft,
  HiChevronRight,
  HiViewColumns,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiFunnel,
  HiBars3,
  HiXMark
} from 'react-icons/hi2'

// ---- AGENT IDS ----
const TASK_DASHBOARD_AGENT_ID = '699c3be7ca4c7a6958c97fe0'
const INTERN_COMM_AGENT_ID = '699c3be7f596b4aad7bce3b3'

// ---- TYPES ----
interface Intern {
  id: string
  name: string
  avatar: string
  status: 'active' | 'on-leave'
  activeTasks: number
  avgProgress: number
  attendanceRate: number
  lastActive: string
  phone: string
}

interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  deadline: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'To Do' | 'In Progress' | 'Blocked' | 'Completed'
  progress: number
}

interface Activity {
  id: string
  internName: string
  action: string
  timestamp: string
  details: string
}

interface Message {
  id: string
  internId: string
  internName: string
  sender: 'agent' | 'intern'
  message: string
  timestamp: string
}

interface StatusMessage {
  text: string
  type: 'success' | 'error' | 'info'
}

type ScreenType = 'dashboard' | 'interns' | 'taskboard' | 'communications'

// ---- SAMPLE DATA ----
const SAMPLE_INTERNS: Intern[] = [
  { id: '1', name: 'Ravi Kumar', avatar: 'RK', status: 'active', activeTasks: 3, avgProgress: 65, attendanceRate: 95, lastActive: '2 hours ago', phone: '+91-9876543210' },
  { id: '2', name: 'Priya Sharma', avatar: 'PS', status: 'active', activeTasks: 2, avgProgress: 80, attendanceRate: 92, lastActive: '30 min ago', phone: '+91-9876543211' },
  { id: '3', name: 'Arjun Mehta', avatar: 'AM', status: 'active', activeTasks: 4, avgProgress: 45, attendanceRate: 88, lastActive: '1 hour ago', phone: '+91-9876543212' },
  { id: '4', name: 'Sneha Patel', avatar: 'SP', status: 'on-leave', activeTasks: 1, avgProgress: 90, attendanceRate: 98, lastActive: '1 day ago', phone: '+91-9876543213' },
  { id: '5', name: 'Vikram Singh', avatar: 'VS', status: 'active', activeTasks: 2, avgProgress: 55, attendanceRate: 85, lastActive: '15 min ago', phone: '+91-9876543214' },
]

const SAMPLE_TASKS: Task[] = [
  { id: 'TASK-001', title: 'API Integration Module', description: 'Integrate payment gateway API', assignedTo: 'Ravi Kumar', deadline: '2026-03-01', priority: 'high', status: 'In Progress', progress: 60 },
  { id: 'TASK-002', title: 'Landing Page Design', description: 'Design the main landing page', assignedTo: 'Priya Sharma', deadline: '2026-02-28', priority: 'medium', status: 'In Progress', progress: 75 },
  { id: 'TASK-003', title: 'Database Schema Update', description: 'Update user table schema', assignedTo: 'Arjun Mehta', deadline: '2026-02-25', priority: 'urgent', status: 'Blocked', progress: 30 },
  { id: 'TASK-004', title: 'Unit Test Suite', description: 'Write unit tests for auth module', assignedTo: 'Ravi Kumar', deadline: '2026-03-05', priority: 'low', status: 'To Do', progress: 0 },
  { id: 'TASK-005', title: 'UI Component Library', description: 'Build reusable component library', assignedTo: 'Sneha Patel', deadline: '2026-03-10', priority: 'medium', status: 'Completed', progress: 100 },
  { id: 'TASK-006', title: 'Performance Optimization', description: 'Optimize page load times', assignedTo: 'Vikram Singh', deadline: '2026-03-03', priority: 'high', status: 'In Progress', progress: 40 },
  { id: 'TASK-007', title: 'Bug Fix - Login Flow', description: 'Fix intermittent login failures', assignedTo: 'Arjun Mehta', deadline: '2026-02-24', priority: 'urgent', status: 'To Do', progress: 0 },
  { id: 'TASK-008', title: 'Documentation Update', description: 'Update API documentation', assignedTo: 'Priya Sharma', deadline: '2026-03-08', priority: 'low', status: 'To Do', progress: 0 },
]

const SAMPLE_ACTIVITIES: Activity[] = [
  { id: '1', internName: 'Priya Sharma', action: 'Submitted progress update', timestamp: '10 min ago', details: 'Landing Page Design - 75% complete' },
  { id: '2', internName: 'Ravi Kumar', action: 'Reported blocker resolved', timestamp: '25 min ago', details: 'API docs now available for integration' },
  { id: '3', internName: 'Arjun Mehta', action: 'Flagged blocker', timestamp: '1 hour ago', details: 'Database Schema Update - waiting for DBA approval' },
  { id: '4', internName: 'Vikram Singh', action: 'Checked in for the day', timestamp: '2 hours ago', details: 'Working on Performance Optimization today' },
  { id: '5', internName: 'Sneha Patel', action: 'Completed task', timestamp: '1 day ago', details: 'UI Component Library - all components delivered' },
]

const SAMPLE_MESSAGES: Message[] = [
  { id: '1', internId: '1', internName: 'Ravi Kumar', sender: 'agent', message: 'Hi Ravi! You have been assigned: API Integration Module. Deadline: March 1. Priority: High.', timestamp: '2026-02-22T10:00:00Z' },
  { id: '2', internId: '1', internName: 'Ravi Kumar', sender: 'intern', message: 'Got it! Starting right away. Will need API docs from the team.', timestamp: '2026-02-22T10:15:00Z' },
  { id: '3', internId: '1', internName: 'Ravi Kumar', sender: 'agent', message: 'Great! I have notified the team about the API docs. Keep me updated on progress.', timestamp: '2026-02-22T10:20:00Z' },
  { id: '4', internId: '2', internName: 'Priya Sharma', sender: 'agent', message: 'Hi Priya! Your task: Landing Page Design. Please share progress by end of day.', timestamp: '2026-02-22T09:00:00Z' },
  { id: '5', internId: '2', internName: 'Priya Sharma', sender: 'intern', message: 'Header and footer done. Working on hero section. 75% complete. Blocker: waiting for brand guidelines.', timestamp: '2026-02-23T14:30:00Z' },
  { id: '6', internId: '3', internName: 'Arjun Mehta', sender: 'agent', message: 'Daily check-in: How is the Database Schema Update going?', timestamp: '2026-02-23T09:00:00Z' },
  { id: '7', internId: '3', internName: 'Arjun Mehta', sender: 'intern', message: 'Stuck at 30%. Need DBA approval for the new schema changes.', timestamp: '2026-02-23T09:30:00Z' },
]

// ---- HELPERS ----
function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-600', 'bg-emerald-600', 'bg-amber-600',
    'bg-violet-600', 'bg-rose-600', 'bg-cyan-600',
    'bg-indigo-600', 'bg-teal-600'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-600 text-white'
    case 'high': return 'bg-orange-500 text-white'
    case 'medium': return 'bg-yellow-500 text-black'
    case 'low': return 'bg-green-600 text-white'
    default: return 'bg-muted text-muted-foreground'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Completed': return 'bg-emerald-600 text-white'
    case 'In Progress': return 'bg-blue-600 text-white'
    case 'Blocked': return 'bg-red-600 text-white'
    case 'To Do': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts)
    if (isNaN(date.getTime())) return ts
    return date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

// ---- ERROR BOUNDARY ----
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- STATUS BANNER ----
function StatusBanner({ status, onDismiss }: { status: StatusMessage | null; onDismiss: () => void }) {
  if (!status) return null
  const bgColor = status.type === 'success' ? 'bg-emerald-600' : status.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  return (
    <div className={`${bgColor} text-white px-4 py-2 text-sm flex items-center justify-between rounded-sm mb-3`}>
      <div className="flex items-center gap-2">
        {status.type === 'success' && <HiCheckCircle className="w-4 h-4" />}
        {status.type === 'error' && <HiXCircle className="w-4 h-4" />}
        {status.type === 'info' && <HiClock className="w-4 h-4" />}
        <span>{status.text}</span>
      </div>
      <button onClick={onDismiss} className="ml-4 hover:opacity-80"><HiXMark className="w-4 h-4" /></button>
    </div>
  )
}

// ---- LOADING SKELETON ----
function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="animate-pulse bg-muted rounded-sm h-4 w-3/4" />
      <div className="animate-pulse bg-muted rounded-sm h-4 w-1/2" />
      <div className="animate-pulse bg-muted rounded-sm h-4 w-5/6" />
      <div className="animate-pulse bg-muted rounded-sm h-8 w-1/3 mt-4" />
    </div>
  )
}

// ---- SIDEBAR ----
function Sidebar({ activeScreen, onNavigate, collapsed, onToggle }: {
  activeScreen: ScreenType
  onNavigate: (s: ScreenType) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const navItems: { key: ScreenType; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <HiViewColumns className="w-5 h-5" /> },
    { key: 'interns', label: 'Interns', icon: <HiUsers className="w-5 h-5" /> },
    { key: 'taskboard', label: 'Task Board', icon: <HiClipboardDocumentList className="w-5 h-5" /> },
    { key: 'communications', label: 'Communications', icon: <HiChatBubbleLeftRight className="w-5 h-5" /> },
  ]

  return (
    <div className={`fixed left-0 top-0 h-full bg-card border-r border-border flex flex-col z-30 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}>
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!collapsed && <span className="font-semibold text-sm text-foreground tracking-tight">InternSync</span>}
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground p-1">
          {collapsed ? <HiChevronRight className="w-4 h-4" /> : <HiChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${activeScreen === item.key ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">A</div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Amit</p>
              <p className="text-xs text-muted-foreground truncate">Manager</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- HEADER ----
function Header({ activeScreen, collapsed }: { activeScreen: ScreenType; collapsed: boolean }) {
  const titles: Record<ScreenType, string> = {
    dashboard: 'Dashboard Overview',
    interns: 'Intern Management',
    taskboard: 'Task Board',
    communications: 'Communications',
  }
  return (
    <header className={`fixed top-0 right-0 h-12 bg-card border-b border-border flex items-center justify-between px-4 z-20 transition-all duration-200 ${collapsed ? 'left-14' : 'left-52'}`}>
      <h1 className="text-sm font-semibold text-foreground">{titles[activeScreen]}</h1>
      <div className="flex items-center gap-3">
        <button className="relative text-muted-foreground hover:text-foreground">
          <HiBell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">A</div>
          <span className="text-sm text-foreground font-medium">Amit</span>
        </div>
      </div>
    </header>
  )
}

// ---- STAT CARD ----
function StatCard({ title, value, icon, trend, trendUp, accent }: {
  title: string; value: string | number; icon: React.ReactNode; trend?: string; trendUp?: boolean; accent?: boolean
}) {
  return (
    <Card className={`${accent ? 'border-destructive/40' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</span>
          <span className={`${accent ? 'text-destructive' : 'text-muted-foreground'}`}>{icon}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className={`text-2xl font-semibold ${accent ? 'text-destructive' : 'text-foreground'}`}>{value}</span>
          {trend && (
            <span className={`text-xs flex items-center gap-0.5 ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {trendUp ? <HiArrowTrendingUp className="w-3 h-3" /> : <HiArrowTrendingDown className="w-3 h-3" />}
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---- DASHBOARD SCREEN ----
function DashboardScreen({ tasks, activities, interns }: { tasks: Task[]; activities: Activity[]; interns: Intern[] }) {
  const activeInternCount = interns.filter(i => i.status === 'active').length
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length
  const avgAttendance = interns.length > 0 ? Math.round(interns.reduce((s, i) => s + i.attendanceRate, 0) / interns.length) : 0
  const overdueItems = tasks.filter(t => {
    try { return t.status !== 'Completed' && new Date(t.deadline) < new Date('2026-02-23') } catch { return false }
  }).length

  const statusCounts = {
    'To Do': tasks.filter(t => t.status === 'To Do').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'Blocked': tasks.filter(t => t.status === 'Blocked').length,
    'Completed': tasks.filter(t => t.status === 'Completed').length,
  }
  const totalTasks = tasks.length || 1

  const topPerformers = [...interns].sort((a, b) => b.avgProgress - a.avgProgress).slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Active Interns" value={activeInternCount} icon={<HiUsers className="w-5 h-5" />} trend="+1 this week" trendUp />
        <StatCard title="Pending Tasks" value={pendingTasks} icon={<HiClipboardDocumentList className="w-5 h-5" />} trend="3 new today" trendUp />
        <StatCard title="Attendance Rate" value={`${avgAttendance}%`} icon={<HiCalendarDays className="w-5 h-5" />} trend="+2% vs last week" trendUp />
        <StatCard title="Overdue Items" value={overdueItems} icon={<HiExclamationTriangle className="w-5 h-5" />} trend={overdueItems > 0 ? 'Needs attention' : 'All clear'} trendUp={overdueItems === 0} accent={overdueItems > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <ScrollArea className="h-[300px]">
              <div className="space-y-0">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <Avatar className="w-7 h-7 mt-0.5">
                      <AvatarFallback className={`text-[10px] text-white ${getAvatarColor(act.internName)}`}>
                        {act.internName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium text-foreground">{act.internName}</span>{' '}
                        <span className="text-muted-foreground">{act.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{act.details}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">{act.timestamp}</span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm font-semibold">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{status}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-sm h-2">
                    <div
                      className={`h-2 rounded-sm transition-all ${status === 'Completed' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-blue-500' : status === 'Blocked' ? 'bg-red-500' : 'bg-gray-400'}`}
                      style={{ width: `${(count / totalTasks) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm font-semibold">Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
              {topPerformers.map((intern, idx) => (
                <div key={intern.id} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-4">{idx + 1}.</span>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className={`text-[9px] text-white ${getAvatarColor(intern.name)}`}>{intern.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{intern.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{intern.avgProgress}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---- INTERN MANAGEMENT SCREEN ----
function InternScreen({ interns, tasks, messages, onSendMessage, loading, activeAgentId }: {
  interns: Intern[]
  tasks: Task[]
  messages: Message[]
  onSendMessage: (internName: string, msg: string) => Promise<void>
  loading: boolean
  activeAgentId: string | null
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null)
  const [messageInput, setMessageInput] = useState('')

  const filtered = interns.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const internTasks = (name: string) => tasks.filter(t => t.assignedTo === name)
  const internMessages = (id: string) => messages.filter(m => m.internId === id)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search interns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs py-2">Name</TableHead>
                <TableHead className="text-xs py-2">Active Tasks</TableHead>
                <TableHead className="text-xs py-2">Avg Progress</TableHead>
                <TableHead className="text-xs py-2">Attendance</TableHead>
                <TableHead className="text-xs py-2">Last Active</TableHead>
                <TableHead className="text-xs py-2">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((intern) => (
                <TableRow key={intern.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedIntern(intern)}>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className={`text-[10px] text-white ${getAvatarColor(intern.name)}`}>{intern.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{intern.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-sm">{intern.activeTasks}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <Progress value={intern.avgProgress} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground">{intern.avgProgress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-sm">{intern.attendanceRate}%</TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">{intern.lastActive}</TableCell>
                  <TableCell className="py-2">
                    <Badge variant={intern.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {intern.status === 'active' ? 'Active' : 'On Leave'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No interns found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedIntern} onOpenChange={(open) => { if (!open) setSelectedIntern(null) }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {selectedIntern && (
                <>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`text-sm text-white ${getAvatarColor(selectedIntern.name)}`}>{selectedIntern.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-base font-semibold">{selectedIntern.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{selectedIntern.phone}</div>
                  </div>
                </>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">Details for {selectedIntern?.name ?? 'intern'}</SheetDescription>
          </SheetHeader>

          {selectedIntern && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Card><CardContent className="p-2 text-center"><p className="text-lg font-semibold">{selectedIntern.activeTasks}</p><p className="text-[10px] text-muted-foreground">Tasks</p></CardContent></Card>
                <Card><CardContent className="p-2 text-center"><p className="text-lg font-semibold">{selectedIntern.avgProgress}%</p><p className="text-[10px] text-muted-foreground">Progress</p></CardContent></Card>
                <Card><CardContent className="p-2 text-center"><p className="text-lg font-semibold">{selectedIntern.attendanceRate}%</p><p className="text-[10px] text-muted-foreground">Attendance</p></CardContent></Card>
              </div>

              <Separator />

              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Assigned Tasks</h4>
                <div className="space-y-2">
                  {internTasks(selectedIntern.name).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 border border-border rounded-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">{task.title}</span>
                          <Badge className={`text-[9px] ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
                        </div>
                        <Progress value={task.progress} className="h-1 mt-1" />
                      </div>
                      <Badge className={`text-[9px] whitespace-nowrap ${getStatusColor(task.status)}`}>{task.status}</Badge>
                    </div>
                  ))}
                  {internTasks(selectedIntern.name).length === 0 && (
                    <p className="text-xs text-muted-foreground">No tasks assigned</p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Recent Messages</h4>
                <ScrollArea className="h-[160px]">
                  <div className="space-y-2">
                    {internMessages(selectedIntern.id).map((msg) => (
                      <div key={msg.id} className={`p-2 rounded-sm text-xs ${msg.sender === 'agent' ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{msg.sender === 'agent' ? 'System' : msg.internName}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    ))}
                    {internMessages(selectedIntern.id).length === 0 && (
                      <p className="text-xs text-muted-foreground">No messages yet</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Send Message</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Message ${selectedIntern.name}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="h-8 text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageInput.trim()) {
                        onSendMessage(selectedIntern.name, messageInput.trim())
                        setMessageInput('')
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    disabled={!messageInput.trim() || loading}
                    onClick={() => {
                      if (messageInput.trim()) {
                        onSendMessage(selectedIntern.name, messageInput.trim())
                        setMessageInput('')
                      }
                    }}
                  >
                    {loading && activeAgentId === TASK_DASHBOARD_AGENT_ID ? (
                      <span className="animate-spin"><HiClock className="w-4 h-4" /></span>
                    ) : (
                      <HiPaperAirplane className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ---- TASK BOARD SCREEN ----
function TaskBoardScreen({ tasks, interns, onAssignTask, onMoveTask, loading, activeAgentId }: {
  tasks: Task[]
  interns: Intern[]
  onAssignTask: (data: { title: string; description: string; assignedTo: string; deadline: string; priority: string }) => Promise<void>
  onMoveTask: (taskId: string, newStatus: Task['status']) => void
  loading: boolean
  activeAgentId: string | null
}) {
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterIntern, setFilterIntern] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', assignedTo: '', deadline: '', priority: 'medium' })

  const columns: Task['status'][] = ['To Do', 'In Progress', 'Blocked', 'Completed']

  const filteredTasks = tasks.filter(t => {
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority
    const matchesIntern = filterIntern === 'all' || t.assignedTo === filterIntern
    return matchesPriority && matchesIntern
  })

  const getNextStatuses = (current: Task['status']): Task['status'][] => {
    switch (current) {
      case 'To Do': return ['In Progress']
      case 'In Progress': return ['Blocked', 'Completed']
      case 'Blocked': return ['In Progress', 'To Do']
      case 'Completed': return []
      default: return []
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.assignedTo || !formData.deadline) return
    await onAssignTask(formData)
    setFormData({ title: '', description: '', assignedTo: '', deadline: '', priority: 'medium' })
    setDialogOpen(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-sm gap-1">
              <HiPlus className="w-4 h-4" /> Assign Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Assign New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Task Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Enter task title" className="h-8 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Task description..." className="text-sm mt-1" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Assign To *</Label>
                  <Select value={formData.assignedTo} onValueChange={(v) => setFormData(prev => ({ ...prev, assignedTo: v }))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select intern" /></SelectTrigger>
                    <SelectContent>
                      {interns.filter(i => i.status === 'active').map((i) => (
                        <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Priority *</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Deadline *</Label>
                <Input type="date" value={formData.deadline} onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))} className="h-8 text-sm mt-1" />
              </div>
            </div>
            <DialogFooter className="mt-3">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-8 text-sm">Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!formData.title.trim() || !formData.assignedTo || !formData.deadline || loading} className="h-8 text-sm">
                {loading && activeAgentId === TASK_DASHBOARD_AGENT_ID ? (
                  <span className="flex items-center gap-1"><span className="animate-spin"><HiClock className="w-3 h-3" /></span> Processing...</span>
                ) : 'Assign Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2 ml-auto">
          <HiFunnel className="w-4 h-4 text-muted-foreground" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterIntern} onValueChange={setFilterIntern}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Intern" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Interns</SelectItem>
              {interns.map((i) => (
                <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col)
          return (
            <div key={col} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col === 'Completed' ? 'bg-emerald-500' : col === 'In Progress' ? 'bg-blue-500' : col === 'Blocked' ? 'bg-red-500' : 'bg-gray-400'}`} />
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{col}</h3>
                </div>
                <Badge variant="secondary" className="text-[10px]">{colTasks.length}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-230px)]">
                <div className="space-y-2 pr-1">
                  {colTasks.map((task) => (
                    <Card key={task.id} className="group">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground font-mono">{task.id}</span>
                          <Badge className={`text-[9px] ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
                        </div>
                        <h4 className="text-sm font-medium text-foreground mb-1 leading-tight">{task.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className={`text-[8px] text-white ${getAvatarColor(task.assignedTo)}`}>
                              {task.assignedTo.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-muted-foreground">{task.assignedTo}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <HiClock className="w-3 h-3" />
                            {task.deadline}
                          </span>
                          <span className="text-[10px] font-medium">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1 mb-2" />
                        {getNextStatuses(task.status).length > 0 && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {getNextStatuses(task.status).map((nextStatus) => (
                              <Button key={nextStatus} variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={() => onMoveTask(task.id, nextStatus)}>
                                {nextStatus}
                              </Button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-sm">
                      No tasks
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- COMMUNICATIONS SCREEN ----
function CommunicationsScreen({ messages, interns, onSendMessage, onSimulateReply, loading, activeAgentId }: {
  messages: Message[]
  interns: Intern[]
  onSendMessage: (internName: string, msg: string) => Promise<void>
  onSimulateReply: (internName: string, msg: string) => Promise<void>
  loading: boolean
  activeAgentId: string | null
}) {
  const [selectedInternId, setSelectedInternId] = useState<string>(interns.length > 0 ? interns[0].id : '')
  const [messageInput, setMessageInput] = useState('')
  const [simulateInput, setSimulateInput] = useState('')
  const [showSimulate, setShowSimulate] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const uniqueInternIds = Array.from(new Set(messages.map(m => m.internId)))
  const conversationInterns = interns.filter(i => uniqueInternIds.includes(i.id))
  const allInternsList = interns.length > 0 ? interns : []

  const selectedIntern = interns.find(i => i.id === selectedInternId)
  const currentMessages = messages.filter(m => m.internId === selectedInternId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages.length])

  const lastMessageForIntern = (internId: string) => {
    const internMsgs = messages.filter(m => m.internId === internId)
    return internMsgs.length > 0 ? internMsgs[internMsgs.length - 1] : null
  }

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedIntern) return
    await onSendMessage(selectedIntern.name, messageInput.trim())
    setMessageInput('')
  }

  const handleSimulate = async () => {
    if (!simulateInput.trim() || !selectedIntern) return
    await onSimulateReply(selectedIntern.name, simulateInput.trim())
    setSimulateInput('')
    setShowSimulate(false)
  }

  return (
    <div className="flex h-[calc(100vh-80px)] border border-border rounded-sm overflow-hidden">
      <div className="w-64 border-r border-border flex flex-col bg-card">
        <div className="p-2 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Conversations</h3>
        </div>
        <ScrollArea className="flex-1">
          {allInternsList.map((intern) => {
            const lastMsg = lastMessageForIntern(intern.id)
            return (
              <button
                key={intern.id}
                onClick={() => setSelectedInternId(intern.id)}
                className={`w-full flex items-start gap-2 p-2.5 text-left border-b border-border transition-colors ${selectedInternId === intern.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
              >
                <Avatar className="w-8 h-8 mt-0.5">
                  <AvatarFallback className={`text-[10px] text-white ${getAvatarColor(intern.name)}`}>{intern.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground truncate">{intern.name}</span>
                    {lastMsg && <span className="text-[9px] text-muted-foreground whitespace-nowrap ml-1">{formatTimestamp(lastMsg.timestamp)}</span>}
                  </div>
                  {lastMsg && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{lastMsg.message}</p>
                  )}
                  {!lastMsg && (
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">No messages yet</p>
                  )}
                </div>
              </button>
            )
          })}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-background">
        {selectedIntern ? (
          <>
            <div className="flex items-center justify-between p-3 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className={`text-[10px] text-white ${getAvatarColor(selectedIntern.name)}`}>{selectedIntern.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedIntern.name}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedIntern.status === 'active' ? 'Online' : 'Away'} | {selectedIntern.phone}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setShowSimulate(!showSimulate)}>
                {showSimulate ? 'Hide' : 'Simulate Reply'}
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {currentMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] p-2.5 rounded-sm text-xs ${msg.sender === 'agent' ? 'bg-card border border-border text-foreground' : 'bg-primary text-primary-foreground'}`}>
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className="font-medium text-[10px]">{msg.sender === 'agent' ? 'InternSync' : msg.internName}</span>
                        <span className={`text-[9px] ${msg.sender === 'agent' ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                      <p className="leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))}
                {currentMessages.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    <HiChatBubbleLeftRight className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No messages with {selectedIntern.name} yet.</p>
                    <p className="text-xs mt-1">Send a message to start the conversation.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {showSimulate && (
              <div className="p-2 border-t border-border bg-muted/30">
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">Simulate {selectedIntern.name}:</span>
                  <Input
                    placeholder="Type as intern..."
                    value={simulateInput}
                    onChange={(e) => setSimulateInput(e.target.value)}
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSimulate() }}
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-[10px]" onClick={handleSimulate} disabled={!simulateInput.trim() || loading}>
                    {loading && activeAgentId === INTERN_COMM_AGENT_ID ? <span className="animate-spin"><HiClock className="w-3 h-3" /></span> : 'Send'}
                  </Button>
                </div>
              </div>
            )}

            <div className="p-2 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message ${selectedIntern.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="h-8 text-sm flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                />
                <Button size="sm" className="h-8" onClick={handleSend} disabled={!messageInput.trim() || loading}>
                  {loading && activeAgentId === TASK_DASHBOARD_AGENT_ID ? (
                    <span className="animate-spin"><HiClock className="w-4 h-4" /></span>
                  ) : (
                    <HiPaperAirplane className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}

// ---- AGENT INFO PANEL ----
function AgentInfoPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: TASK_DASHBOARD_AGENT_ID, name: 'Task & Dashboard Manager', purpose: 'Assigns tasks, sends reminders, manages dashboard data' },
    { id: INTERN_COMM_AGENT_ID, name: 'Intern Communication Agent', purpose: 'Processes intern messages, extracts data, updates metrics' },
  ]
  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide">Agent Status</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{activeAgentId === agent.id ? 'Processing...' : agent.purpose}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ---- MAIN PAGE ----
export default function Page() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sampleData, setSampleData] = useState(true)
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  const [interns, setInterns] = useState<Intern[]>(SAMPLE_INTERNS)
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS)
  const [activities, setActivities] = useState<Activity[]>(SAMPLE_ACTIVITIES)
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES)

  const statusTimerRef = useRef<NodeJS.Timeout | null>(null)

  const showStatus = useCallback((text: string, type: StatusMessage['type']) => {
    setStatusMessage({ text, type })
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), 4000)
  }, [])

  useEffect(() => {
    if (sampleData) {
      setInterns(SAMPLE_INTERNS)
      setTasks(SAMPLE_TASKS)
      setActivities(SAMPLE_ACTIVITIES)
      setMessages(SAMPLE_MESSAGES)
    } else {
      setInterns([])
      setTasks([])
      setActivities([])
      setMessages([])
    }
  }, [sampleData])

  const generateTaskId = () => {
    const maxId = tasks.reduce((max, t) => {
      const num = parseInt(t.id.replace('TASK-', ''), 10)
      return isNaN(num) ? max : Math.max(max, num)
    }, 0)
    return `TASK-${String(maxId + 1).padStart(3, '0')}`
  }

  const generateMessageId = () => {
    return String(messages.length + 1 + Math.floor(Math.random() * 1000))
  }

  const handleAssignTask = async (data: { title: string; description: string; assignedTo: string; deadline: string; priority: string }) => {
    setLoading(true)
    setActiveAgentId(TASK_DASHBOARD_AGENT_ID)
    try {
      const message = `Assign task: "${data.title}" to ${data.assignedTo}. Description: ${data.description}. Deadline: ${data.deadline}. Priority: ${data.priority}.`
      const result = await callAIAgent(message, TASK_DASHBOARD_AGENT_ID)

      if (result.success && result?.response?.result) {
        const agentData = result.response.result
        const taskDetails = agentData?.task_details
        const newTask: Task = {
          id: taskDetails?.task_id || generateTaskId(),
          title: taskDetails?.title || data.title,
          description: taskDetails?.description || data.description,
          assignedTo: taskDetails?.assigned_to || data.assignedTo,
          deadline: taskDetails?.deadline || data.deadline,
          priority: (taskDetails?.priority || data.priority) as Task['priority'],
          status: (taskDetails?.status || 'To Do') as Task['status'],
          progress: taskDetails?.progress ?? 0,
        }
        setTasks(prev => [...prev, newTask])

        if (agentData?.message_to_intern) {
          const intern = interns.find(i => i.name === data.assignedTo)
          if (intern) {
            const newMsg: Message = {
              id: generateMessageId(),
              internId: intern.id,
              internName: intern.name,
              sender: 'agent',
              message: agentData.message_to_intern,
              timestamp: new Date().toISOString(),
            }
            setMessages(prev => [...prev, newMsg])
          }
        }

        const newActivity: Activity = {
          id: String(activities.length + 1),
          internName: data.assignedTo,
          action: 'New task assigned',
          timestamp: 'Just now',
          details: `${data.title} - Priority: ${data.priority}`,
        }
        setActivities(prev => [newActivity, ...prev])

        showStatus(agentData?.status_message || `Task "${data.title}" assigned to ${data.assignedTo}`, 'success')
      } else {
        const newTask: Task = {
          id: generateTaskId(),
          title: data.title,
          description: data.description,
          assignedTo: data.assignedTo,
          deadline: data.deadline,
          priority: data.priority as Task['priority'],
          status: 'To Do',
          progress: 0,
        }
        setTasks(prev => [...prev, newTask])
        showStatus(result?.error || 'Agent unavailable, task added locally.', 'info')
      }
    } catch (err) {
      showStatus('Failed to assign task. Please try again.', 'error')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const progress = newStatus === 'Completed' ? 100 : newStatus === 'To Do' ? 0 : t.progress
        return { ...t, status: newStatus, progress }
      }
      return t
    }))
    showStatus(`Task ${taskId} moved to ${newStatus}`, 'info')
  }

  const handleSendMessage = async (internName: string, msg: string) => {
    setLoading(true)
    setActiveAgentId(TASK_DASHBOARD_AGENT_ID)
    try {
      const agentMessage = `Send message to ${internName}: ${msg}`
      const result = await callAIAgent(agentMessage, TASK_DASHBOARD_AGENT_ID)

      const intern = interns.find(i => i.name === internName)
      if (!intern) {
        showStatus('Intern not found', 'error')
        return
      }

      if (result.success && result?.response?.result) {
        const agentData = result.response.result
        const outgoingMsg: Message = {
          id: generateMessageId(),
          internId: intern.id,
          internName: intern.name,
          sender: 'agent',
          message: agentData?.message_to_intern || msg,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, outgoingMsg])
        showStatus(agentData?.status_message || `Message sent to ${internName}`, 'success')
      } else {
        const outgoingMsg: Message = {
          id: generateMessageId(),
          internId: intern.id,
          internName: intern.name,
          sender: 'agent',
          message: msg,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, outgoingMsg])
        showStatus('Message added locally (agent unavailable)', 'info')
      }
    } catch (err) {
      showStatus('Failed to send message', 'error')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleSimulateReply = async (internName: string, msg: string) => {
    setLoading(true)
    setActiveAgentId(INTERN_COMM_AGENT_ID)
    try {
      const agentMessage = `Intern ${internName} says: ${msg}`
      const result = await callAIAgent(agentMessage, INTERN_COMM_AGENT_ID)

      const intern = interns.find(i => i.name === internName)
      if (!intern) {
        showStatus('Intern not found', 'error')
        return
      }

      const internMsg: Message = {
        id: generateMessageId(),
        internId: intern.id,
        internName: intern.name,
        sender: 'intern',
        message: msg,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, internMsg])

      if (result.success && result?.response?.result) {
        const agentData = result.response.result
        const extractedData = agentData?.extracted_data
        const dashboardUpdates = agentData?.dashboard_updates

        if (agentData?.confirmation_message) {
          const confirmMsg: Message = {
            id: generateMessageId(),
            internId: intern.id,
            internName: intern.name,
            sender: 'agent',
            message: agentData.confirmation_message,
            timestamp: new Date().toISOString(),
          }
          setMessages(prev => [...prev, confirmMsg])
        }

        if (extractedData?.progress_percentage != null && extractedData?.task_id) {
          setTasks(prev => prev.map(t => {
            if (t.id === extractedData.task_id || t.assignedTo === internName) {
              return { ...t, progress: extractedData.progress_percentage, status: (dashboardUpdates?.new_status || t.status) as Task['status'] }
            }
            return t
          }))
        }

        if (agentData?.activity_log_entry) {
          const newActivity: Activity = {
            id: String(activities.length + 1 + Math.floor(Math.random() * 100)),
            internName: agentData?.intern_name || internName,
            action: agentData.activity_log_entry?.action || 'Message received',
            timestamp: 'Just now',
            details: agentData.activity_log_entry?.details || msg,
          }
          setActivities(prev => [newActivity, ...prev])
        }

        showStatus(agentData?.confirmation_message || `Processed message from ${internName}`, 'success')
      } else {
        showStatus('Reply recorded locally (agent unavailable)', 'info')
      }
    } catch (err) {
      showStatus('Failed to process intern reply', 'error')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
        <Header activeScreen={activeScreen} collapsed={sidebarCollapsed} />

        <main className={`pt-12 transition-all duration-200 ${sidebarCollapsed ? 'ml-14' : 'ml-52'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {activeScreen === 'dashboard' && (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-7 text-xs gap-1"><HiPlus className="w-3 h-3" /> Assign Task</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle className="text-sm">Quick Assign Task</DialogTitle></DialogHeader>
                        <p className="text-xs text-muted-foreground">Use the Task Board for full task assignment form.</p>
                        <DialogFooter>
                          <Button size="sm" className="h-7 text-xs" onClick={() => setActiveScreen('taskboard')}>Go to Task Board</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setActiveScreen('communications')}>
                      <HiPaperAirplane className="w-3 h-3" /> Send Reminder
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
                <Switch id="sample-toggle" checked={sampleData} onCheckedChange={setSampleData} />
              </div>
            </div>

            <StatusBanner status={statusMessage} onDismiss={() => setStatusMessage(null)} />

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-2 bg-muted/30 rounded-sm border border-border">
                <span className="animate-spin"><HiClock className="w-3.5 h-3.5" /></span>
                <span>Processing request...</span>
              </div>
            )}

            {activeScreen === 'dashboard' && (
              <DashboardScreen tasks={tasks} activities={activities} interns={interns} />
            )}

            {activeScreen === 'interns' && (
              <InternScreen
                interns={interns}
                tasks={tasks}
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
                activeAgentId={activeAgentId}
              />
            )}

            {activeScreen === 'taskboard' && (
              <TaskBoardScreen
                tasks={tasks}
                interns={interns}
                onAssignTask={handleAssignTask}
                onMoveTask={handleMoveTask}
                loading={loading}
                activeAgentId={activeAgentId}
              />
            )}

            {activeScreen === 'communications' && (
              <CommunicationsScreen
                messages={messages}
                interns={interns}
                onSendMessage={handleSendMessage}
                onSimulateReply={handleSimulateReply}
                loading={loading}
                activeAgentId={activeAgentId}
              />
            )}

            <div className="mt-4">
              <AgentInfoPanel activeAgentId={activeAgentId} />
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
