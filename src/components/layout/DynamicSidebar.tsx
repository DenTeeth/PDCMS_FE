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
  faHome,
  faUsers,
  faCalendar,
  faClock,
  faFileText,
  faCog,
  faShield,
  faUserCheck,
  faBuilding,
  faPhone,
  faStethoscope,
  faCreditCard,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/hooks/usePermissions';
import { SidebarItem } from '@/types/auth';
import { NavigationService } from '@/services/pathMappingService';

interface DynamicSidebarProps {
  title?: string;
}

// Icon mapping for different domains
const DOMAIN_ICONS: Record<string, any> = {
  ACCOUNT: faUsers,
  EMPLOYEE: faUserCheck,
  APPOINTMENT: faCalendar,
  PATIENT: faStethoscope,
  CONTACT: faPhone,
  CONTACT_HISTORY: faFileText,
  TREATMENT: faStethoscope,
  TIME_OFF: faClock,
  TIME_OFF_MANAGEMENT: faChartBar,
  OVERTIME: faClock,
  REGISTRATION: faFileText,
  WORK_SHIFTS: faCalendar,
  DASHBOARD: faHome,
  SETTINGS: faCog,
  SECURITY: faShield,
  REPORTS: faChartBar,
};

// Domain display names
const DOMAIN_NAMES: Record<string, string> = {
  ACCOUNT: 'Account Management',
  EMPLOYEE: 'Employee Management',
  APPOINTMENT: 'Appointments',
  PATIENT: 'Patients',
  CONTACT: 'Contacts',
  CONTACT_HISTORY: 'Contact History',
  TREATMENT: 'Treatments',
  TIME_OFF: 'Time Off',
  TIME_OFF_MANAGEMENT: 'Time Off Management',
  OVERTIME: 'Overtime',
  REGISTRATION: 'Shift Registration',
  WORK_SHIFTS: 'Work Shifts',
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings',
  SECURITY: 'Security',
  REPORTS: 'Reports',
};

// Permission title mapping
const PERMISSION_TITLES: Record<string, string> = {
  VIEW_ACCOUNT: 'Accounts',
  VIEW_EMPLOYEE: 'Employees',
  VIEW_APPOINTMENT: 'Appointments',
  VIEW_PATIENT: 'Patients',
  VIEW_CONTACT: 'Contacts',
  VIEW_CONTACT_HISTORY: 'Contact History',
  VIEW_TREATMENT: 'Treatments',
  VIEW_TIME_OFF_ALL: 'Time Off Requests',
  VIEW_TIMEOFF_TYPE_ALL: 'Time Off Types',
  VIEW_LEAVE_BALANCE_ALL: 'Leave Balances',
  VIEW_OT_ALL: 'Overtime Requests',
  VIEW_REGISTRATION_ALL: 'Shift Registrations',
  VIEW_WORK_SHIFTS: 'Work Shifts',
};

export default function DynamicSidebar({ title = "Dental Clinic" }: DynamicSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedDomains, setExpandedDomains] = useState<string[]>([]);
  const pathname = usePathname();
  const { user, getHomePath, getRoleBasedSidebar } = useAuth();
  
  // Use role-based navigation instead of BE sidebar to solve overlapping permissions
  const roleBasedNavigation = getRoleBasedSidebar();
  const sidebarItems = useSidebar(); // Keep as fallback

  // Toggle domain expansion
  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => 
      prev.includes(domain) 
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const isDomainExpanded = (domain: string) => {
    return expandedDomains.includes(domain);
  };

  // Check if any item in domain is active
  const isDomainActive = (items: SidebarItem[]) => {
    return items.some(item => {
      const frontendPath = NavigationService.mapWithContext(item.path, user?.baseRole);
      return pathname === frontendPath;
    });
  };

  // Get icon for domain
  const getDomainIcon = (domain: string) => {
    return DOMAIN_ICONS[domain] || faFileText;
  };

  // Get display name for domain
  const getDomainName = (domain: string) => {
    return DOMAIN_NAMES[domain] || domain.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get display name for permission
  const getPermissionTitle = (permission: string) => {
    return PERMISSION_TITLES[permission] || permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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
            <h1 className="text-xl font-bold text-primary-foreground">{title}</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {/* Home Link */}
            <Link
              href={getHomePath()}
              className={`
                group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
                ${pathname === getHomePath()
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25 transform scale-[1.02]' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
                }
              `}
              onClick={() => setIsOpen(false)}
            >
              <FontAwesomeIcon icon={faHome} className={`mr-3 h-5 w-5 transition-all duration-200 ${
                pathname === getHomePath() ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
              }`} />
              <span className="flex-1">Dashboard</span>
              {pathname === getHomePath() && (
                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4 text-sidebar-primary-foreground/80" />
              )}
              {pathname !== getHomePath() && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
              )}
            </Link>

            {/* Dynamic Navigation from Role-Based RBAC */}
            {Object.entries(roleBasedNavigation).map(([domain, items]) => {
              const navigationItems = items as Array<{title: string, path: string, permission: string}>;
              const domainActive = navigationItems.some(item => pathname === item.path);
              const domainExpanded = isDomainExpanded(domain);

              return (
                <div key={domain} className="space-y-1">
                  {/* Domain Header */}
                  <button
                    onClick={() => toggleDomain(domain)}
                    className={`
                      group relative flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out
                      ${domainActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
                      }
                    `}
                  >
                    <FontAwesomeIcon icon={getDomainIcon(domain)} className={`mr-3 h-5 w-5 transition-all duration-200 ${
                      domainActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                    }`} />
                    <span className="flex-1 text-left">{getDomainName(domain)}</span>
                    {navigationItems.length > 1 && (
                      <FontAwesomeIcon 
                        icon={domainExpanded ? faChevronDown : faChevronRight} 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          domainActive ? 'text-sidebar-primary-foreground/80' : 'text-muted-foreground group-hover:text-primary'
                        }`} 
                      />
                    )}
                    {!domainActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                    )}
                  </button>

                  {/* Domain Items */}
                  {(domainExpanded || navigationItems.length === 1) && (
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      domainExpanded || navigationItems.length === 1 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="ml-4 mt-1 space-y-1">
                        {navigationItems.map((item) => {
                          const isItemActive = pathname === item.path;
                          
                          // Debug logging for role + permission-based navigation
                          if (process.env.NODE_ENV === 'development') {
                            console.log(`🎯 ${user?.baseRole} navigation: ${item.permission} -> ${item.path}`);
                          }
                          
                          return (
                            <Link
                              key={item.path}
                              href={item.path}
                              className={`
                                group relative flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out
                                ${isItemActive 
                                  ? 'bg-primary text-primary-foreground shadow-md transform scale-[1.02]' 
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:transform hover:scale-[1.01]'
                                }
                              `}
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{getPermissionTitle(item.permission)}</div>
                              </div>
                              {!isItemActive && (
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
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
                 <p className="text-xs text-muted-foreground truncate">{user?.baseRole || 'User'} • {user?.employmentType || 'N/A'}</p>
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
