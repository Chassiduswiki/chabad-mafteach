# Chabad Mafteach - Digital Chassidus Encyclopedia

> A comprehensive research platform for exploring Chassidic concepts with full source citations and interconnected relationships.

**Status**: Beta v1.0 | **Build**: ✅ Passing | **License**: MIT

---

## 🎯 Mission

Chabad Mafteach (Master Index) transforms how people learn Chassidus by creating a searchable, interconnected encyclopedia of Chassidic concepts. Every topic is:
- **Source-backed**: Citations from original seforim
- **Interconnected**: Relationships show how concepts relate
- **Bilingual**: Full Hebrew and English support
- **Accessible**: Works beautifully on all devices

### The Problem
- Concepts scattered across dozens of seforim with no unified index
- No way to see how different sources explain the same idea
- Language barriers between Hebrew, English, Yiddish terminology
- Citations without broader conceptual context

### Our Solution
A living encyclopedia connecting:
- **Concepts** (Topics) - Ahavas Yisroel, Teshuvah, Tefillah, etc.
- **Sources** (Seforim) - Tanya, Likkutei Torah, Sichos, etc.
- **Relationships** - How concepts interconnect and build on each other
- **Search** - Fuzzy search across Hebrew, English, transliteration

---

## ✨ Features

### Current (Beta v1.0)
- **10 Foundational Topics**: Ahavas Yisroel, Teshuvah, Tefillah, Tzedakah, Shabbos, Bittul, Dveikus, Simcha, Kavanah, Avodah SheBalev
- **Search**: Cmd+K command palette with fuzzy search
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
cp .env.production.example .env.local
# Edit .env.local with your Directus URL and token
```

4. **Run development server**
```bash
npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local` with the following variables:

```env
# Directus Backend
NEXT_PUBLIC_DIRECTUS_URL=https://directus-production-20db.up.railway.app
DIRECTUS_URL=https://directus-production-20db.up.railway.app
DIRECTUS_STATIC_TOKEN=your_directus_static_token

# Session Management
JWT_SECRET=your_jwt_secret_here

# AI Services (Optional)
OPENROUTER_API_KEY=your_openrouter_api_key

# App URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Security**: Never commit `.env.local` or `.env.production`. Use `.env.production.example` as a template.

---

## 🔐 Authentication

### User Roles
- **Admin**: Full access to `/admin` dashboard and `/editor`
- **Editor**: Access to `/editor` for content creation
- **Public**: Read-only access to `/topics`, `/seforim`, `/explore`

### How to Log In
1. Go to `/auth/signin`
2. Enter your Directus email and password
3. You'll be redirected to `/editor` (editors) or `/admin` (admins)

**See [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) for complete authentication documentation.**

---

## 📚 Documentation

- **[AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md)** - Complete authentication system documentation
- **[TORAH_READER_DOCUMENTATION.md](TORAH_READER_DOCUMENTATION.md)** - TorahReader component guide
- **[TESTING.md](TESTING.md)** - Testing suite documentation
- **[docs/](docs/)** - Technical documentation (schema, migrations, AI integration)
- **[docs/archive/](docs/archive/)** - Historical planning documents and brainstorms

---

## 🛠️ Development Guidelines

### Package Management Rules

**CRITICAL**: All TipTap packages must maintain the same version to prevent HMR errors.

#### Current Package Versions (Updated: 2026-01-27)
- **TipTap Suite**: 3.17.1 (all @tiptap/* packages)
- **Next.js**: 16.0.10
- **React**: 19.2.0
- **fast-equals**: 5.4.0 (direct dependency)

#### Safe Update Process
```bash
# 1. Check current versions
npm ls @tiptap/react

# 2. Update ALL TipTap packages together
npm install @tiptap/react@X.Y.Z @tiptap/pm@X.Y.Z @tiptap/starter-kit@X.Y.Z @tiptap/extension-character-count@X.Y.Z @tiptap/extension-placeholder@X.Y.Z

# 3. Verify versions match
npm ls @tiptap/react @tiptap/pm @tiptap/starter-kit

# 4. Clear cache and test
rm -rf .next
npm run dev
```

#### Common Issues & Solutions
- **fast-equals HMR Error**: Clear `.next` cache and restart dev server
- **Module Factory Error**: Verify all TipTap packages have same version
- **Dependency Conflicts**: Use `npm ls` to identify and fix conflicts

**See the Development Guidelines section above for complete guidance.**

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

**Current Phase**: Foundation & Security (Jan 23, 2026)  
**Build Status**: ✅ Passing  
**Authentication**: ✅ Implemented with role-based access control  
**Topics**: 131+ in database, content being populated  

### Current Development Phases

#### Phase 1: Foundation & Security (Week 1-2) ✅ IN PROGRESS
- ✅ Authentication & access control (locked editor/admin)
- ✅ Remove sensitive data from git
- ⏳ Update GitHub README (this file)
- ⏳ Test authentication end-to-end

#### Phase 2: User Experience Improvements (Week 3-4)
- [ ] Translations feature visibility
- [ ] Consultation graph centering
- [ ] Topic fields reordering
- [ ] UI/UX cohesion

#### Phase 3: Content & Discovery (Week 5-6)
- [ ] TipTap editor enhancements
- [ ] AI-powered search integration
- [ ] Edit button on topic fields
- [ ] User feedback system

#### Phase 4: Community & Collections (Week 7-8)
- [ ] Public user collections
- [ ] Beautiful collections UI
- [ ] Collaborative annotations

**See [docs/archive/planning/](docs/archive/planning/) for complete historical roadmap.**

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
