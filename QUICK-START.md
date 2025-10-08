# 🎯 Bingo Game - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Download & Setup PocketBase

#### Windows
1. Download PocketBase: https://pocketbase.io/docs/
2. Extract `pocketbase.exe` to a folder (e.g., `C:\pocketbase\`)
3. Open Command Prompt in that folder
4. Run: `pocketbase.exe serve`

#### Linux/Mac
1. Download PocketBase: https://pocketbase.io/docs/
2. Extract and make executable: `chmod +x pocketbase`
3. Run: `./pocketbase serve`

PocketBase will start at: http://127.0.0.1:8090

### Step 3: Create Admin Account
1. Open http://127.0.0.1:8090/_/
2. Create admin account (first time only)
3. Login to PocketBase Admin UI

### Step 4: Create Collections

**Quick Method:** Import collections manually using the schema below.

For each collection, go to "Collections" → "New collection" → "Import" and use the schema from `pocketbase-schema.json`.

**Or create manually:**

#### Collection: `game`
- Type: Base
- Fields:
  - `status` (Select): idle, running, ended [Required]
  - `startedAt` (Date)
  - `endedAt` (Date)
  - `currentDrawIndex` (Number) [Required, Default: 0]
  - `questionEvery` (Number) [Required, Default: 10]
  - `activeQuestionEventId` (Relation → questionEvents)
- API Rules: List/View = Anyone, Create/Update/Delete = Admin

#### Collection: `players`
- Type: Base
- Fields:
  - `name` (Text) [Required]
  - `joinedAt` (Date) [Required]
  - `card` (Relation → cards)
  - `answersCorrect` (Number) [Default: 0]
  - `bingoAtDraw` (Number)
- API Rules: List/View = Anyone, Create = Anyone, Update/Delete = Admin

#### Collection: `cards`
- Type: Base
- Fields:
  - `code` (Text) [Required, Unique]
  - `grid` (JSON) [Required]
  - `assignedTo` (Relation → players)
  - `assignedAt` (Date)
  - `inUse` (Bool) [Required, Default: false]
  - `marksServer` (JSON) [Required]
  - `cellsMarked` (Number) [Required, Default: 1]
  - `linesComplete` (Number) [Required, Default: 0]
  - `progress` (JSON)
  - `lastMarkedAt` (Date)
- API Rules: List/View = Anyone, Create = Admin, Update = Anyone, Delete = Admin

#### Collection: `draws`
- Type: Base
- Fields:
  - `drawIndex` (Number) [Required, Unique]
  - `number` (Number) [Required]
  - `createdAt` (Date) [Required]
- API Rules: List/View = Anyone, Create/Update/Delete = Admin

#### Collection: `questions`
- Type: Base
- Fields:
  - `text` (Text) [Required]
  - `choices` (JSON) [Required]
  - `correctIndex` (Number) [Required]
  - `weight` (Number) [Default: 1]
  - `isActive` (Bool) [Default: true]
- API Rules: List/View = Anyone, Create/Update/Delete = Admin

#### Collection: `questionEvents`
- Type: Base
- Fields:
  - `drawIndex` (Number) [Required, Unique]
  - `question` (Relation → questions) [Required]
  - `createdAt` (Date) [Required]
- API Rules: List/View = Anyone, Create/Update/Delete = Admin

#### Collection: `questionAnswers`
- Type: Base
- Fields:
  - `player` (Relation → players) [Required]
  - `questionEvent` (Relation → questionEvents) [Required]
  - `choiceIndex` (Number) [Required]
  - `isCorrect` (Bool) [Required]
  - `awardedFreeAtCell` (Number)
  - `answeredAt` (Date) [Required]
- API Rules: List/View = Anyone, Create = Anyone, Update/Delete = Admin

#### Collection: `winners`
- Type: Base
- Fields:
  - `player` (Relation → players) [Required]
  - `drawIndex` (Number) [Required]
  - `lines` (JSON) [Required]
  - `createdAt` (Date) [Required]
- API Rules: List/View = Anyone, Create = Anyone, Update/Delete = Admin

### Step 5: Configure Environment
```bash
# Create .env file
echo "VITE_PB_URL=http://127.0.0.1:8090" > .env
```

### Step 6: Seed Data
```bash
pnpm seed
```

This creates:
- 1 game record
- 120 unique bingo cards
- 20 sample questions

### Step 7: Start Development Server
```bash
pnpm dev
```

Open http://localhost:3000

## 🎮 How to Play

### As Player:
1. Click "ผู้เล่น" (Player)
2. Enter your name
3. Select a card (C001-C120)
4. Wait for admin to start
5. Mark numbers as they appear
6. Answer questions every 10 draws
7. Win by completing a line!

### As Admin:
1. Click "แอดมิน" (Admin)
2. Click "Start Game"
3. Click "Random Number" to draw
4. Monitor all players
5. See winners in real-time
6. Click "Reset Game" to restart

## 📱 Game Rules

- **Card**: 5×5 grid with numbers 1-99
- **FREE**: Center cell is always free
- **Cards**: 120 unique cards available
- **Drawing**: Admin draws 1-99 without repeats
- **Questions**: Every 10 draws (10, 20, 30...)
- **Reward**: Correct answer = 1 random FREE cell
- **Win**: Complete any line (row, column, or diagonal)
- **Multiple Winners**: Allowed! Game continues

## 🔧 Troubleshooting

### PocketBase not starting?
- Check if port 8090 is available
- Try: `pocketbase serve --http=127.0.0.1:8090`

### Seed script fails?
- Make sure PocketBase is running
- Check all collections are created
- Verify API rules allow creation

### Cards not loading?
- Run seed script: `pnpm seed`
- Check PocketBase admin UI for data

### Real-time not working?
- App has polling fallback (2.5s)
- Check browser console for errors
- Verify PocketBase URL in .env

## 📊 Admin Features

- **Start/Stop**: Control game state
- **Random Draw**: Draw numbers 1-99
- **Reset**: Clear all data and restart
- **Stats**: Players, cards, draws, winners
- **Cards View**: See all 120 cards with progress
- **Filter**: Show all or claimed cards only
- **Search**: Find by player name or card code
- **Sort**: By progress (closest to winning)

## 🎨 UI Features

- Mobile-first responsive design
- Thai language (Kanit font)
- Color-coded cells:
  - 🔴 Red = Marked
  - ⚪ Gray = FREE
  - ⬜ White = Normal
- Animated winner marquee
- Real-time updates
- Question modals
- Progress indicators

## 📝 Notes

- This is a single-room game (one game at a time)
- No authentication required (internal org use)
- Data persists in PocketBase SQLite database
- Use "Reset Game" to start fresh

## 🆘 Need Help?

See `SETUP.md` for detailed setup instructions.
See `IMPLEMENTATION-SUMMARY.md` for technical details.

## 🎉 Have Fun!

Enjoy your Bingo game! 🎯🎊

