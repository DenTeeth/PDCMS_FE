'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';
import { MenuItem, NavigationConfig } from '@/types/permission';

interface DynamicSidebarProps {
  navigationConfig: NavigationConfig;
}

export default function DynamicSidebar({ navigationConfig }: DynamicSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const { user, hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();

  // Toggle submenu
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

  const isSubmenuItemActive = (submenuItems: MenuItem[]) => {
    return submenuItems.some(item => pathname === item.href);
  };

  // Check if user has permission to see menu item
  const canViewMenuItem = (item: MenuItem): boolean => {
    if (!user) return false;

    // Check role requirements (nếu có)
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const hasRequiredRole = item.requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) return false;
    }

    // Check permission requirements (ưu tiên)
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      if (item.requireAll) {
        // Cần tất cả permissions
        return hasAllPermissions(item.requiredPermissions);
      } else {
        // Chỉ cần 1 trong số permissions
        return hasAnyPermission(item.requiredPermissions);
      }
    }

    // Nếu không có yêu cầu gì, cho phép hiển thị
    return true;
  };

  // Filter menu items based on permissions
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // Check if user can view this item
      if (!canViewMenuItem(item)) return false;

      // If item has submenu, filter submenu items
      if (item.hasSubmenu && item.submenu) {
        const visibleSubmenu = item.submenu.filter(canViewMenuItem);
        // Only show parent if has at least 1 visible submenu item
        if (visibleSubmenu.length === 0) return false;
        // Update submenu with only visible items
        item.submenu = visibleSubmenu;
      }

      return true;
    });
  };

  const visibleMenuItems = filterMenuItems([...navigationConfig.menuItems]);

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
            <h1 className="text-xl font-bold text-primary-foreground">{navigationConfig.title}</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {visibleMenuItems.map((item) => {
              if (item.hasSubmenu && item.submenu) {
                const isExpanded = isSubmenuExpanded(item.name);
                const hasActiveSubmenu = isSubmenuItemActive(item.submenu);
                
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
                      <FontAwesomeIcon icon={item.icon} className={`mr-3 h-5 w-5 transition-all duration-200 ${
                        hasActiveSubmenu ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                      <span className="flex-1 text-left">{item.name}</span>
                      <FontAwesomeIcon 
                        icon={isExpanded ? faChevronDown : faChevronRight} 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          hasActiveSubmenu ? 'text-sidebar-primary-foreground/80' : 'text-muted-foreground group-hover:text-primary'
                        }`} 
                      />
                      {!hasActiveSubmenu && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                      )}
                    </button>

                    {/* Submenu items */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href!}
                              className={`
                                group relative flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out
                                ${isSubActive 
                                  ? 'bg-primary text-primary-foreground shadow-md transform scale-[1.02]' 
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
                                }
                              `}
                              onClick={() => setIsOpen(false)}
                            >
                              <FontAwesomeIcon icon={subItem.icon} className={`mr-3 h-4 w-4 transition-all duration-200 ${
                                isSubActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                              }`} />
                              <div className="flex-1">
                                <div className="font-medium">{subItem.name}</div>
                                {subItem.description && (
                                  <div className={`text-xs ${
                                    isSubActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                  }`}>
                                    {subItem.description}
                                  </div>
                                )}
                              </div>
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
              }
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-sidebar-border bg-sidebar-accent">
            <div className="flex items-center p-3 rounded-lg bg-card shadow-sm border border-border">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md">
                <span className="text-primary-foreground text-sm font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
               <div className="ml-3 flex-1">
                 <p className="text-sm font-semibold text-card-foreground truncate">{user?.username || 'User'}</p>
                 <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
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
