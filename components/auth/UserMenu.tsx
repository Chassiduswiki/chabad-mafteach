'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, UserPlus, ChevronDown, BookOpen, Search } from 'lucide-react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated via auth status cookie
    // We'll fetch profile if authenticated, since we can't access HttpOnly cookies from client
    checkAuthStatus();
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
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium">
        <div className="animate-spin rounded-full h-4 w-4 border border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Show sign up/sign in when not logged in
  if (!userProfile) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/auth/signin"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium transition-colors"
        >
          <User className="h-4 w-4" />
          Sign In
        </a>
        <a
          href="/auth/signup"
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Sign Up
        </a>
      </div>
    );
  }

  // Show user menu when logged in
  const displayName = userProfile.firstName || userProfile.email;
  const initials = userProfile.firstName 
    ? `${userProfile.firstName[0]}${userProfile.lastName?.[0] || ''}`.toUpperCase()
    : userProfile.email[0].toUpperCase();

  // Role descriptions for user clarity
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full system access';
      case 'editor':
        return 'Content editing & research';
      default:
        return 'Basic access';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-600';
      case 'editor':
        return 'bg-blue-500/10 text-blue-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium transition-colors relative z-[50]"
      >
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
          {userProfile.avatar ? (
            <img 
              src={userProfile.avatar} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        
        {/* User info */}
        <span className="hidden sm:block">{displayName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-[120]">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {userProfile.avatar ? (
                  <img 
                    src={userProfile.avatar} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="text-left">
                <div className="font-medium text-foreground">
                  {userProfile.firstName && userProfile.lastName 
                    ? `${userProfile.firstName} ${userProfile.lastName}`
                    : userProfile.email
                  }
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userProfile.role)}`}>
                    {userProfile.role}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleDescription(userProfile.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            {/* Quick Actions */}
            <div className="px-3 py-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</h4>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    router.push('/editor');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded transition-colors text-left"
                >
                  <BookOpen className="h-3 w-3" />
                  Editor Dashboard
                </button>
                <button
                  onClick={() => {
                    router.push('/editor/topics');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded transition-colors text-left"
                >
                  <Search className="h-3 w-3" />
                  Browse Topics
                </button>
                {userProfile.role === 'admin' && (
                  <button
                    onClick={() => {
                      router.push('/admin/settings');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded transition-colors text-left"
                  >
                    <Settings className="h-3 w-3" />
                    Admin Settings
                  </button>
                )}
              </div>
            </div>
            
            <div className="border-t border-border my-2"></div>
            
            {/* Account Actions */}
            <button
              onClick={() => {
                router.push('/profile');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded transition-colors"
            >
              <User className="h-4 w-4" />
              Profile Settings
            </button>

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
