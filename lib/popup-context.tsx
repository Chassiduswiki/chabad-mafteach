'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Popup types
export enum PopupType {
    FOOTNOTE = 'footnote',
    INSTANT_LOOKUP = 'instant_lookup',
    TOOLTIP = 'tooltip',
}

// Popup state interface
export interface PopupState {
    type: PopupType;
    data: any;
    position: { x: number; y: number };
}

// Context interface
interface PopupContextType {
    activePopup: PopupState | null;
    showPopup: (type: PopupType, data: any, position: { x: number; y: number }) => void;
    closePopup: () => void;
    isPopupOpen: (type?: PopupType) => boolean;
}

// Create context
const PopupContext = createContext<PopupContextType | undefined>(undefined);

// Provider props
interface PopupProviderProps {
    children: ReactNode;
}

// Provider component
export function PopupProvider({ children }: PopupProviderProps) {
    const [activePopup, setActivePopup] = useState<PopupState | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    const pathname = usePathname();

    // Close popup on route change
    useEffect(() => {
        setActivePopup(null);
    }, [pathname]);

    // Show popup
    const showPopup = (type: PopupType, data: any, position: { x: number; y: number }) => {
        setActivePopup({ type, data, position });
    };

    // Close popup
    const closePopup = () => {
        setActivePopup(null);
    };

    // Check if popup is open
    const isPopupOpen = (type?: PopupType) => {
        if (!activePopup) return false;
        if (!type) return true;
        return activePopup.type === type;
    };

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && activePopup) {
                closePopup();
            }
        };

        if (activePopup) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [activePopup]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                closePopup();
            }
        };

        if (activePopup) {
            // Small delay to prevent immediate close on the click that opened it
            const timeoutId = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [activePopup]);

    // Set popup ref for click-outside detection
    const setPopupRef = (ref: HTMLDivElement | null) => {
        popupRef.current = ref;
    };

    return (
        <PopupContext.Provider value={{ activePopup, showPopup, closePopup, isPopupOpen }}>
            {children}
            {/* Render active popup - components will access this via context */}
            {activePopup && (
                <div ref={setPopupRef} style={{ position: 'absolute', zIndex: 9999 }}>
                    {/* Popup content will be rendered by individual popup components */}
                </div>
            )}
        </PopupContext.Provider>
    );
}

// Custom hook to use popup context
export function usePopup() {
    const context = useContext(PopupContext);
    if (context === undefined) {
        throw new Error('usePopup must be used within a PopupProvider');
    }
    return context;
}
