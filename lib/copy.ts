/**
 * Centralized Copy & Messaging
 * 
 * Design Philosophy: Verb-first, action-oriented language
 * Inspired by Obsidian's "Sharpen your thinking" approach
 * 
 * Instead of: "Chassidus Research Platform"
 * We use: "Deepen your understanding"
 * 
 * Every piece of copy should encourage exploration and action.
 */

export const copy = {
  // ===================
  // BRAND & TAGLINES
  // ===================
  brand: {
    name: 'Chabad Mafteach',
    tagline: 'Deepen your understanding',
    taglineAlt: 'Connect the ideas',
    taglineShort: 'Your Torah thinking space',
  },

  // ===================
  // HOMEPAGE
  // ===================
  home: {
    hero: {
      title: 'Deepen Your Understanding',
      titleRotatingWords: ['Understanding', 'Chassidic Wisdom', 'Divine Truth', 'Inner Light', 'Torah Insights'],
      subtitle: 'Explore concepts. Discover connections. Uncover the sources that illuminate Chassidic thought.',
      badge: 'Now in Beta',
    },
    mobile: {
      greeting: 'Ready to Learn?',
      subtitle: 'Dive into Chassidic wisdom',
    },
    sections: {
      discover: 'Start Exploring',
      featured: 'Dive Into Topics',
      collections: 'Curated Journeys',
    },
    features: {
      aiPowered: 'Smart Search',
      instantResults: 'Instant Discovery',
      bilingual: 'Hebrew & English',
    },
  },

  // ===================
  // TOPICS PAGE
  // ===================
  topics: {
    pageTitle: 'Explore Concepts',
    pageSubtitle: 'Discover Chassidic ideas and the sources that discuss them',
    searchPlaceholder: 'Search for any concept...',
    categoryFilter: 'Filter by category',
    emptyState: {
      title: 'No topics found',
      description: 'Try a different search term or browse all categories',
      cta: 'Browse All Topics',
    },
    card: {
      sources: 'sources',
      viewTopic: 'Explore this topic',
      relatedTopics: 'Related concepts',
    },
  },

  // ===================
  // TOPIC DETAIL PAGE
  // ===================
  topicDetail: {
    tabs: {
      overview: 'Overview',
      article: 'Deep Dive',
      sources: 'Sources',
      related: 'Connections',
      boundaries: 'Distinctions',
    },
    cta: {
      readMore: 'Continue Reading',
      viewSource: 'View in Context',
      copyQuote: 'Copy Quote',
      exploreRelated: 'Explore Related',
      backToTopics: 'Back to Topics',
    },
    emptyArticle: {
      title: 'Article in Progress',
      description: 'Our team is crafting this article. In the meantime, explore the sources below.',
      cta: 'Browse Sources',
    },
  },

  // ===================
  // SEARCH
  // ===================
  search: {
    placeholder: 'Search topics, sources, authors...',
    placeholderShort: 'Search...',
    recentSearches: 'Recent Searches',
    suggestions: 'Suggestions',
    noResults: {
      title: 'No results found',
      description: 'Try different keywords or browse topics',
      cta: 'Browse Topics',
    },
    categories: {
      topics: 'Concepts',
      sources: 'Sources',
      authors: 'Authors',
    },
  },

  // ===================
  // ABOUT PAGE
  // ===================
  about: {
    hero: {
      title: 'About Chabad Mafteach',
      subtitle: 'Bridging profound concepts with the sources that illuminate them',
    },
    mission: {
      title: 'Our Mission',
      paragraphs: [
        'The depth of Chassidic philosophy spans thousands of volumes and centuries of scholarship. Finding the precise source for a specific concept can feel overwhelming.',
        'We\'re building an intelligent index that maps the interconnected world of Chassidus—making timeless teachings accessible to everyone.',
        'From beginners exploring their first Maamar to scholars conducting deep research, this is your thinking space for Torah.',
      ],
    },
    features: [
      {
        title: 'Smart Discovery',
        description: 'Find concepts even without exact wording—our semantic engine understands what you\'re looking for.',
      },
      {
        title: 'Built by Learners',
        description: 'Created by researchers who understand the nuances of how you study.',
      },
      {
        title: 'Labor of Love',
        description: 'A non-profit initiative dedicated to spreading the wellsprings outward.',
      },
    ],
    cta: {
      title: 'Join the Journey',
      description: 'We\'re constantly expanding. Contribute sources, suggest features, or report issues—we\'d love to hear from you.',
      primary: 'Get in Touch',
      secondary: 'Submit a Source',
    },
  },

  // ===================
  // ACTIONS & BUTTONS
  // ===================
  actions: {
    explore: 'Explore',
    discover: 'Discover',
    browse: 'Browse',
    search: 'Search',
    read: 'Read',
    learn: 'Learn More',
    continue: 'Continue',
    back: 'Back',
    save: 'Save',
    share: 'Share',
    copy: 'Copy',
    view: 'View',
    viewAll: 'View All',
    seeMore: 'See More',
    startExploring: 'Start Exploring',
    diveDeeper: 'Dive Deeper',
    getStarted: 'Get Started',
  },

  // ===================
  // NAVIGATION
  // ===================
  nav: {
    home: 'Home',
    topics: 'Explore',
    collections: 'Collections',
    about: 'About',
    search: 'Search',
  },

  // ===================
  // EMPTY STATES & ERRORS
  // ===================
  states: {
    loading: 'Loading...',
    error: {
      title: 'Something went wrong',
      description: 'We couldn\'t load this content. Please try again.',
      cta: 'Try Again',
    },
    notFound: {
      title: 'Page not found',
      description: 'The page you\'re looking for doesn\'t exist or has been moved.',
      cta: 'Return Home',
    },
    comingSoon: {
      title: 'Coming Soon',
      description: 'We\'re working on this feature. Check back soon!',
    },
  },

  // ===================
  // METADATA / SEO
  // ===================
  meta: {
    defaultTitle: 'Chabad Mafteach - Deepen Your Understanding',
    defaultDescription: 'Explore Chassidic concepts and discover the sources that illuminate them. Your thinking space for Torah.',
    keywords: ['Chassidus', 'Chabad', 'Torah', 'Jewish wisdom', 'Kabbalah', 'Tanya', 'Mysticism'],
    ogTitle: 'Chabad Mafteach - Deepen Your Understanding',
    ogDescription: 'Explore Chassidic concepts and discover connections across all Chabad literature.',
    twitterTitle: 'Chabad Mafteach',
    twitterDescription: 'Your Torah thinking space',
  },
} as const;

// Type exports for autocomplete
export type CopyKeys = keyof typeof copy;
export type HomeCopy = typeof copy.home;
export type TopicsCopy = typeof copy.topics;
export type ActionsCopy = typeof copy.actions;
