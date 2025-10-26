'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, 
  faTimes, 
  faChevronRight, 
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getNavigationConfigByRole, 
  generateNavigationConfig,
  filterNavigationItems,
  NavigationItem 
} from '@/constants/navigationConfig';

interface NewDynamicSidebarProps {
  title?: string;
}

export default function NewDynamicSidebar({ title = "PDCMS" }: NewDynamicSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { user } = useAuth();

  // Generate navigation config based on user role and groupedPermissions
  const navigationConfig = user ? 
    generateNavigationConfig(user.baseRole, user.groupedPermissions) : null;
  
  // Filter navigation items based on user permissions
  const filteredItems = navigationConfig && user ? 
    filterNavigationItems(
      navigationConfig.items, 
      user.permissions, 
      user.groupedPermissions
    ) : [];

  // Toggle item expansion
  const toggleItem = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemExpanded = (itemName: string) => {
    return expandedItems.includes(itemName);
  };

  // Check if item or any submenu item is active
  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href && pathname === item.href) {
      return true;
    }
    
    if (item.submenu) {
      return item.submenu.some(subItem => pathname === subItem.href);
    }
    
    return false;
  };

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = isItemExpanded(item.name);
    const hasSubmenu = item.hasSubmenu && item.submenu && item.submenu.length > 0;

    return (
      <div key={item.name} className="space-y-1">
        {/* Main Item */}
        {item.href ? (
          // Clickable link
          <Link
            href={item.href}
            className={`
              group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
              ${level > 0 ? 'ml-4' : ''}
              ${isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25 transform scale-[1.02]' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
              }
            `}
            onClick={() => setIsOpen(false)}
          >
            <FontAwesomeIcon 
              icon={item.icon} 
              className={`mr-3 h-5 w-5 transition-all duration-200 ${
                isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
              }`} 
            />
            <span className="flex-1">{item.name}</span>
            {item.description && (
              <span className="text-xs text-muted-foreground ml-2 hidden lg:block">
                {item.description}
              </span>
            )}
            {isActive && (
              <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4 text-sidebar-primary-foreground/80" />
            )}
            {!isActive && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
            )}
          </Link>
        ) : (
          // Expandable button (for submenu parents)
          <button
            onClick={() => toggleItem(item.name)}
            className={`
              group relative flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
              ${level > 0 ? 'ml-4' : ''}
              ${isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
              }
            `}
          >
            <FontAwesomeIcon 
              icon={item.icon} 
              className={`mr-3 h-5 w-5 transition-all duration-200 ${
                isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
              }`} 
            />
            <span className="flex-1 text-left">{item.name}</span>
            {hasSubmenu && (
              <FontAwesomeIcon 
                icon={isExpanded ? faChevronDown : faChevronRight} 
                className={`h-4 w-4 transition-transform duration-200 ${
                  isActive ? 'text-sidebar-primary-foreground/80' : 'text-muted-foreground group-hover:text-primary'
                }`} 
              />
            )}
            {!isActive && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
            )}
          </button>
        )}

        {/* Submenu Items */}
        {hasSubmenu && (isExpanded || isActive) && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded || isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="ml-4 mt-1 space-y-1">
              {item.submenu!.map((subItem) => renderNavigationItem(subItem, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user || !navigationConfig) {
    return null;
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
            {filteredItems.map((item) => renderNavigationItem(item))}
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
                <p className="text-xs text-muted-foreground truncate">
                  {user?.baseRole?.charAt(0).toUpperCase() + user?.baseRole?.slice(1) || 'User'} • {user?.employmentType || 'N/A'}
                </p>
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
