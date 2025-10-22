'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Home, BarChart3, Users, LogOut, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface NavigationProps {
  user: any
  userRole: string
}

export function Navigation({ user, userRole }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useClerk()
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
    toast.success('Signed out successfully')
  }

  const isAnalyticsActive = pathname.startsWith('/analytics')

  const analyticsSubItems = [
    { href: '/analytics/entity', label: 'Entity' },
    { href: '/analytics/platform', label: 'Platform' },
  ]

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: Home },
  ]

  if (userRole === 'admin') {
    navItems.push({ href: '/admin', label: 'Admin', icon: Users })
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-blue-600" />
              <span className="text-xl font-bold">AEO Dashboard</span>
            </Link>
            <div className="hidden md:flex space-x-1 items-center">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Analytics Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setShowAnalyticsDropdown(true)}
                onMouseLeave={() => setShowAnalyticsDropdown(false)}
              >
                <button
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isAnalyticsActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showAnalyticsDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showAnalyticsDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    {analyticsSubItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          pathname === subItem.href
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Role: {userRole}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}