'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LogoutButton } from '@/components/auth/LogoutButton';
import {
  faTachometerAlt,
  faUser,
  faCalendarAlt,
  faFileAlt,
  faCreditCard,
  faCog,
  faBars,
  faTimes,
  faChevronRight,
  faBell,
  faHistory,
  faHeart
} from '@fortawesome/free-solid-svg-icons';

const navigation = [
  {
    name: 'Dashboard',
    href: '/user',
    icon: faTachometerAlt,
  },
  {
    name: 'My Profile',
    href: '/user/profile',
    icon: faUser,
  },
  {
    name: 'Appointments',
    href: '/user/appointments',
    icon: faCalendarAlt,
  },
  {
    name: 'Medical Records',
    href: '/user/records',
    icon: faFileAlt,
  },
  {
    name: 'Billing & Payments',
    href: '/user/billing',
    icon: faCreditCard,
  },
  {
    name: 'Notifications',
    href: '/user/notifications',
    icon: faBell,
  },
  {
    name: 'Appointment History',
    href: '/user/history',
    icon: faHistory,
  },
  {
    name: 'Health Tips',
    href: '/user/health-tips',
    icon: faHeart,
  },
  {
    name: 'Settings',
    href: '/user/settings',
    icon: faCog,
  },
];

export default function UserSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-xl bg-card shadow-lg border border-border hover:shadow-xl transition-all duration-200"
        >
          {isOpen ? (
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5 text-foreground" />
          ) : (
            <FontAwesomeIcon icon={faBars} className="h-5 w-5 text-foreground" />
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
            <h1 className="text-xl font-bold text-primary-foreground">My Account</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
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
                  <FontAwesomeIcon icon={item.icon} className={`mr-3 h-5 w-5 transition-all duration-200 ${
                    isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4 text-sidebar-primary-foreground/80" />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-sidebar-border bg-sidebar-accent">
            <div className="flex items-center p-3 rounded-lg bg-card shadow-sm border border-border">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md">
                <FontAwesomeIcon icon={faUser} className="text-primary-foreground text-sm" />
              </div>
               <div className="ml-3 flex-1">
                 <p className="text-sm font-semibold text-card-foreground">John Doe</p>
                 <p className="text-xs text-muted-foreground">Patient</p>
               </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="mt-3">
              <LogoutButton variant="button" className="w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

