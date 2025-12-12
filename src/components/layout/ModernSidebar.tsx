'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faTimes,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateNavigationConfig,
  filterNavigationItems,
  NavigationItem
} from '@/constants/navigationConfig';

interface ModernSidebarProps {
  title?: string;
}

// Memoized Navigation Item - Minimalist Design
const NavItem = memo(({
  item,
  level,
  pathname,
  expandedItems,
  toggleItem,
  setIsOpen,
  isCollapsed,
}: {
  item: NavigationItem;
  level: number;
  pathname: string;
  expandedItems: string[];
  toggleItem: (name: string) => void;
  setIsOpen: (open: boolean) => void;
  isCollapsed?: boolean;
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

  // Clean minimalist styling - giống Financial Dashboard
  const baseClasses = `
    group relative flex items-center gap-3.5 rounded-xl transition-all duration-200
    ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'}
    ${level > 0 ? 'ml-12 py-2.5' : ''}
    ${isActive
      ? 'bg-[#8b5fbf]/10 text-[#8b5fbf]'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }
  `;

  const content = (
    <>
      {/* Icon container - rounded background giống Financial Dashboard */}
      {level === 0 && (
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 flex-shrink-0
          ${isActive
            ? 'bg-[#8b5fbf] text-white shadow-lg shadow-purple-200'
            : 'bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700'
          }
        `}>
          <FontAwesomeIcon
            icon={item.icon}
            className="text-base transition-colors duration-200"
          />
        </div>
      )}

      {/* Text label - clean typography */}
      {!isCollapsed && (
        <span className={`
          flex-1 text-[15px] font-medium transition-all duration-200 whitespace-nowrap
          ${isActive ? 'text-[#8b5fbf] font-semibold' : 'text-gray-700 group-hover:text-gray-900'}
          ${level > 0 ? 'text-sm' : ''}
        `}>
          {item.name}
        </span>
      )}

      {/* Chevron for submenu - minimal */}
      {hasSubmenu && !isCollapsed && (
        <FontAwesomeIcon
          icon={faChevronRight}
          className={`text-[10px] transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''
            } ${isActive ? 'text-[#8b5fbf]' : 'text-gray-400 group-hover:text-gray-600'}`}
        />
      )}

      {/* Active indicator dot */}
      {isActive && !hasSubmenu && (
        <div className="w-1.5 h-1.5 bg-[#8b5fbf] rounded-full flex-shrink-0" />
      )}
    </>
  );

  return (
    <div className="mb-1">
      {item.href ? (
        <Link
          href={item.href}
          className={baseClasses}
          onClick={handleClick}
          title={isCollapsed ? item.name : undefined}
        >
          {content}
        </Link>
      ) : (
        <button
          onClick={handleClick}
          className={`${baseClasses} w-full text-left`}
          title={isCollapsed ? item.name : undefined}
        >
          {content}
        </button>
      )}

      {/* Submenu - clean indentation (hidden when collapsed) */}
      {hasSubmenu && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-0.5">
          {item.submenu!.map((subItem) => (
            <NavItem
              key={subItem.name}
              item={subItem}
              level={level + 1}
              pathname={pathname}
              expandedItems={expandedItems}
              toggleItem={toggleItem}
              setIsOpen={setIsOpen}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
});

NavItem.displayName = 'NavItem';

export default function ModernSidebar({ title = "PDCMS" }: ModernSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed state for desktop
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { user } = useAuth();

  // Memoize navigation config
  const navigationConfig = useMemo(() => {
    return user ? generateNavigationConfig(user.baseRole, user.groupedPermissions) : null;
  }, [user?.baseRole, user?.groupedPermissions]);

  // Memoize filtered items with employment type filtering and roles
  const filteredItems = useMemo(() => {
    return navigationConfig && user ?
      filterNavigationItems(
        navigationConfig.items,
        user.permissions,
        user.groupedPermissions,
        user.roles, // Pass user roles to check ROLE_ADMIN
        user.employmentType // Pass employment type for filtering
      ) : [];
  }, [navigationConfig, user?.permissions, user?.groupedPermissions, user?.roles, user?.employmentType]);

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
      {/* Mobile menu button - clean design */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-xl bg-white shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all duration-200"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5 text-gray-700" />
          ) : (
            <FontAwesomeIcon icon={faBars} className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </div>

      {/* Sidebar - Financial Dashboard style - Wider and Responsive */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-20' : 'w-72'}
          lg:translate-x-0 shadow-sm
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header - minimalist clean white */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center w-full' : 'flex-1 justify-center'}`}>
              {/* Logo */}
              <div className="w-9 h-9 bg-gradient-to-br from-[#8b5fbf] to-[#7a4fb0] rounded-xl flex items-center justify-center shadow-lg shadow-purple-200/50">
                <span className="text-white text-base font-bold">D</span>
              </div>
              {!isCollapsed && (
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  {navigationConfig.title}
                </h1>
              )}
            </div>

            {/* Collapse toggle button - desktop only */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Toggle sidebar"
            >
              <FontAwesomeIcon
                icon={faChevronRight}
                className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
              />
            </button>

            {/* Close button - mobile only */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation - clean spacing */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overscroll-contain scroll-smooth">
            <style jsx>{`
              nav::-webkit-scrollbar {
                width: 4px;
              }
              nav::-webkit-scrollbar-track {
                background: transparent;
              }
              nav::-webkit-scrollbar-thumb {
                background: #e5e7eb;
                border-radius: 2px;
              }
              nav::-webkit-scrollbar-thumb:hover {
                background: #d1d5db;
              }
            `}</style>

            {filteredItems.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                level={0}
                pathname={pathname}
                expandedItems={expandedItems}
                toggleItem={toggleItem}
                setIsOpen={setIsOpen}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          {/* User info - Financial Dashboard style */}
          <div className="p-4 border-t border-gray-100">
            {isCollapsed ? (
              /* Collapsed user display - just avatar */
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#8b5fbf] to-[#7a4fb0] rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <LogoutButton variant="button" className="w-full justify-center text-xs p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border-0" />
              </div>
            ) : (
              /* Full user display */
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#8b5fbf] to-[#7a4fb0] rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.baseRole?.charAt(0).toUpperCase() + user?.baseRole?.slice(1) || 'User'}
                    </p>
                  </div>

                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors duration-200"
                  />
                </div>

                <div className="mt-2">
                  <LogoutButton variant="button" className="w-full justify-center text-sm py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border-0" />
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay - backdrop blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
