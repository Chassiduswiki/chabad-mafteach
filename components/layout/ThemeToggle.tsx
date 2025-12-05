'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * ThemeToggle - User-controlled dark mode toggle
 * 
 * Features:
 * - Three states: Light, Dark, System
 * - Persists choice across sessions (localStorage)
 * - Keyboard accessible (Tab, Enter/Space)
 * - WCAG AA compliant
 */
export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Show placeholder during SSR to prevent hydration mismatch
        return (
            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                <div className="h-8 w-8 rounded-full bg-muted-foreground/10" />
            </div>
        );
    }

    const cycleTheme = () => {
        if (theme === 'system') {
            setTheme('light');
        } else if (theme === 'light') {
            setTheme('dark');
        } else {
            setTheme('system');
        }
    };

    const getIcon = () => {
        if (theme === 'system') {
            return <Monitor className="h-4 w-4" />;
        }
        if (theme === 'light') {
            return <Sun className="h-4 w-4" />;
        }
        return <Moon className="h-4 w-4" />;
    };

    const getLabel = () => {
        if (theme === 'system') return 'System theme';
        if (theme === 'light') return 'Light mode';
        return 'Dark mode';
    };

    return (
        <button
            onClick={cycleTheme}
            className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            aria-label={`${getLabel()}. Click to change.`}
            title={getLabel()}
        >
            {getIcon()}
            <span className="hidden sm:inline">{getLabel()}</span>
        </button>
    );
}

/**
 * Compact theme toggle for mobile/header use
 */
export function ThemeToggleCompact() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-10 w-10 rounded-full bg-muted" />;
    }

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    const getIcon = () => {
        if (theme === 'system') return <Monitor className="h-5 w-5" />;
        if (theme === 'light') return <Sun className="h-5 w-5" />;
        return <Moon className="h-5 w-5" />;
    };

    return (
        <button
            onClick={cycleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={`Toggle theme (currently ${theme})`}
        >
            {getIcon()}
        </button>
    );
}
