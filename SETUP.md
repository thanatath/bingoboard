# Bingo Mobile Game - Setup Guide

## Overview
This is a mobile-first Bingo game built with Nuxt 3, PocketBase, Pinia, and Tailwind CSS. The game supports 120 unique cards, real-time gameplay, questions every 10 draws, and admin controls.

## Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)
- PocketBase (download from https://pocketbase.io/docs/)

## Installation Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Setup PocketBase

#### Download PocketBase
1. Download PocketBase from https://pocketbase.io/docs/
2. Extract the executable to a folder (e.g., `./pb`)

#### Create Collections
You need to create the following collections in PocketBase Admin UI (http://127.0.0.1:8090/_/):

**Collection: `game`**
- status: Select (idle, running, ended) - Required
- startedAt: Date
- endedAt: Date
- currentDrawIndex: Number - Required, Default: 0
- questionEvery: Number - Required, Default: 10
- activeQuestionEventId: Relation (questionEvents)

**Collection: `players`**
- name: Text - Required
- joinedAt: Date - Required
- card: Relation (cards) - Unique
- answersCorrect: Number - Default: 0
- bingoAtDraw: Number

**Collection: `cards`**
- code: Text - Required, Unique
- grid: JSON - Required
- assignedTo: Relation (players)
- assignedAt: Date
- inUse: Bool - Required, Default: false
- marksServer: JSON - Required
- cellsMarked: Number - Required, Default: 1
- linesComplete: Number - Required, Default: 0
- progress: JSON
- lastMarkedAt: Date

**Collection: `draws`**
- drawIndex: Number - Required, Unique
- number: Number - Required
- createdAt: Date - Required

**Collection: `questions`**
- text: Text - Required
- choices: JSON - Required
- correctIndex: Number - Required
- weight: Number - Default: 1
- isActive: Bool - Default: true

**Collection: `questionEvents`**
- drawIndex: Number - Required, Unique
- question: Relation (questions) - Required
- createdAt: Date - Required

**Collection: `questionAnswers`**
- player: Relation (players) - Required
- questionEvent: Relation (questionEvents) - Required
- choiceIndex: Number - Required
- isCorrect: Bool - Required
- awardedFreeAtCell: Number
- answeredAt: Date - Required

**Collection: `winners`**
- player: Relation (players) - Required
- drawIndex: Number - Required
- lines: JSON - Required
- createdAt: Date - Required

#### Set Collection Rules
For simplicity (internal org use), you can set most collections to:
- List/View: Anyone
- Create: Anyone (or Admin only for sensitive collections)
- Update: Admin or Owner
- Delete: Admin only

### 3. Start PocketBase
```bash
cd pb
./pocketbase serve
```

PocketBase will start at http://127.0.0.1:8090

### 4. Configure Environment
Create a `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_PB_URL=http://127.0.0.1:8090
```

### 5. Seed Data
Run the seed script to create initial data (game, 120 cards, questions):

```bash
npx tsx scripts/seed.ts
```

### 6. Start Development Server
```bash
pnpm dev
```

The app will be available at http://localhost:3000

## Usage

### Player Flow
1. Go to http://localhost:3000
2. Click "ผู้เล่น" (Player)
3. Enter your name
4. Select a card from available cards
5. Wait for admin to start the game
6. Mark numbers as they are drawn
7. Answer questions every 10 draws to get FREE cells
8. Win when you complete a line (row, column, or diagonal)

### Admin Flow
1. Go to http://localhost:3000
2. Click "แอดมิน" (Admin)
3. Click "Start Game" to begin
4. Click "Random Number" to draw numbers
5. Monitor all cards, stats, and winners
6. Click "Reset Game" to start over

## Game Rules
- 5×5 Bingo cards with numbers 1-99
- Center cell (index 12) is always FREE
- 120 unique cards available
- Players claim cards first-come-first-served
- Admin draws numbers 1-99 without repetition
- Every 10 draws, a question appears for all players
- Correct answers grant 1 random FREE cell
- Win by completing any line (5 rows + 5 columns + 2 diagonals = 12 possible lines)
- Multiple winners can occur simultaneously
- Game continues after winners are declared

## Project Structure
```
/root/git/bingo/
├── app/
│   └── app.vue              # Main app component
├── pages/
│   ├── index.vue            # Role selection
│   ├── join.vue             # Player registration
│   ├── card.vue             # Card selection
│   ├── play.vue             # Player game screen
│   └── admin.vue            # Admin console
├── components/
│   ├── PlayerCard.vue       # Bingo card display
│   ├── DrawTicker.vue       # Draw history
│   ├── QuestionModal.vue    # Question popup
│   ├── WinnersMarquee.vue   # Winners display
│   ├── AdminStats.vue       # Admin statistics
│   └── AdminCardsPreview.vue # All cards preview
├── stores/
│   ├── game.ts              # Game state management
│   ├── player.ts            # Player state management
│   └── admin.ts             # Admin state management
├── utils/
│   └── bingo.ts             # Bingo logic utilities
├── plugins/
│   └── pb.client.ts         # PocketBase client
└── scripts/
    └── seed.ts              # Database seeding

## Features
- ✅ Mobile-first responsive design
- ✅ Real-time updates with PocketBase
- ✅ Polling fallback (2.5s) for reliability
- ✅ 120 unique bingo cards
- ✅ Question system every 10 draws
- ✅ FREE cell rewards for correct answers
- ✅ Multiple winner support
- ✅ Admin dashboard with full game control
- ✅ Card preview for all 120 cards
- ✅ Statistics and progress tracking
- ✅ Thai language UI with Kanit font

## Troubleshooting

### PocketBase Connection Issues
- Ensure PocketBase is running on port 8090
- Check VITE_PB_URL in .env file
- Verify collections are created correctly

### Cards Not Loading
- Run the seed script: `npx tsx scripts/seed.ts`
- Check PocketBase admin UI for data

### Real-time Not Working
- The app has polling fallback, so it should work even without WebSocket
- Check browser console for errors
- Verify PocketBase is accessible

## Development Notes
- This is a single-room, single-game application
- No authentication/authorization (designed for internal org use)
- Data persists in PocketBase SQLite database
- Use "Reset Game" to clear all data and start fresh

## Production Deployment
1. Build the app: `pnpm build`
2. Deploy PocketBase to a server
3. Update VITE_PB_URL to production PocketBase URL
4. Deploy Nuxt app to hosting (Vercel, Netlify, etc.)
5. Ensure PocketBase is accessible from the deployed app

## License
Internal organizational use only.

