'use client';

import React from 'react';

interface TabularDataDisplayProps {
    content: string;
}

export const TabularDataDisplay = ({ content }: TabularDataDisplayProps) => {
    const parseTabularData = (text: string) => {
        // Split into sections
        const parts = text.split('Basic Hishtalshelus Reference Chart');
        
        if (parts.length < 2) return null;
        
        const beforeTable = parts[0];
        const tableContent = parts[1];
        
        // Split table content by lines and filter empty
        const lines = tableContent.split('\n').map(l => l.trim()).filter(Boolean);
        
        if (lines.length === 0) return null;
        
        // Fixed headers for this specific table
        const headers = ['#', 'Name of Stage', 'Soul – Body Metaphor', 'Language Metaphor'];
        
        // Skip the header lines (first 4 lines: #, Name of Stage, Soul – Body Metaphor, Language Metaphor)
        let startIdx = 0;
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            if (/^\d+$/.test(lines[i])) {
                startIdx = i;
                break;
            }
        }
        
        // Group lines into rows - each row starts with a number
        const rawRows: string[][] = [];
        let currentLines: string[] = [];
        
        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if this line starts a new row (is a number like 1, 2, 8.1)
            if (/^\d+\.?\d*$/.test(line) && currentLines.length > 0) {
                rawRows.push(currentLines);
                currentLines = [line];
            } else {
                currentLines.push(line);
            }
        }
        if (currentLines.length > 0) {
            rawRows.push(currentLines);
        }
        
        // Now organize each raw row into 4 columns
        const dataRows: { num: string; name: string[]; soulBody: string[]; language: string[] }[] = [];
        
        for (const rawRow of rawRows) {
            const num = rawRow[0];
            const rest = rawRow.slice(1);
            
            // Find Hebrew text (Name of Stage starts with Hebrew)
            // Pattern: Hebrew name, transliteration, English translation, then Soul-Body content, then Language content
            const name: string[] = [];
            const soulBody: string[] = [];
            const language: string[] = [];
            
            let section = 'name'; // Start with name section
            
            for (const line of rest) {
                const isHebrew = /[\u0590-\u05FF]/.test(line);
                const isEnglishName = /^[A-Z][a-z]+ (of |the )?[A-Z]/.test(line) || /^(Essence|Contraction|Impression|Line|Original|Ten|Emanation|Ancient|Long|Father|Mother|Small|Female|Curtain|Creation|Formation|Actualization)/.test(line);
                
                if (section === 'name') {
                    if (isHebrew || /^[A-Z][a-z]+$/.test(line) || /^[A-Z][a-z]+ [A-Z]/.test(line)) {
                        name.push(line);
                        // After 3 items in name (Hebrew, transliteration, English), move to soulBody
                        if (name.length >= 3) section = 'soulBody';
                    } else {
                        section = 'soulBody';
                        soulBody.push(line);
                    }
                } else if (section === 'soulBody') {
                    // Check for transition to language section
                    // Language metaphors often have keywords like "expression", "Language", "symbol", etc.
                    const isLanguageContent = /^(Direct|Focus|Symbol|Order|Axiom|Moral|Meaning|Message|Expression|Fulfillment|Desire|Goals|Insight|Intellect|Understanding|Rationality|Emotions|Responsiveness|Expressiveness|Language Barrier|Thought Language|Spoken Language|Written Language|Definition|Sounds|Action|Ink|Etched)/.test(line);
                    
                    if (isLanguageContent || (soulBody.length >= 2 && !isHebrew && rest.indexOf(line) > rest.length / 2)) {
                        section = 'language';
                        language.push(line);
                    } else {
                        soulBody.push(line);
                    }
                } else {
                    language.push(line);
                }
            }
            
            dataRows.push({ num, name, soulBody, language });
        }
        
        return { beforeTable, headers, dataRows };
    };
    
    const data = parseTabularData(content);
    
    if (!data) {
        return <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">{content}</div>;
    }
    
    const { beforeTable, headers, dataRows } = data;
    
    return (
        <div className="space-y-8">
            {/* Bullet points before table */}
            {beforeTable && (
                <div className="space-y-4">
                    {beforeTable.split('•').filter(Boolean).map((bullet, idx) => (
                        <div key={idx} className="flex gap-3">
                            <span className="text-amber-500 dark:text-amber-400 font-bold text-lg mt-1">•</span>
                            <div className="flex-1 prose prose-lg dark:prose-invert leading-relaxed">
                                {bullet.trim()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full border-collapse shadow-lg rounded-lg overflow-hidden table-fixed">
                        <thead className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10">
                            <tr>
                                <th className="w-12 text-center font-bold text-xs uppercase tracking-wider px-3 py-4 border-b-2 border-amber-500/20 text-foreground/90">#</th>
                                <th className="w-40 text-left font-bold text-xs uppercase tracking-wider px-4 py-4 border-b-2 border-amber-500/20 text-foreground/90">Name of Stage</th>
                                <th className="text-left font-bold text-xs uppercase tracking-wider px-4 py-4 border-b-2 border-amber-500/20 text-foreground/90">Soul – Body Metaphor</th>
                                <th className="text-left font-bold text-xs uppercase tracking-wider px-4 py-4 border-b-2 border-amber-500/20 text-foreground/90">Language Metaphor</th>
                            </tr>
                        </thead>
                        <tbody className="bg-background divide-y divide-border/10">
                            {dataRows.map((row, rowIdx) => {
                                const isSubItem = row.num.includes('.');
                                
                                return (
                                    <tr 
                                        key={rowIdx}
                                        className={`transition-all duration-150 hover:bg-amber-500/5 ${isSubItem ? 'bg-muted/5' : ''}`}
                                    >
                                        {/* Number column */}
                                        <td className={`px-3 py-4 border-b border-border/20 text-center align-top font-bold text-lg ${isSubItem ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-500'}`}>
                                            {row.num}
                                        </td>
                                        
                                        {/* Name of Stage column */}
                                        <td className="px-4 py-4 border-b border-border/20 align-top">
                                            <div className="space-y-0.5">
                                                {row.name.map((line: string, lIdx: number) => {
                                                    const isHebrew = /[\u0590-\u05FF]/.test(line);
                                                    return (
                                                        <div 
                                                            key={lIdx}
                                                            className={isHebrew ? 'text-base font-semibold' : lIdx === 1 ? 'text-xs text-muted-foreground' : 'text-sm font-medium'}
                                                        >
                                                            {line}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        
                                        {/* Soul-Body Metaphor column */}
                                        <td className="px-4 py-4 border-b border-border/20 align-top">
                                            <div className="text-sm leading-relaxed space-y-1">
                                                {row.soulBody.map((line: string, idx: number) => (
                                                    <p key={idx}>{line}</p>
                                                ))}
                                            </div>
                                        </td>
                                        
                                        {/* Language Metaphor column */}
                                        <td className="px-4 py-4 border-b border-border/20 align-top">
                                            <div className="text-sm leading-relaxed space-y-1">
                                                {row.language.map((line: string, idx: number) => (
                                                    <p key={idx}>{line}</p>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
