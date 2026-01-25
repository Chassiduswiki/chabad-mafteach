'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings } from 'lucide-react';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get user role from token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (e) {
        console.error('Failed to parse token');
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; max-age=0';
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!userRole) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium transition-colors z-[110]"
      >
        <User className="h-4 w-4" />
        <span className="capitalize">{userRole}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-[120]">
          <div className="p-2">
            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border mb-2">
              Logged in as <span className="capitalize font-medium">{userRole}</span>
            </div>

            {userRole === 'admin' && (
              <button
                onClick={() => {
                  router.push('/admin/settings');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded transition-colors"
              >
                <Settings className="h-4 w-4" />
                Admin Settings
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
