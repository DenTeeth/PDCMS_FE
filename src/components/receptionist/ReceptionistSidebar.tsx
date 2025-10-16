'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LogoutButton } from '@/components/auth/LogoutButton';
import {
  faTachometerAlt,
  faUserPlus,
  faFileMedical,
  faCalendarAlt,
  faUsers,
  faCog,
  faBars,
  faTimes,
  faChevronRight,
  faChevronDown,
  faUser,
  faTable,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';

const navigation = [
  {
    name: 'Dashboard',
    href: '/receptionist',
    icon: faTachometerAlt,
  },
  {
    name: 'Account Management',
    icon: faUserPlus,
    hasSubmenu: true,
    submenu: [
      {
        name: 'Create Account',
        href: '/receptionist/create-account',
        icon: faUserPlus,
        description: 'Create new customer accounts'
      },
      {
        name: 'Patient Records',
        href: '/receptionist/patient-records',
        icon: faFileMedical,
        description: 'Manage patient records'
      }
    ]
  },
  {
    name: 'Appointments',
    icon: faCalendarAlt,
    hasSubmenu: true,
    submenu: [
      {
        name: 'Calendar View',
        href: '/receptionist/appointments/calendar',
        icon: faCalendarAlt,
        description: 'View appointments in calendar'
      },
      {
        name: 'Table View',
        href: '/receptionist/appointments/table',
        icon: faTable,
        description: 'View appointments in table'
      }
    ]
  },
  {
    name: 'Customer Management',
    href: '/receptionist/customers',
    icon: faUsers,
  },
  {
    name: 'KPI Dashboard',
    href: '/receptionist/kpi',
    icon: faChartLine,
  },
  {
    name: 'Settings',
    href: '/receptionist/settings',
    icon: faCog,
  },
];

export default function ReceptionistSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isSubmenuExpanded = (menuName: string) => {
    return expandedMenus.includes(menuName);
  };

  const isSubmenuItemActive = (submenuItems: any[]) => {
    return submenuItems.some(item => pathname === item.href);
  };

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
            <h1 className="text-xl font-bold text-primary-foreground">PDCMS Receptionist</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigation.map((item) => {
              if (item.hasSubmenu) {
                const isExpanded = isSubmenuExpanded(item.name);
                const hasActiveSubmenu = isSubmenuItemActive(item.submenu || []);

                return (
                  <div key={item.name}>
                    {/* Main menu item with submenu */}
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`
                        group relative flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
                        ${hasActiveSubmenu
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
                        }
                      `}
                    >
                      <FontAwesomeIcon icon={item.icon} className={`mr-3 h-5 w-5 transition-all duration-200 ${hasActiveSubmenu ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                        }`} />
                      <span className="flex-1 text-left">{item.name}</span>
                      <FontAwesomeIcon
                        icon={isExpanded ? faChevronDown : faChevronRight}
                        className={`h-4 w-4 transition-transform duration-200 ${hasActiveSubmenu ? 'text-sidebar-primary-foreground/80' : 'text-muted-foreground group-hover:text-primary'
                          }`}
                      />
                      {!hasActiveSubmenu && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                      )}
                    </button>

                    {/* Submenu items */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu?.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`
                                group relative flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out
                                ${isSubActive
                                  ? 'bg-primary text-primary-foreground shadow-md transform scale-[1.02]'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
                                }
                              `}
                              onClick={() => setIsOpen(false)}
                            >
                              <FontAwesomeIcon icon={subItem.icon} className={`mr-3 h-4 w-4 transition-all duration-200 ${isSubActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                                }`} />
                              <div className="flex-1">
                                <div className="font-medium">{subItem.name}</div>
                                <div className={`text-xs ${isSubActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                  }`}>
                                  {subItem.description}
                                </div>
                              </div>
                              {isSubActive && (
                                <div className="bg-primary-foreground"></div>
                              )}
                              {!isSubActive && (
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Regular menu item without submenu
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href!}
                    className={`
                       group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
                       ${isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25 transform scale-[1.02]'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <FontAwesomeIcon icon={item.icon} className={`mr-3 h-5 w-5 transition-all duration-200 ${isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
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
              }
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-sidebar-border bg-sidebar-accent">
            <div className="flex items-center p-3 rounded-lg bg-card shadow-sm border border-border">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md">
                <span className="text-primary-foreground text-sm font-bold">R</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-card-foreground">Receptionist</p>
                <p className="text-xs text-muted-foreground">Front Desk</p>
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
