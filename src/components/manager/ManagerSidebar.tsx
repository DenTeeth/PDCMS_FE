'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogoutButton } from '@/components/auth/LogoutButton'

import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Users,
  Settings,
  UserCircle2,
  Menu,
  X,
  ChevronRight,
  CircleDot,
  LucideIcon
} from 'lucide-react'

interface Route {
  icon: LucideIcon
  label: string
  href: string
}

const routes: Route[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/manager',
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    href: '/manager/analytics',
  },
  {
    icon: Calendar,
    label: 'Appointments',
    href: '/manager/appointments',
  },
  {
    icon: Users,
    label: 'Employees',
    href: '/manager/employees',
  },
  {
    icon: BarChart3,
    label: 'Feedback & Ratings',
    href: '/manager/feedback',
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/manager/settings',
  },
]

interface UserInfo {
  name: string
  status: 'online' | 'offline' | 'away'
  role: string
}

const userInfo: UserInfo = {
  name: 'Dr. Smith',
  status: 'online',
  role: 'Manager'
}

export default function ManagerSidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()

  const getStatusColor = (status: UserInfo['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-500'
      case 'away':
        return 'text-yellow-500'
      case 'offline':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-xl bg-card shadow-lg border border-border hover:shadow-xl transition-all duration-200"
        >
          {isOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-sidebar shadow-xl border-r border-sidebar-border transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border bg-gradient-to-r from-primary to-secondary">
            <h1 className="text-xl font-bold text-primary-foreground">PDCMS Manager</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {routes.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                     group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
                     ${isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25 transform scale-[1.02]'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-all duration-200 ${isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                    }`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-sidebar-primary-foreground/80" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-sidebar-border bg-sidebar-accent">
            <div className="flex items-center p-3 rounded-lg bg-card shadow-sm border border-border">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md">
                <span className="text-primary-foreground text-sm font-bold">M</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-card-foreground">Manager</p>
                <p className="text-xs text-muted-foreground">Manager</p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="mt-3">
              <LogoutButton variant="button" className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}