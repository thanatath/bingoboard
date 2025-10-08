// Bingo utility functions

export interface BingoCard {
  code: string
  grid: (number | string)[] // 25 elements, index 12 = "FREE"
  assignedTo?: string
  assignedAt?: string
  inUse: boolean
  marksServer: boolean[] // 25 elements
  cellsMarked: number
  linesComplete: number
  progress: {
    row: number[]
    col: number[]
    diag: number[]
    linesOneAway: number
    maxLineProgress: number
  }
  lastMarkedAt?: string
}

export interface BingoLine {
  type: 'row' | 'col' | 'diag'
  index: number
  cells: number[]
}

// Generate all 12 possible bingo lines (5 rows, 5 cols, 2 diagonals)
export function getAllBingoLines(): BingoLine[] {
  const lines: BingoLine[] = []

  // 5 rows
  for (let i = 0; i < 5; i++) {
    lines.push({
      type: 'row',
      index: i,
      cells: [i * 5, i * 5 + 1, i * 5 + 2, i * 5 + 3, i * 5 + 4]
    })
  }

  // 5 columns
  for (let i = 0; i < 5; i++) {
    lines.push({
      type: 'col',
      index: i,
      cells: [i, i + 5, i + 10, i + 15, i + 20]
    })
  }

  // 2 diagonals
  lines.push({
    type: 'diag',
    index: 0,
    cells: [0, 6, 12, 18, 24] // top-left to bottom-right
  })

  lines.push({
    type: 'diag',
    index: 1,
    cells: [4, 8, 12, 16, 20] // top-right to bottom-left
  })

  return lines
}

// Check if a line is complete
export function isLineComplete(marks: boolean[], line: BingoLine): boolean {
  return line.cells.every(cell => marks[cell])
}

// Count marked cells in a line
export function countMarkedInLine(marks: boolean[], line: BingoLine): number {
  return line.cells.filter(cell => marks[cell]).length
}

// Calculate bingo progress for a card
export function calculateBingoProgress(marks: boolean[]) {
  const lines = getAllBingoLines()
  const rowProgress: number[] = []
  const colProgress: number[] = []
  const diagProgress: number[] = []
  let linesComplete = 0
  let linesOneAway = 0
  let maxLineProgress = 0

  lines.forEach(line => {
    const markedCount = countMarkedInLine(marks, line)
    maxLineProgress = Math.max(maxLineProgress, markedCount)

    if (markedCount === 5) {
      linesComplete++
    } else if (markedCount === 4) {
      linesOneAway++
    }

    if (line.type === 'row') {
      rowProgress.push(markedCount)
    } else if (line.type === 'col') {
      colProgress.push(markedCount)
    } else if (line.type === 'diag') {
      diagProgress.push(markedCount)
    }
  })

  return {
    row: rowProgress,
    col: colProgress,
    diag: diagProgress,
    linesComplete,
    linesOneAway,
    maxLineProgress
  }
}

// Check if player has won (at least 1 complete line)
export function hasWon(marks: boolean[]): boolean {
  const lines = getAllBingoLines()
  return lines.some(line => isLineComplete(marks, line))
}

// Get all complete lines
export function getCompleteLines(marks: boolean[]): string[] {
  const lines = getAllBingoLines()
  const completeLines: string[] = []

  lines.forEach(line => {
    if (isLineComplete(marks, line)) {
      completeLines.push(`${line.type}${line.index}`)
    }
  })

  return completeLines
}

// Generate a random 5x5 bingo card with numbers 1-99
export function generateBingoCard(code: string): BingoCard {
  const grid: (number | string)[] = []
  const usedNumbers = new Set<number>()

  // Generate 24 random unique numbers (1-99)
  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      grid.push('FREE')
    } else {
      let num: number
      do {
        num = Math.floor(Math.random() * 99) + 1
      } while (usedNumbers.has(num))
      usedNumbers.add(num)
      grid.push(num)
    }
  }

  // Initialize marks with center FREE cell marked
  const marksServer = new Array(25).fill(false)
  marksServer[12] = true

  return {
    code,
    grid,
    inUse: false,
    marksServer,
    cellsMarked: 1,
    linesComplete: 0,
    progress: {
      row: [1, 1, 1, 1, 1],
      col: [1, 1, 1, 1, 1],
      diag: [1, 1],
      linesOneAway: 0,
      maxLineProgress: 1
    }
  }
}

// Generate 120 bingo cards
export function generate120Cards(): BingoCard[] {
  const cards: BingoCard[] = []
  for (let i = 1; i <= 120; i++) {
    const code = `STEL-GoodLuck-${String(i).padStart(3, '0')}`
    cards.push(generateBingoCard(code))
  }
  return cards
}

// Pick a random free cell (not marked and not FREE)
export function pickFreeableCell(grid: (number | string)[], marks: boolean[]): number | null {
  const availableCells: number[] = []

  for (let i = 0; i < 25; i++) {
    if (!marks[i] && grid[i] !== 'FREE') {
      availableCells.push(i)
    }
  }

  if (availableCells.length === 0) return null

  const randomIndex = Math.floor(Math.random() * availableCells.length)
  return availableCells[randomIndex]
}

// Sample a random element from an array
export function sample<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

