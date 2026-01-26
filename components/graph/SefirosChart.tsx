'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type ViewMode = 'akudim' | 'nekudim' | 'berudim';
type HiddenSefirah = 'keter' | 'daas';

interface Sefirah {
  id: string;
  hebrew: string;
  english: string;
  slug: string;
  color: string;
  order: number; // For vertical stacking in Akudim/Nekudim
}

interface Connection {
  from: string;
  to: string;
}

// Sefirot data (positions calculated dynamically based on view mode)
const SEFIROT: Sefirah[] = [
  { id: 'keter', hebrew: 'כתר', english: 'Keter', slug: 'keter', color: '#FFFFFF', order: 0 },
  { id: 'chochmah', hebrew: 'חכמה', english: 'Chochmah', slug: 'chochmah', color: '#87CEEB', order: 1 },
  { id: 'binah', hebrew: 'בינה', english: 'Binah', slug: 'binah', color: '#90EE90', order: 2 },
  { id: 'daas', hebrew: 'דעת', english: "Da'as", slug: 'daas', color: '#E8E8E8', order: 3 },
  { id: 'chesed', hebrew: 'חסד', english: 'Chesed', slug: 'chesed', color: '#C0C0C0', order: 4 },
  { id: 'gevurah', hebrew: 'גבורה', english: 'Gevurah', slug: 'gevurah', color: '#FFD700', order: 5 },
  { id: 'tiferet', hebrew: 'תפארת', english: 'Tiferet', slug: 'tiferet', color: '#FFFF00', order: 6 },
  { id: 'netzach', hebrew: 'נצח', english: 'Netzach', slug: 'netzach', color: '#FFB6C1', order: 7 },
  { id: 'hod', hebrew: 'הוד', english: 'Hod', slug: 'hod', color: '#FFA500', order: 8 },
  { id: 'yesod', hebrew: 'יסוד', english: 'Yesod', slug: 'yesod', color: '#DDA0DD', order: 9 },
  { id: 'malchut', hebrew: 'מלכות', english: 'Malchut', slug: 'malchut', color: '#4169E1', order: 10 },
];

// Berudim connections (classic Tree of Life)
const CONNECTIONS: Connection[] = [
  { from: 'keter', to: 'chochmah' },
  { from: 'keter', to: 'binah' },
  { from: 'chochmah', to: 'binah' },
  { from: 'chochmah', to: 'daas' },
  { from: 'binah', to: 'daas' },
  { from: 'chochmah', to: 'chesed' },
  { from: 'chochmah', to: 'tiferet' },
  { from: 'binah', to: 'gevurah' },
  { from: 'binah', to: 'tiferet' },
  { from: 'daas', to: 'tiferet' },
  { from: 'chesed', to: 'gevurah' },
  { from: 'chesed', to: 'tiferet' },
  { from: 'chesed', to: 'netzach' },
  { from: 'gevurah', to: 'tiferet' },
  { from: 'gevurah', to: 'hod' },
  { from: 'tiferet', to: 'netzach' },
  { from: 'tiferet', to: 'hod' },
  { from: 'tiferet', to: 'yesod' },
  { from: 'netzach', to: 'hod' },
  { from: 'netzach', to: 'yesod' },
  { from: 'hod', to: 'yesod' },
  { from: 'yesod', to: 'malchut' },
];

// Position calculations for each view mode
const getPositions = (mode: ViewMode) => {
  const centerX = 300;
  
  switch (mode) {
    case 'akudim': {
      // All in one circle - all centered
      return SEFIROT.map((s, i) => ({
        ...s,
        x: centerX,
        y: 250,
      }));
    }
    
    case 'nekudim': {
      // Vertical column
      const startY = 30;
      const spacing = 38;
      return SEFIROT.map((s, i) => ({
        ...s,
        x: centerX,
        y: startY + (i * spacing),
      }));
    }
    
    case 'berudim': {
      // Classic Tree of Life - three pillars
      const positions: Record<string, { x: number; y: number }> = {
        keter: { x: 300, y: 50 },
        chochmah: { x: 450, y: 120 },
        binah: { x: 150, y: 120 },
        daas: { x: 300, y: 150 }, // Slightly below Chochmah/Binah line
        chesed: { x: 450, y: 220 },
        gevurah: { x: 150, y: 220 },
        tiferet: { x: 300, y: 250 },
        netzach: { x: 450, y: 350 },
        hod: { x: 150, y: 350 },
        yesod: { x: 300, y: 350 },
        malchut: { x: 300, y: 450 },
      };
      return SEFIROT.map(s => ({
        ...s,
        x: positions[s.id]?.x ?? centerX,
        y: positions[s.id]?.y ?? 250,
      }));
    }
  }
};

interface SefirosChartProps {
  className?: string;
  interactive?: boolean;
}

export function SefirosChart({
  className,
  interactive = true,
}: SefirosChartProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('berudim');
  const [hiddenSefirah, setHiddenSefirah] = useState<HiddenSefirah>('keter');
  
  const nodeRadius = viewMode === 'akudim' ? 120 : viewMode === 'nekudim' ? 18 : 32;
  
  const positionedSefirot = useMemo(() => 
    getPositions(viewMode), 
    [viewMode]
  );
  
  const getSefirah = (id: string) => positionedSefirot.find(s => s.id === id);
  
  const handleClick = (sefirah: Sefirah) => {
    if (interactive && sefirah.slug) {
      router.push(`/topics/${sefirah.slug}`);
    }
  };

  // All connections visible
  const visibleConnections = CONNECTIONS;

  const viewModeLabels: Record<ViewMode, { hebrew: string; english: string; subtitle: string }> = {
    akudim: { hebrew: 'עקודים', english: 'Akudim', subtitle: 'Banded' },
    nekudim: { hebrew: 'נקודים', english: 'Nekudim', subtitle: 'Dotted' },
    berudim: { hebrew: 'ברודים', english: 'Berudim', subtitle: 'Patterned' },
  };

  return (
    <div className={cn('relative w-full max-w-2xl mx-auto', className)}>
      {/* View Mode Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        {(['akudim', 'nekudim', 'berudim'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
              'border border-border/50',
              viewMode === mode
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="block text-base">{viewModeLabels[mode].hebrew}</span>
            <span className="block text-xs opacity-70">{viewModeLabels[mode].subtitle}</span>
          </button>
        ))}
      </div>

      {/* Keter/Da'as Toggle - which one is "hidden" (shown with dotted line) */}
      <div className="flex justify-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground self-center mr-2">Hidden (11th):</span>
        {(['keter', 'daas'] as HiddenSefirah[]).map((sefirah) => (
          <button
            key={sefirah}
            onClick={() => setHiddenSefirah(sefirah)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-all duration-300',
              'border border-border/50',
              hiddenSefirah === sefirah
                ? 'bg-muted text-foreground'
                : 'bg-background hover:bg-muted/50 text-muted-foreground'
            )}
          >
            {sefirah === 'keter' ? 'כתר (Keter)' : "דעת (Da'as)"}
          </button>
        ))}
      </div>
      
      <svg
        viewBox="0 0 600 500"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Akudim: Large containing circle */}
        {viewMode === 'akudim' && (
          <circle
            cx={300}
            cy={250}
            r={140}
            fill="none"
            stroke="#ccc"
            strokeWidth={2}
            className="transition-all duration-500"
          />
        )}
        
        {/* Draw connections (only in Berudim mode) */}
        {viewMode === 'berudim' && (
          <g className="connections">
            {visibleConnections.map((conn, i) => {
              const from = getSefirah(conn.from);
              const to = getSefirah(conn.to);
              if (!from || !to) return null;
              
              const isHighlighted = hoveredId === conn.from || hoveredId === conn.to;
              
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isHighlighted ? '#666' : '#ccc'}
                  strokeWidth={isHighlighted ? 3 : 2}
                  className="transition-all duration-500"
                />
              );
            })}
          </g>
        )}
        
        {/* Draw nodes */}
        <g className="nodes">
          {viewMode === 'akudim' ? (
            // Akudim: All names listed inside one circle
            <g transform="translate(300, 250)">
              <circle
                r={nodeRadius}
                fill="#f8f8f8"
                stroke="#999"
                strokeWidth={3}
                className="transition-all duration-500"
              />
              {positionedSefirot.map((sefirah, i) => (
                <text
                  key={sefirah.id}
                  y={-95 + (i * 19)}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="500"
                  fill="#333"
                  className="pointer-events-none select-none"
                >
                  {sefirah.hebrew}
                </text>
              ))}
            </g>
          ) : (
            // Nekudim & Berudim: Individual circles
            positionedSefirot.map((sefirah) => {
              const isHovered = hoveredId === sefirah.id;
              const isHiddenSefirah = sefirah.id === hiddenSefirah;
              
              return (
                <g
                  key={sefirah.id}
                  className="transition-all duration-500"
                  style={{
                    transform: `translate(${sefirah.x}px, ${sefirah.y}px)`,
                  }}
                >
                  <g
                    onClick={() => handleClick(sefirah)}
                    onMouseEnter={() => setHoveredId(sefirah.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={interactive ? 'cursor-pointer' : ''}
                  >
                    <circle
                      r={isHovered ? nodeRadius + 3 : nodeRadius}
                      fill={sefirah.color}
                      stroke={isHovered ? '#333' : '#666'}
                      strokeWidth={isHovered ? 3 : 2}
                      strokeDasharray={isHiddenSefirah ? '4,4' : undefined}
                      className="transition-all duration-300"
                    />
                    
                    <text
                      y={viewMode === 'nekudim' ? 5 : 4}
                      textAnchor="middle"
                      fontSize={viewMode === 'nekudim' ? '11' : '16'}
                      fontWeight="bold"
                      fill="#333"
                      className="pointer-events-none select-none"
                    >
                      {sefirah.hebrew}
                    </text>
                    
                    {viewMode === 'berudim' && (
                      <text
                        y={nodeRadius + 16}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#666"
                        className="pointer-events-none select-none"
                      >
                        {sefirah.english}
                      </text>
                    )}
                  </g>
                </g>
              );
            })
          )}
        </g>
      </svg>
      
      {/* Mode Description */}
      <div className="text-center mt-4 text-sm text-muted-foreground">
        {viewMode === 'akudim' && (
          <p>All Sefirot bound in one unified vessel — Pre-tzimtzum state</p>
        )}
        {viewMode === 'nekudim' && (
          <p>Each Sefirah in its own vessel, unconnected — World of Tohu</p>
        )}
        {viewMode === 'berudim' && (
          <p>Interconnected Tree of Life — World of Tikun</p>
        )}
      </div>
      
      {/* Instructions */}
      {interactive && viewMode === 'berudim' && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-md border border-border/50">
          Click to explore
        </div>
      )}
    </div>
  );
}

export default SefirosChart;
