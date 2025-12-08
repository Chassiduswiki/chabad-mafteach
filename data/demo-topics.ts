// Demo topics for testing the topics pages
// These can be used directly in the frontend for MVP testing

export interface DemoTopic {
  id: number;
  canonical_title: string;
  slug: string;
  topic_type: 'person' | 'concept' | 'place' | 'event' | 'mitzvah' | 'sefirah';
  description: string;
  overview?: string;
  key_concepts?: Array<{ concept: string; explanation: string }>;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time?: number;
  is_published: boolean;
  status: 'published' | 'draft';
  // Legacy aliases for UI compatibility
  name: string;
  category: string;
  definition_short: string;
}

export const demoTopics: DemoTopic[] = [
  {
    id: 1,
    canonical_title: 'Bittul',
    slug: 'bittul',
    topic_type: 'concept',
    description: 'The spiritual concept of self-nullification and ego transcendence in Chassidic philosophy. Bittul involves recognizing the divine unity and nullifying one\'s separate existence before God.',
    overview: `# Bittul: Self-Nullification in Divine Service

Bittul (בִּטּוּל) is a fundamental concept in Chassidic philosophy that describes the spiritual practice of self-nullification - the conscious effort to transcend the ego and recognize one's complete dependence on and unity with the Divine.

## Core Meaning

The term literally means "nullification" or "annulment," but in spiritual context it refers to:

1. **Recognition of Divine Unity**: Understanding that everything exists only through God's creative force
2. **Transcendence of Ego**: Moving beyond self-centered consciousness
3. **Devotional Absorption**: Complete immersion in divine service and connection

## Practical Application

In daily spiritual practice, bittul manifests as:
- Humility before God and others
- Detachment from material desires
- Focus on divine purpose over personal gain
- Joy in serving God without expectation of reward

## Relationship to Other Concepts

Bittul is closely connected to:
- **Devekut** (Cleaving): Through nullification of self, one achieves closer divine connection
- **Ahavah** (Love): Selfless love for God flows naturally from ego transcendence
- **Kavannah** (Intent): Proper intention in prayer requires bittul of worldly thoughts`,
    key_concepts: [
      { concept: 'Divine Unity', explanation: 'Understanding that all existence flows from a single divine source' },
      { concept: 'Ego Transcendence', explanation: 'Moving beyond self-centered consciousness to recognize higher reality' },
      { concept: 'Spiritual Humility', explanation: 'The foundation for all other spiritual virtues' }
    ],
    difficulty_level: 'intermediate',
    estimated_read_time: 8,
    is_published: true,
    status: 'published',
    name: 'Bittul',
    category: 'concept',
    definition_short: 'The spiritual concept of self-nullification and ego transcendence in Chassidic philosophy.'
  },
  {
    id: 2,
    canonical_title: 'Devekut',
    slug: 'devekut',
    topic_type: 'concept',
    description: 'The practice of cleaving or attaching oneself to God through constant awareness, prayer, and spiritual devotion. Devekut represents the intimate connection between the soul and its divine source.',
    overview: `# Devekut: Cleaving to the Divine

Devekut (דְּבֵקוּת) is the central Chassidic practice of maintaining constant attachment and cleaving to God in all aspects of life and consciousness.

## Definition and Scope

Devekut encompasses:
- **Constant Divine Awareness**: Maintaining consciousness of God\'s presence at all times
- **Spiritual Attachment**: The soul\'s natural connection to its divine source
- **Emotional Devotion**: Love and awe directed toward God
- **Practical Integration**: Bringing divine consciousness into daily activities

## Levels of Devekut

Chassidic teachings describe multiple levels:
1. **Intellectual**: Understanding divine unity through meditation and study
2. **Emotional**: Feeling love and awe for God
3. **Practical**: Serving God in all worldly actions
4. **Essential**: Complete union of soul and divinity

## Methods of Attainment

Traditional practices include:
- Regular prayer with proper intention (kavannah)
- Meditation on divine unity
- Study of spiritual texts
- Association with spiritual mentors
- Service of the heart through joy and humility`,
    key_concepts: [
      { concept: 'Divine Consciousness', explanation: 'Maintaining constant awareness of God\'s presence in all moments' },
      { concept: 'Spiritual Practice', explanation: 'The methods and disciplines for developing divine attachment' },
      { concept: 'Inner Transformation', explanation: 'The psychological and spiritual changes that result from regular practice' }
    ],
    difficulty_level: 'intermediate',
    estimated_read_time: 10,
    is_published: true,
    status: 'published',
    name: 'Devekut',
    category: 'concept',
    definition_short: 'The practice of cleaving or attaching oneself to God through constant awareness and spiritual devotion.'
  },
  {
    id: 3,
    canonical_title: 'Ahavah',
    slug: 'ahavah',
    topic_type: 'concept',
    description: 'Divine love - both the love God shows to creation and the love humans should develop for God. Ahavah is considered the highest spiritual motivation and the foundation of divine service.',
    overview: `# Ahavah: Divine Love in Spiritual Practice

Ahavah (אַהֲבָה) - love - stands as the highest motivation in Jewish spiritual practice, representing both God\'s love for creation and humanity\'s reciprocal love for the Divine.

## Two Dimensions of Divine Love

### God\'s Love for Creation
- Unconditional creative force that brings all existence into being
- Sustaining presence that maintains reality moment by moment
- Compassionate guidance that leads each soul toward its purpose

### Human Love for God
- Natural response to experiencing divine goodness
- Voluntary commitment to serve and connect with the Divine
- Transformative force that elevates human consciousness

## Development of Divine Love

Chassidic teachings outline stages in developing ahavah:

1. **Natural Love**: The innate soul-connection to God
2. **Intellectual Love**: Love developed through understanding divine greatness
3. **Emotional Love**: Heartfelt affection and longing for God
4. **Essential Love**: Complete identification with divine will

## Practical Expression

Divine love manifests through:
- Joyful performance of commandments
- Compassionate treatment of others
- Gratitude for divine blessings
- Longing for spiritual connection
- Selfless service of creation`,
    key_concepts: [
      { concept: 'Divine Compassion', explanation: 'Understanding God\'s unconditional love as the foundation of reality' },
      { concept: 'Spiritual Motivation', explanation: 'How love for God elevates all religious practice beyond mere obligation' },
      { concept: 'Heart-Service', explanation: 'The primacy of emotional devotion over intellectual understanding alone' }
    ],
    difficulty_level: 'beginner',
    estimated_read_time: 7,
    is_published: true,
    status: 'published',
    name: 'Ahavah',
    category: 'concept',
    definition_short: 'Divine love - the highest spiritual motivation and foundation of divine service.'
  },
  {
    id: 4,
    canonical_title: 'Tanya',
    slug: 'tanya',
    topic_type: 'sefirah',
    description: 'The foundational text of Chabad Chassidic philosophy, authored by Rabbi Shneur Zalman of Liadi. Tanya provides a comprehensive framework for understanding the soul, divine service, and spiritual psychology.',
    overview: `# Tanya: Foundation of Chabad Philosophy

Tanya, formally titled "Likutei Amarim" (Collected Discourses), is the magnum opus of Rabbi Shneur Zalman of Liadi (1745-1812), the first Rebbe of Chabad-Lubavitch.

## Historical Context

Written between 1796-1798, Tanya was revolutionary in its approach to Jewish spirituality, providing:
- Systematic psychology of the soul
- Practical guidance for divine service
- Integration of mystical concepts with daily life
- Framework for spiritual growth accessible to all

## Structure and Content

The work is organized in five sections:
1. **Sefer Shel Beinonim** (Book of Intermediates): Spiritual psychology and service
2. **Shaar HaYichud VeHaEmunah** (Gate of Unity and Faith): Divine unity
3. **Iggeret HaTeshuvah** (Epistle on Repentance): Return and spiritual elevation
4. **Iggeret HaKodesh** (Holy Epistle): Divine service and marriage
5. **Kuntres Acharon** (Last Pamphlet): Advanced mystical concepts

## Core Teachings

### Spiritual Psychology
- Two souls: Divine and animal
- Inner conflicts and their resolution
- Emotional and intellectual service
- Role of meditation and contemplation

### Practical Service
- Prayer with proper intention
- Joy in divine service
- Elevating worldly matters
- Character refinement`,
    key_concepts: [
      { concept: 'Spiritual Psychology', explanation: 'The Tanya\'s systematic approach to understanding soul dynamics' },
      { concept: 'Divine Service', explanation: 'Practical methods for connecting with God in daily life' },
      { concept: 'Chabad Philosophy', explanation: 'The unique synthesis of intellectual understanding and emotional devotion' }
    ],
    difficulty_level: 'advanced',
    estimated_read_time: 15,
    is_published: true,
    status: 'published',
    name: 'Tanya',
    category: 'sefirah',
    definition_short: 'The foundational text of Chabad Chassidic philosophy, providing systematic spiritual psychology.'
  },
  {
    id: 5,
    canonical_title: 'Tzadik',
    slug: 'tzadik',
    topic_type: 'person',
    description: 'A righteous person who has achieved spiritual perfection and serves as a channel for divine blessing. The tzadik embodies the ideal of complete alignment with divine will and spiritual leadership.',
    overview: `# Tzadik: The Righteous Person

The concept of the tzadik (צַדִּיק) - righteous person - represents the pinnacle of spiritual achievement in Jewish thought, embodying complete alignment with divine will and serving as a conduit for blessing to the world.

## Definition and Qualities

A true tzadik is characterized by:
- **Complete Divine Alignment**: Total synchronization with God\'s will
- **Spiritual Perfection**: Mastery over both divine and animal souls
- **Compassionate Leadership**: Guiding others toward spiritual growth
- **Humility**: Recognition that all righteousness comes from God
- **Joy**: Natural happiness from divine connection

## Role in the World

The tzadik serves multiple functions:
- **Spiritual Channel**: Conduit for divine blessing and abundance
- **Teacher**: Guides others on spiritual path
- **Intercessor**: Advocates on behalf of the community
- **Living Example**: Demonstrates possibility of spiritual achievement

## Contemporary Relevance

In modern times, the tzadik concept provides:
- Spiritual leadership in confusing times
- Connection to authentic tradition
- Hope for spiritual growth
- Framework for religious authority`,
    key_concepts: [
      { concept: 'Righteous Leadership', explanation: 'The role of spiritually perfected individuals in guiding communities' },
      { concept: 'Divine Channel', explanation: 'How tzadikim serve as conduits for blessing and spiritual abundance' },
      { concept: 'Spiritual Achievement', explanation: 'The possibility and process of reaching spiritual perfection' }
    ],
    difficulty_level: 'intermediate',
    estimated_read_time: 12,
    is_published: true,
    status: 'published',
    name: 'Tzadik',
    category: 'person',
    definition_short: 'A righteous person who has achieved spiritual perfection and serves as a channel for divine blessing.'
  }
];

// Helper function to get a topic by slug
export function getTopicBySlug(slug: string): DemoTopic | undefined {
  return demoTopics.find(topic => topic.slug === slug);
}

// Helper function to get all published topics
export function getPublishedTopics(): DemoTopic[] {
  return demoTopics.filter(topic => topic.is_published && topic.status === 'published');
}
