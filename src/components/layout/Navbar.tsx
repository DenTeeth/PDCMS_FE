'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn, getFullNameFromToken } from '@/lib/utils';
import { getToken } from '@/lib/cookies';

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Get full name from JWT token, fallback to username
  const displayName = useMemo(() => {
    const token = getToken();
    if (token) {
      const fullName = getFullNameFromToken(token);
      if (fullName) {
        return fullName;
      }
    }
    return user?.username || 'User';
  }, [user?.username]);

  // Get first letter for avatar (from full name if available, otherwise username)
  const avatarLetter = useMemo(() => {
    const token = getToken();
    if (token) {
      const fullName = getFullNameFromToken(token);
      if (fullName) {
        return fullName.charAt(0).toUpperCase();
      }
    }
    return (user?.username || 'U').charAt(0).toUpperCase();
  }, [user?.username]);

  const handleAccountDetails = () => {
    // Navigate to account details page based on baseRole
    if (user?.baseRole === 'admin') {
      router.push('/admin/accounts');
    } else if (user?.baseRole === 'employee') {
      router.push('/employee');
    } else if (user?.baseRole === 'patient') {
      router.push('/patient/profile');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-30 border-b border-border bg-white transition-all duration-300 ease-out",
        "w-full h-16",
        className
      )}
    >
      <div className="flex h-full items-center justify-end w-full px-4 md:px-6 lg:pl-[calc(288px+1rem)]">
        {/* Right side - User menu and notifications */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-auto py-2 px-3 hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5fbf] to-[#7a4fb0] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {avatarLetter}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.baseRole?.charAt(0).toUpperCase() + user.baseRole?.slice(1) || 'User'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAccountDetails} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Chi tiết tài khoản</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
