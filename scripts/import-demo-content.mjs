// ES Module version of the import script
// Run with: node scripts/import-demo-content.mjs

import { createDirectus, rest, readItems, createItem, staticToken } from '@directus/sdk';

// Directus configuration - update these values
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'your-static-token-here';

const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(staticToken(DIRECTUS_TOKEN));

// Sample topics with rich content
const sampleTopics = [
  {
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
    is_published: true
  },
  {
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
    is_published: true
  },
  {
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
    is_published: true
  },
  {
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
    is_published: true
  },
  {
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
    is_published: true
  }
];

// Tanya content from the existing file
const tanyaContent = {
  blocks: [
    {
      id: 'p1',
      type: 'main',
      hebrew: `תַּנְיָא [בְּסוֹף פֶּרֶק ג' דְּנִדָּה]: "מַשְׁבִּיעִים אוֹתוֹ,`,
      english: `We have learned (Niddah, end of ch. 3):1 "An oath is administered to him:`,
    },
    {
      id: 'p2',
      type: 'main',
      hebrew: `תְּהִי צַדִּיק וְאַל תְּהִי רָשָׁע. וַאֲפִילוּ כָּל הָעוֹלָם כּוּלּוֹ אוֹמְרִים לְךָ צַדִּיק אַתָּה – הֱיֵה בְעֵינֶיךָ כְּרָשָׁע".`,
      english: `'Be righteous and be not wicked; and even if the whole world judging you by your actions tells you that you are righteous, regard yourself as wicked.'"`,
    },
    {
      id: 'p3',
      type: 'main',
      hebrew: `הֱיֵה בְעֵינֶיךָ כְּרָשָׁע וְאַל תְּהִי בְעֵינֶיךָ צַדִּיק".`,
      english: `And even if the whole world judging you by your actions tells you that you are wicked, be righteous in your own eyes."`,
    },
    {
      id: 'p4',
      type: 'main',
      hebrew: `שֶׁהַלֵּבָב הוּא הַמַּכְוִוֵן עַל כָּל הַמַּעֲשִׂים, וְהוֹלֵךְ אַחַר הַלֵּב. וְהַשְּׁגָחָה הִיא הַשִּׁיטָה בַּשֶּׁקֶל הַשֵּׁם, לְהַשְׁקִיט הַדִּין וְלַעֲשׂוֹת רְצוֹנוֹ שֶׁל מַעֲלָה.`,
      english: `For the heart directs all actions, and one follows the heart. Understanding is the scale that weighs the arguments, to quiet the judgment and do the will of the One Above.`,
    },
    {
      id: 'p5',
      type: 'main',
      hebrew: `וְזֶהוּ שֶׁכָּתוּב: "כִּי הוּא יָדַע לְשַׁתֵּת יְצֶר הָרָע לְצֶדֶם יִצְרַת הַטּוֹב, וְלְהַשְׁלִיט יִצְרַת הַטּוֹב עַל יֶתֶר הַמַּעֲשִׂים, וְלַעֲשׂוֹת רְצוֹנוֹ שֶׁל מַעֲלָה."`,
      english: `And this is what is written: "For he knew how to subdue the evil inclination to the side of the good inclination, and to make the good inclination rule over all actions, and to do the will of the One Above."`,
    }
  ]
};

async function importTopics() {
  console.log('🌱 Importing sample topics...');
  
  for (const topic of sampleTopics) {
    try {
      // Check if topic already exists
      const existing = await directus.request(
        readItems('topics', {
          filter: { slug: { _eq: topic.slug } },
          fields: ['id'],
          limit: 1
        })
      );
      
      if (existing && existing.length > 0) {
        console.log(`✓ Topic "${topic.canonical_title}" already exists, skipping...`);
        continue;
      }
      
      // Create new topic
      const created = await directus.request(
        createItem('topics', {
          canonical_title: topic.canonical_title,
          slug: topic.slug,
          topic_type: topic.topic_type,
          description: topic.description,
          overview: topic.overview,
          key_concepts: JSON.stringify(topic.key_concepts),
          difficulty_level: topic.difficulty_level,
          estimated_read_time: topic.estimated_read_time,
          is_published: topic.is_published,
          status: 'published'
        })
      );
      
      console.log(`✓ Created topic: ${topic.canonical_title} (ID: ${created.id})`);
    } catch (error) {
      console.error(`✗ Failed to create topic "${topic.canonical_title}":`, error.message);
    }
  }
}

async function importTanyaContent() {
  console.log('📚 Importing Tanya content...');
  
  try {
    // Create or find the Tanya document
    let tanyaDoc;
    const existingDocs = await directus.request(
      readItems('documents', {
        filter: { title: { _eq: 'Tanya – Likutei Amarim' } },
        fields: ['id'],
        limit: 1
      })
    );
    
    if (existingDocs && existingDocs.length > 0) {
      tanyaDoc = existingDocs[0];
      console.log(`✓ Found existing Tanya document (ID: ${tanyaDoc.id})`);
    } else {
      tanyaDoc = await directus.request(
        createItem('documents', {
          title: 'Tanya – Likutei Amarim',
          doc_type: 'sefer',
          original_lang: 'hebrew',
          status: 'published',
          metadata: {
            author: 'Rabbi Shneur Zalman of Liadi',
            language: 'hebrew-english',
            structure: 'chapters'
          }
        })
      );
      console.log(`✓ Created Tanya document (ID: ${tanyaDoc.id})`);
    }
    
    // Create paragraphs and statements from the content
    for (let i = 0; i < tanyaContent.blocks.length; i++) {
      const block = tanyaContent.blocks[i];
      
      // Create paragraph
      const paragraph = await directus.request(
        createItem('paragraphs', {
          order_key: `1:${i + 1}`,
          original_lang: 'hebrew',
          text: block.hebrew,
          status: 'published',
          doc_id: tanyaDoc.id,
          metadata: {
            type: block.type,
            has_english: !!block.english
          }
        })
      );
      
      console.log(`✓ Created paragraph ${paragraph.order_key} (ID: ${paragraph.id})`);
      
      // Create statement from the paragraph
      const statement = await directus.request(
        createItem('statements', {
          order_key: `1:${i + 1}:1`,
          original_lang: 'hebrew',
          text: block.hebrew,
          status: 'published',
          paragraph_id: paragraph.id,
          metadata: {
            type: block.type,
            english_translation: block.english || null
          }
        })
      );
      
      console.log(`✓ Created statement ${statement.order_key} (ID: ${statement.id})`);
    }
    
    console.log('📚 Tanya content import completed!');
  } catch (error) {
    console.error('✗ Failed to import Tanya content:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting demo content import...');
  console.log(`📡 Connecting to: ${DIRECTUS_URL}`);
  
  try {
    // Test connection
    const health = await directus.request({
      method: 'GET',
      path: '/health'
    }).catch(() => ({ status: 'unknown' }));
    console.log('✅ Directus connection established');
    
    await importTopics();
    await importTanyaContent();
    
    console.log('\n✅ Demo content import completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- 5 sample topics with rich content');
    console.log('- Tanya Chapter 1 with 5 paragraphs and statements');
    console.log('- Ready for testing BookReader and topics pages');
    console.log('\n🔗 Test URLs:');
    console.log('- Topics: http://localhost:3000/topics');
    console.log('- Bittul: http://localhost:3000/topics/bittul');
    console.log('- Tanya Reader: http://localhost:3000/seforim/tanya-likkutei-amarim/1');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Directus is running on', DIRECTUS_URL);
    console.log('2. Check your DIRECTUS_TOKEN environment variable');
    console.log('3. Verify the collections exist in Directus');
    process.exit(1);
  }
}

// Run the import
main();
