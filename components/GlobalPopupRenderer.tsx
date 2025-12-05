'use client';

import { usePopup, PopupType } from '@/lib/popup-context';
import { InstantLookup } from '@/components/InstantLookup';
import { FootnotePopup } from '@/components/FootnotePopup';
import { TooltipPopup } from '@/components/TooltipPopup';

export function GlobalPopupRenderer() {
    const { activePopup } = usePopup();

    if (!activePopup) return null;

    switch (activePopup.type) {
        case PopupType.INSTANT_LOOKUP:
            return (
                <InstantLookup
                    term={activePopup.data.term}
                    position={activePopup.position}
                />
            );
        case PopupType.FOOTNOTE:
            return (
                <FootnotePopup
                    footnoteText={activePopup.data.footnoteText}
                    position={activePopup.position}
                    availableCitations={activePopup.data.availableCitations}
                    onViewSource={activePopup.data.onViewSource}
                />
            );
        case PopupType.TOOLTIP:
            return (
                <TooltipPopup
                    title={activePopup.data.title}
                    content={activePopup.data.content}
                    icon={activePopup.data.icon}
                    position={activePopup.position}
                    actions={activePopup.data.actions}
                />
            );
        default:
            return null;
    }
}

