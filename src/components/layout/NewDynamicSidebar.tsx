'use client';

import { useState, useMemo, useCallback, memo } from 'react';
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
  generateNavigationConfig,
  filterNavigationItems,
  NavigationItem
} from '@/constants/navigationConfig';

interface NewDynamicSidebarProps {
  title?: string;
}

// Memoized Navigation Item Component để tránh re-render không cần thiết
const NavigationItemComponent = memo(({
  item,
  level,
  pathname,
  expandedItems,
  toggleItem,
  setIsOpen
}: {
  item: NavigationItem;
  level: number;
  pathname: string;
  expandedItems: string[];
  toggleItem: (name: string) => void;
  setIsOpen: (open: boolean) => void;
}) => {
  const isActive = useMemo(() => {
    if (item.href && pathname === item.href) return true;
    if (item.submenu) return item.submenu.some(subItem => pathname === subItem.href);
    return false;
  }, [item, pathname]);

  const isExpanded = expandedItems.includes(item.name);
  const hasSubmenu = item.hasSubmenu && item.submenu && item.submenu.length > 0;

  const handleClick = useCallback(() => {
    if (hasSubmenu) {
      toggleItem(item.name);
    } else {
      setIsOpen(false);
    }
  }, [hasSubmenu, item.name, toggleItem, setIsOpen]);

  const baseClasses = `
    group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
    ${level > 0 ? 'ml-4' : ''}
    ${isActive
      ? 'bg-[#8b5fbf] text-white'
      : 'text-gray-700 hover:bg-purple-50 hover:text-[#8b5fbf]'
    }
  `;

  return (
    <div className="space-y-0.5">
      {item.href ? (
        <Link href={item.href} className={baseClasses} onClick={handleClick}>
          <FontAwesomeIcon
            icon={item.icon}
            className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#8b5fbf]'}`}
          />
          <span className="flex-1">{item.name}</span>
          {isActive && <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />}
        </Link>
      ) : (
        <button onClick={handleClick} className={`${baseClasses} w-full`}>
          <FontAwesomeIcon
            icon={item.icon}
            className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#8b5fbf]'}`}
          />
          <span className="flex-1 text-left">{item.name}</span>
          {hasSubmenu && (
            <FontAwesomeIcon
              icon={isExpanded ? faChevronDown : faChevronRight}
              className="h-3 w-3"
            />
          )}
        </button>
      )}

      {hasSubmenu && (isExpanded || isActive) && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {item.submenu!.map((subItem) => (
            <NavigationItemComponent
              key={subItem.name}
              item={subItem}
              level={level + 1}
              pathname={pathname}
              expandedItems={expandedItems}
              toggleItem={toggleItem}
              setIsOpen={setIsOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
});

NavigationItemComponent.displayName = 'NavigationItemComponent';

export default function NewDynamicSidebar({ title = "PDCMS" }: NewDynamicSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { user } = useAuth();

  // Memoize navigation config để tránh re-generate mỗi lần render
  const navigationConfig = useMemo(() => {
    return user ? generateNavigationConfig(user.baseRole, user.groupedPermissions) : null;
  }, [user?.baseRole, user?.groupedPermissions]);

  // Memoize filtered items
  const filteredItems = useMemo(() => {
    return navigationConfig && user ?
      filterNavigationItems(
        navigationConfig.items,
        user.permissions,
        user.groupedPermissions,
        user.roles // Pass user roles to check ROLE_ADMIN
      ) : [];
  }, [navigationConfig, user?.permissions, user?.groupedPermissions, user?.roles]);

  // Memoize toggle function
  const toggleItem = useCallback((itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  }, []);

  if (!user || !navigationConfig) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button - Đơn giản hóa */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
        >
          {isOpen ? (
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5 text-gray-700" />
          ) : (
            <FontAwesomeIcon icon={faBars} className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </div>

      {/* Sidebar - Tối ưu với will-change */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-200 will-change-transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Đơn giản */}
          <div className="flex items-center justify-center h-14 px-4 border-b border-gray-200 bg-gradient-to-r from-[#8b5fbf] to-[#7a4fb0]">
            <h1 className="text-lg font-bold text-white">{navigationConfig.title}</h1>
          </div>

          {/* Navigation - Tối ưu scroll */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overscroll-contain">
            {filteredItems.map((item) => (
              <NavigationItemComponent
                key={item.name}
                item={item}
                level={0}
                pathname={pathname}
                expandedItems={expandedItems}
                toggleItem={toggleItem}
                setIsOpen={setIsOpen}
              />
            ))}
          </nav>

          {/* User info - Compact */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center p-2.5 rounded-lg bg-white shadow-sm border border-gray-200">
              <div className="w-9 h-9 bg-gradient-to-br from-[#8b5fbf] to-[#7a4fb0] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-2.5 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.baseRole?.charAt(0).toUpperCase() + user?.baseRole?.slice(1) || 'User'}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
            </div>
            <div className="mt-2">
              <LogoutButton variant="button" className="w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay - Đơn giản */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
