# Chabad Mafteach - Chassidic Concepts Research Platform (Frontend)

> A comprehensive digital index connecting Chassidic concepts across all Chabad seforim

**Note**: This repository contains the **frontend application only** (Next.js). The backend CMS (Directus) is hosted separately.

[![Production Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 🎯 Vision

Chabad Mafteach (Master Index) is a research platform designed to make Chassidic wisdom accessible, searchable, and deeply interconnected. Think of it as a "Wikipedia meets Sefaria" for Chabad philosophy.

### The Problem We Solve
- **Scattered Knowledge**: Concepts appear across dozens of seforim with no unified index
- **No Cross-Referencing**: Hard to see how the Alter Rebbe's definition relates to the Rebbe's explanation
- **Language Barriers**: Same concept has different names in Hebrew, English, Yiddish
- **Lost Context**: Citations without understanding the broader conceptual framework

### Our Solution
A living encyclopedia where:
- ✅ Every concept has **multiple source-backed definitions**
- ✅ **Boundaries** clarify what a concept IS and ISN'T
- ✅ **Relationships** show how concepts interconnect
- ✅ **Search** works in Hebrew, English, and transliteration
- ✅ **Citations** link directly to source texts

---

## ✨ Features

### Current (Beta v1.0)
- **10 Foundational Topics**: Ahavas Yisroel, Teshuvah, Tefillah, Tzedakah, Shabbos, Bittul, Dveikus, Simcha, Kavanah, Avodah SheBalev
- **Smart Citations**: Automatically links to books in your library with Sefaria fallback
- **Unified Search**: Single interface finds local documents, existing sources, or external texts
- **Document Association**: Citations are now connected to source documents for better research
- **Multi-Source Definitions**: Each topic has citations from multiple seforim
- **Boundary Framework**: Clear "What it IS" vs "What it's NOT" for each concept
- **Responsive Design**: Works beautifully on desktop and mobile
- **Bilingual**: Full Hebrew and English support

### Coming Soon
- Graph visualization of concept relationships
- 50+ topics covering Kabbalah, Chassidus, Avodah
- Advanced filtering by sefer, difficulty level, time period
- User contributions and annotations
- API access for developers

---

## 🏗️ Architecture

> **Important**: This repository contains only the **frontend application**. The backend (Directus CMS) is maintained separately.

### Tech Stack
- **Frontend** (This Repo): Next.js 16 (React, TypeScript)
- **Backend** (Separate): Directus (Headless CMS)
- **Database** (Backend): PostgreSQL
- **Hosting**: Railway (Frontend) + Directus Cloud (Backend)
- **Styling**: Tailwind CSS with custom "Crown & Earth" theme
- **Data Fetching**: TanStack Query for efficient API management

### Key Design Decisions
- **Separation of Concerns**: Content (Directus) vs Presentation (Next.js)
- **Performance First**: Pagination, code splitting, optimized builds
- **Type Safety**: Full TypeScript coverage
- **Accessibility**: WCAG 2.1 AA compliant
- **Mobile-First**: Responsive design from the ground up

---

## 🚀 Getting Started

> **Note**: This guide covers frontend development only. You'll need access to a Directus backend instance (either the production API or your own local Directus setup).

### Prerequisites
- Node.js 18+ 
- Access to a Directus backend instance (URL and API token)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/Chassiduswiki/chabad-mafteach.git
cd chabad-mafteach
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your Directus URL and token
```

4. **Run development server**
```bash
npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000)

### Environment Variables
```env
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=your_static_token_here
```

---

## 📚 Documentation

- [Citation System User Guide](Documentation/Citation-User-Guide.md) - Complete guide for the enhanced citation system
- [Citation System Enhancement](Documentation/Citation-System-Implementation-Summary.md) - Technical implementation details
- [Citation Integration Guide](Documentation/Citation-Integration-Guide.md) - Developer guide for extending the citation system
- [TorahReader Component Guide](TORAH_READER_DOCUMENTATION.md) - Complete guide for the generalized Torah reading component
- [API Procedures](Documentation/API-Procedure-Documentation.md) - Backend API and hooks reference
- [Deployment Guide](Documentation/implementation_plan.md)
- [Beta Launch Status](Documentation/BETA_LAUNCH_STATUS_DEC2.md)
- [Comprehensive Task List](Documentation/Comprehensive%20Task%20list.md)
- [Design Philosophy](Documentation/Design-guide.md)
- [UX Flow](Documentation/UX%20flow.md)

---

## 🤝 Contributing

We welcome contributions! Whether you're:
- Adding new topics or citations
- Improving translations
- Fixing bugs
- Suggesting features
- Improving documentation

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📊 Project Status

**Current Phase**: Beta Development  
**Topics**: 10 complete, 40+ planned  
**Status**: Production build passing ✅  
**Deployment**: Pending team approval  

### Roadmap

#### Phase 1: Beta Launch (Current)
- ✅ Core 10 topics
- ✅ Enhanced citation system with document association and Sefaria integration
- ✅ Search functionality
- ⏳ Deployment to production

#### Phase 2: Content Expansion (Next 3 months)
- [ ] 50+ topics across Kabbalah, Chassidus, Avodah
- [ ] Advanced search filters
- [ ] Topic relationships visualization
- [ ] User accounts and bookmarking

#### Phase 3: Community Features (6+ months)
- [ ] User-contributed annotations
- [ ] Discussion forums per topic
- [ ] Scholar verification system
- [ ] API for third-party apps

---

## 🎓 Educational Mission

This project serves:
- **Yeshiva Students**: Quick concept lookups during learning
- **Researchers**: Cross-reference concepts across seforim
- **Teachers**: Prepare shiurim with comprehensive source material
- **Curious Minds**: Explore Chassidic philosophy at their own pace

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with guidance from Chassidic scholars and educators
- Inspired by Sefaria's vision of accessible Jewish texts
- Designed following principles from "Crown & Earth" design philosophy
- Community feedback from beta testers

---

## 📞 Contact

- **Project Lead**: Chassiduswiki Team
- **Issues**: [GitHub Issues](https://github.com/Chassiduswiki/chabad-mafteach/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Chassiduswiki/chabad-mafteach/discussions)

---

## 🌟 Star Us!

If this project helps your learning or research, consider giving it a star ⭐ on GitHub!

---

**Built with ❤️ for the Chabad community**
