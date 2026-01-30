'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, UserPlus, ChevronDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/lib/directus';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

export function CompactUserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUserProfile(null);
      setIsOpen(false);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getAvatarColor = (firstName?: string, lastName?: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    const name = `${firstName || ''}${lastName || ''}`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
    );
  }

  return (
    <div className="user-menu-container relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
          "hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          userProfile
            ? getAvatarColor(userProfile.firstName, userProfile.lastName) + " text-white font-medium"
            : "bg-muted text-muted-foreground hover:text-foreground"
        )}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {userProfile?.avatar ? (
          <img
            src={getAssetUrl(userProfile.avatar)}
            alt={`${userProfile.firstName} ${userProfile.lastName}`}
            className="w-full h-full rounded-full object-cover"
          />
        ) : userProfile ? (
          <span className="text-sm font-medium">
            {getInitials(userProfile.firstName, userProfile.lastName)}
          </span>
        ) : (
          <User className="w-5 h-5" />
        )}
        <ChevronDown className={cn(
          "absolute -bottom-1 -right-1 w-3 h-3 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="py-1">
              {userProfile ? (
                // Logged In Menu
                <>
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">
                      {userProfile.firstName} {userProfile.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userProfile.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>

                  {userProfile.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Admin Settings
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                // Logged Out Menu
                <>
                  <Link
                    href="/auth/signin"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </Link>

                  <Link
                    href="/auth/signup"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>

                  <div className="border-t border-border my-1" />

                  <Link
                    href="/about"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
