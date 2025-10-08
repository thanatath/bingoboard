# 🎯 Bingo Mobile Game

A mobile-first, real-time Bingo game built with Nuxt 3, PocketBase, Pinia, and Tailwind CSS. Designed for internal organizational events with support for 120 unique cards, live gameplay, and admin controls.

## ✨ Features

- 🎮 **120 Unique Bingo Cards** - Pre-generated 5×5 cards with numbers 1-99
- 📱 **Mobile-First Design** - Optimized for mobile devices with responsive UI
- ⚡ **Real-time Updates** - Live game state using PocketBase Realtime (WebSocket)
- 🎯 **Question System** - Interactive questions every 10 draws with FREE cell rewards
- 🏆 **Multiple Winners** - Support for simultaneous winners with live announcements
- 👨‍💼 **Admin Dashboard** - Complete game control with statistics and card monitoring
- 🇹🇭 **Thai Language** - Full Thai UI with Kanit font
- 🔄 **Anti-Cheat** - Server-side validation to prevent marking undrawn numbers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- PocketBase ([Download](https://pocketbase.io/docs/))

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd bingo
   pnpm install
   ```

2. **Setup PocketBase**
   - Download PocketBase from https://pocketbase.io/docs/
   - Extract and run: `./pocketbase serve`
   - Access admin UI: http://127.0.0.1:8090/_/
   - Create collections (see [QUICK-START.md](./QUICK-START.md))

3. **Configure environment**
   ```bash
   echo "VITE_PB_URL=http://127.0.0.1:8090" > .env
   ```

4. **Seed initial data**
   ```bash
   pnpm seed
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Open in browser**
   - Navigate to http://localhost:3000
   - Choose Player or Admin role

## 📖 Documentation

- **[QUICK-START.md](./QUICK-START.md)** - 5-minute setup guide with step-by-step instructions
- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for static hosting
- **[README-bingo-mobile.md](./README-bingo-mobile.md)** - Complete game specification and architecture

## 🎮 How to Play

### As a Player
1. Enter your name on the join page
2. Select a card from 120 available cards
3. Wait for admin to start the game
4. Mark numbers as they are drawn
5. Answer questions every 10 draws to earn FREE cells
6. Complete a line (row, column, or diagonal) to win!

### As an Admin
1. Access the admin dashboard
2. Click "Start Game" to begin
3. Click "Random Number" to draw numbers
4. Monitor all players and cards in real-time
5. View statistics and winners
6. Click "Reset Game" to start a new round

## 🏗️ Tech Stack

- **Frontend**: Nuxt 3 (SPA mode), Vue 3, TypeScript
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Backend**: PocketBase (SQLite)
- **Real-time**: PocketBase Realtime (WebSocket)
- **Font**: Kanit (Google Fonts)

## 📁 Project Structure

```
bingo/
├── pages/              # Nuxt pages (routes)
│   ├── index.vue       # Role selection
│   ├── join.vue        # Player registration
│   ├── card.vue        # Card selection
│   ├── play.vue        # Player game screen
│   └── admin.vue       # Admin dashboard
├── components/         # Vue components
│   ├── PlayerCard.vue
│   ├── DrawTicker.vue
│   ├── QuestionModal.vue
│   ├── WinnersMarquee.vue
│   ├── AdminStats.vue
│   ├── AdminCardsManager.vue
│   ├── AdminCardsPreview.vue
│   └── AdminQuestionsManager.vue
├── stores/            # Pinia stores
│   ├── game.ts        # Game state
│   ├── player.ts      # Player state
│   └── admin.ts       # Admin state
├── utils/             # Utilities
│   └── bingo.ts       # Bingo game logic
├── plugins/           # Nuxt plugins
│   └── pb.client.ts   # PocketBase client
└── scripts/           # Scripts
    └── seed.ts        # Database seeding
```

## 🎯 Game Rules

- **Card Format**: 5×5 grid with numbers 1-99
- **FREE Cell**: Center cell (index 12) is always FREE
- **Total Cards**: 120 unique cards available
- **Card Assignment**: First-come-first-served, no duplicates
- **Drawing**: Admin draws numbers 1-99 without repetition
- **Questions**: Appear every 10 draws (10, 20, 30, ...)
- **Rewards**: Correct answer = 1 random FREE cell
- **Winning**: Complete any line (5 rows + 5 columns + 2 diagonals = 12 lines)
- **Multiple Winners**: Allowed, game continues after winners

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build static site for production
pnpm build
# Output: .output/public/

# Preview production build
pnpm preview

# Seed database
pnpm seed
```

## 📦 Static Build & Deployment

This project is configured to generate a **static website** that can be deployed to any static hosting service.

### Build Process

```bash
# Generate static files
pnpm build
```

The static files will be generated in `.output/public/` directory.

### Deployment Options

#### 1. **Netlify**
- Connect your GitHub repository
- Build command: `pnpm build`
- Publish directory: `.output/public`
- Add environment variable: `VITE_PB_URL=<your-pocketbase-url>`

#### 2. **Vercel**
- Connect your GitHub repository
- Framework preset: Nuxt.js
- Build command: `pnpm build`
- Output directory: `.output/public`
- Add environment variable: `VITE_PB_URL=<your-pocketbase-url>`

#### 3. **GitHub Pages**
```bash
# Build static files
pnpm build

# Deploy .output/public/ to gh-pages branch
```

#### 4. **Any Static Host**
Simply upload the contents of `.output/public/` to your web server.

### Important Notes

- **PocketBase URL**: Make sure to set `VITE_PB_URL` environment variable to your production PocketBase URL
- **CORS**: Configure PocketBase to allow requests from your deployed domain
- **Database**: Deploy PocketBase separately (VPS, cloud server, etc.)
- **Real-time**: Ensure WebSocket connections are allowed through your hosting/firewall

## 🔧 Configuration

### Environment Variables
```env
VITE_PB_URL=http://127.0.0.1:8090  # PocketBase URL
```

### PocketBase Collections
The game uses 8 collections:
- `game` - Game state
- `players` - Player records
- `cards` - Bingo cards
- `draws` - Draw history
- `questions` - Question bank
- `questionEvents` - Question triggers
- `questionAnswers` - Player answers
- `winners` - Winner records

See [QUICK-START.md](./QUICK-START.md) for collection schemas.

## 📝 License

Internal organizational use only.

## 🤝 Contributing

This is an internal project. For questions or issues, contact the development team.

---

**Made with ❤️ for internal events**
