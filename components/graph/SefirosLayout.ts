/**
 * Sefiros Layout Configuration
 * Based on traditional Kabbalistic three-pillar arrangement
 */

export interface SefirahPosition {
  id: string;
  hebrew: string;
  english: string;
  slug: string;
  pillar: 'right' | 'left' | 'center';
  level: number; // 1=top, 4=bottom
  x: number;
  y: number;
  color: string;
}

export interface SefirahConnection {
  source: string;
  target: string;
  type: 'primary' | 'secondary' | 'triad';
  strength: number;
}

/**
 * Traditional Sefiros Tree Layout
 * Elliptical arrangement following sacred geometry
 * Center: 400, vertical spacing creates natural flow
 */
export const SEFIROS_LAYOUT: SefirahPosition[] = [
  // Level 1 - Crown (Keter)
  {
    id: '163',
    hebrew: 'כתר',
    english: 'Keter',
    slug: 'keter',
    pillar: 'center',
    level: 1,
    x: 400,
    y: 60,
    color: '#E8E8E8' // Light silver/white
  },
  
  // Level 2 - Intellectual Sefiros (wider spacing)
  {
    id: '164', // Chochmah
    hebrew: 'חכמה',
    english: 'Chochmah',
    slug: 'chochmah',
    pillar: 'right',
    level: 2,
    x: 280,
    y: 140,
    color: '#87CEEB' // Sky blue
  },
  {
    id: '165', // Binah
    hebrew: 'בינה',
    english: 'Binah',
    slug: 'binah',
    pillar: 'left',
    level: 2,
    x: 520,
    y: 140,
    color: '#9370DB' // Medium purple
  },
  
  // Level 3 - Emotional Sefiros (widest point of ellipse)
  {
    id: '166', // Chesed
    hebrew: 'חסד',
    english: 'Chesed',
    slug: 'chesed',
    pillar: 'right',
    level: 3,
    x: 240,
    y: 240,
    color: '#87CEEB' // Light blue - loving-kindness
  },
  {
    id: '167', // Gevurah
    hebrew: 'גבורה',
    english: 'Gevurah',
    slug: 'gevurah',
    pillar: 'left',
    level: 3,
    x: 560,
    y: 240,
    color: '#DC143C' // Crimson red - strength/judgment
  },
  {
    id: '168', // Tiferet
    hebrew: 'תפארת',
    english: 'Tiferet',
    slug: 'tiferet',
    pillar: 'center',
    level: 3,
    x: 400,
    y: 240,
    color: '#FFD700' // Gold - beauty/harmony
  },
  
  // Level 4 - Action Sefiros (narrowing)
  {
    id: '169', // Netzach
    hebrew: 'נצח',
    english: 'Netzach',
    slug: 'netzach',
    pillar: 'right',
    level: 4,
    x: 280,
    y: 340,
    color: '#98FB98' // Pale green - victory/eternity
  },
  {
    id: '170', // Hod
    hebrew: 'הוד',
    english: 'Hod',
    slug: 'hod',
    pillar: 'left',
    level: 4,
    x: 520,
    y: 340,
    color: '#FFA500' // Orange - splendor/glory
  },
  {
    id: '171', // Yesod
    hebrew: 'יסוד',
    english: 'Yesod',
    slug: 'yesod',
    pillar: 'center',
    level: 4,
    x: 400,
    y: 340,
    color: '#9370DB' // Purple - foundation
  },
  
  // Level 5 - Kingdom (Malchut)
  {
    id: '172',
    hebrew: 'מלכות',
    english: 'Malchut',
    slug: 'malchut',
    pillar: 'center',
    level: 5,
    x: 400,
    y: 440,
    color: '#4169E1' // Royal blue - kingdom
  }
];

/**
 * The 22 Paths of the Tree of Life
 * Traditional Kabbalistic connections between Sefiros
 */
export const SEFIROS_CONNECTIONS: SefirahConnection[] = [
  // Vertical paths (Middle Pillar)
  { source: '163', target: '168', type: 'primary', strength: 100 }, // Keter → Tiferet
  { source: '168', target: '171', type: 'primary', strength: 100 }, // Tiferet → Yesod
  { source: '171', target: '172', type: 'primary', strength: 100 }, // Yesod → Malchut
  
  // Right Pillar (Pillar of Mercy)
  { source: '164', target: '166', type: 'primary', strength: 90 },  // Chochmah → Chesed
  { source: '166', target: '169', type: 'primary', strength: 90 },  // Chesed → Netzach
  
  // Left Pillar (Pillar of Severity)
  { source: '165', target: '167', type: 'primary', strength: 90 },  // Binah → Gevurah
  { source: '167', target: '170', type: 'primary', strength: 90 },  // Gevurah → Hod
  
  // Horizontal paths
  { source: '164', target: '165', type: 'secondary', strength: 70 }, // Chochmah ↔ Binah
  { source: '166', target: '167', type: 'secondary', strength: 70 }, // Chesed ↔ Gevurah
  { source: '169', target: '170', type: 'secondary', strength: 70 }, // Netzach ↔ Hod
  
  // Diagonal paths from Keter
  { source: '163', target: '164', type: 'secondary', strength: 80 }, // Keter → Chochmah
  { source: '163', target: '165', type: 'secondary', strength: 80 }, // Keter → Binah
  
  // Diagonal paths to Tiferet
  { source: '164', target: '168', type: 'secondary', strength: 75 }, // Chochmah → Tiferet
  { source: '165', target: '168', type: 'secondary', strength: 75 }, // Binah → Tiferet
  { source: '166', target: '168', type: 'secondary', strength: 75 }, // Chesed → Tiferet
  { source: '167', target: '168', type: 'secondary', strength: 75 }, // Gevurah → Tiferet
  
  // Diagonal paths to Yesod
  { source: '166', target: '171', type: 'secondary', strength: 65 }, // Chesed → Yesod
  { source: '167', target: '171', type: 'secondary', strength: 65 }, // Gevurah → Yesod
  { source: '169', target: '171', type: 'secondary', strength: 65 }, // Netzach → Yesod
  { source: '170', target: '171', type: 'secondary', strength: 65 }, // Hod → Yesod
  
  // Cross-pillar diagonals
  { source: '164', target: '167', type: 'triad', strength: 50 },     // Chochmah → Gevurah
  { source: '165', target: '166', type: 'triad', strength: 50 },     // Binah → Chesed
];


/**
 * Convert layout to ForceGraph format
 */
export const toForceGraphNodes = () => {
  return SEFIROS_LAYOUT.map(sefirah => ({
    id: sefirah.id,
    label: sefirah.hebrew,
    labelHebrew: sefirah.hebrew,
    slug: sefirah.slug,
    category: 'sefirah',
    size: 1.2, // Slightly larger than regular nodes
    x: sefirah.x,
    y: sefirah.y,
    fx: sefirah.x, // Fixed position
    fy: sefirah.y, // Fixed position
  }));
};

export const toForceGraphEdges = () => {
  return SEFIROS_CONNECTIONS.map(conn => ({
    source: conn.source,
    target: conn.target,
    type: conn.type,
    strength: conn.strength,
    description: `${conn.type} connection`
  }));
};
