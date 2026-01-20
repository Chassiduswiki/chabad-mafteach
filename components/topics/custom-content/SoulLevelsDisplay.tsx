'use client';

import React from 'react';

interface SoulLevelDefinition {
    hebrew: string;
    term: string;
    description: string;
}

interface SoulLevelRow {
    level: string;
    term: string;
    translation: string;
    representation: string;
    details: string;
}

const parseSoulLevelsContent = (content: string) => {
    const definitions: SoulLevelDefinition[] = [];
    const tableRows: SoulLevelRow[] = [];

    const lines = content.split('\n').filter(line => line.trim() !== '');

    // Simple state machine to parse definitions and table
    let parsingState = 'definitions';

    lines.forEach(line => {
        if (line.includes('Soul Level') && line.includes('Literal Translation')) {
            parsingState = 'table_header'; // Skip header line
            return;
        }

        if (parsingState === 'definitions') {
            const match = line.match(/(.+?): (.*)/);
            if (match) {
                const [full, termPart, description] = match;
                const hebrewMatch = termPart.match(/([\u0590-\u05FF]+),/);
                const hebrew = hebrewMatch ? hebrewMatch[1] : '';
                const term = termPart.replace(/[\u0590-\u05FF]+,/, '').trim();
                definitions.push({ hebrew, term, description });
            }
        } else if (parsingState.startsWith('table')) {
            const parts = line.split(/\s{2,}|\t/); // Split by 2+ spaces or tab
            if (parts.length >= 4) {
                tableRows.push({
                    level: parts[0]?.trim() || '',
                    term: parts[1]?.trim() || '',
                    translation: parts[2]?.trim() || '',
                    representation: parts[3]?.trim() || '',
                    details: parts.slice(4).join(' ') || '',
                });
            }
        }
        
        if (parsingState === 'table_header') {
            parsingState = 'table_body';
        }
    });

    return { definitions, tableRows };
};


export const SoulLevelsDisplay = ({ content }: { content: string }) => {
    // Strip HTML tags to get plain text, but try to preserve line breaks from block elements.
    const plainTextContent = content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>|<\/li>|<\/div>/gi, '\n')
        .replace(/<[^>]*>/g, '');

    const { definitions, tableRows } = parseSoulLevelsContent(plainTextContent);

    return (
        <div className="space-y-12">
            {/* Definitions Section */}
            <div className="space-y-6">
                {definitions.map((def, index) => (
                    <div key={index} className="pl-4 border-l-2 border-primary/20">
                        <h4 className="font-semibold text-lg text-foreground flex items-center gap-2">
                            {def.term}
                            {def.hebrew && <span className="text-xl font-serif text-primary/80" lang="he">{def.hebrew}</span>}
                        </h4>
                        <p className="text-muted-foreground mt-1">{def.description}</p>
                    </div>
                ))}
            </div>

            {/* Table Section */}
            {tableRows.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left table-auto">
                        <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider text-xs">
                            <tr>
                                <th className="p-3">Level</th>
                                <th className="p-3">Term</th>
                                <th className="p-3">Literal Translation</th>
                                <th className="p-3">Represents</th>
                                <th className="p-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tableRows.map((row, index) => (
                                <tr key={index} className="hover:bg-muted/50">
                                    <td className="p-3 font-medium">{row.level}</td>
                                    <td className="p-3 font-semibold text-foreground">{row.term}</td>
                                    <td className="p-3">{row.translation}</td>
                                    <td className="p-3">{row.representation}</td>
                                    <td className="p-3 text-muted-foreground">{row.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
