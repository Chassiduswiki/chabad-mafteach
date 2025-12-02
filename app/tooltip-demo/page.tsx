'use client';

import React from 'react';
import { usePopup, PopupType } from '@/lib/popup-context';
import { TooltipPopup } from '@/components/TooltipPopup';

export default function TooltipDemoPage() {
    const { activePopup, showPopup } = usePopup();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Tooltip Popup Demo</h1>
                    <p className="text-muted-foreground">
                        Click the buttons below to see different tooltip styles
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Info Tooltip */}
                    <div className="p-6 border border-border rounded-lg">
                        <h3 className="font-semibold mb-3">Info Tooltip</h3>
                        <button
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                showPopup(
                                    PopupType.TOOLTIP,
                                    {
                                        title: 'Information',
                                        content: 'This is an informational tooltip with helpful context about a feature or concept.',
                                        icon: 'info'
                                    },
                                    { x: rect.left, y: rect.bottom }
                                );
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Show Info Tooltip
                        </button>
                    </div>

                    {/* Tip Tooltip */}
                    <div className="p-6 border border-border rounded-lg">
                        <h3 className="font-semibold mb-3">Tip Tooltip</h3>
                        <button
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                showPopup(
                                    PopupType.TOOLTIP,
                                    {
                                        title: 'Pro Tip',
                                        content: 'Use keyboard shortcuts to navigate faster! Press Cmd+K to open the command menu.',
                                        icon: 'tip'
                                    },
                                    { x: rect.left, y: rect.bottom }
                                );
                            }}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                            Show Tip Tooltip
                        </button>
                    </div>

                    {/* Warning Tooltip */}
                    <div className="p-6 border border-border rounded-lg">
                        <h3 className="font-semibold mb-3">Warning Tooltip</h3>
                        <button
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                showPopup(
                                    PopupType.TOOLTIP,
                                    {
                                        title: 'Important Notice',
                                        content: 'This action cannot be undone. Make sure you have saved your work before proceeding.',
                                        icon: 'warning'
                                    },
                                    { x: rect.left, y: rect.bottom }
                                );
                            }}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            Show Warning Tooltip
                        </button>
                    </div>

                    {/* Tooltip with Actions */}
                    <div className="p-6 border border-border rounded-lg">
                        <h3 className="font-semibold mb-3">Tooltip with Actions</h3>
                        <button
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                showPopup(
                                    PopupType.TOOLTIP,
                                    {
                                        title: 'Quick Actions',
                                        content: 'Would you like to learn more about this feature?',
                                        icon: 'info',
                                        actions: [
                                            {
                                                label: 'Learn More',
                                                onClick: () => alert('Opening documentation...')
                                            },
                                            {
                                                label: 'Got it',
                                                onClick: () => console.log('User acknowledged')
                                            }
                                        ]
                                    },
                                    { x: rect.left, y: rect.bottom }
                                );
                            }}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Show Tooltip with Actions
                        </button>
                    </div>
                </div>

                {/* Usage Example */}
                <div className="mt-12 p-6 bg-muted/50 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">How to Use</h2>
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm">
                        {`// 1. Add TOOLTIP to PopupType enum (already done!)
export enum PopupType {
    FOOTNOTE = 'footnote',
    INSTANT_LOOKUP = 'instant_lookup',
    TOOLTIP = 'tooltip',
}

// 2. Use the popup manager
const { showPopup } = usePopup();

// 3. Show tooltip on click
onClick={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    showPopup(
        PopupType.TOOLTIP,
        {
            title: 'Optional Title',
            content: 'Your tooltip content',
            icon: 'info', // 'info' | 'tip' | 'warning'
            actions: [/* optional actions */]
        },
        { x: rect.left, y: rect.bottom }
    );
}}

// 4. Render in parent component
{activePopup?.type === PopupType.TOOLTIP && (
    <TooltipPopup
        title={activePopup.data.title}
        content={activePopup.data.content}
        icon={activePopup.data.icon}
        position={activePopup.position}
        actions={activePopup.data.actions}
    />
)}`}
                    </pre>
                </div>
            </div>

            {/* Render active tooltip */}
            {activePopup?.type === PopupType.TOOLTIP && (
                <TooltipPopup
                    title={activePopup.data.title}
                    content={activePopup.data.content}
                    icon={activePopup.data.icon}
                    position={activePopup.position}
                    actions={activePopup.data.actions}
                />
            )}
        </div>
    );
}
