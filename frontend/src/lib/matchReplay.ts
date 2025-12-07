import {
  Square,
  Piece,
  PieceType,
  PieceColor,
  SquareToPieceMap,
  Color,
} from '../ChessBoard/types'

// --- Types ---

export interface ParsedMove {
  from_sq: Square
  to_sq: Square
  piece: Piece
  promotion: PieceType | null
  captured_piece: Piece | null
  en_passant: boolean
}

// --- Constants & Helpers ---

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

function isSquare(s: string): s is Square {
  return /^[a-h][1-8]$/.test(s)
}

function getSquare(fileIdx: number, rankIdx: number): Square | null {
  if (fileIdx < 0 || fileIdx > 7 || rankIdx < 0 || rankIdx > 7) return null
  return (FILES[fileIdx] + RANKS[rankIdx]) as Square
}

function getCoords(sq: Square): [number, number] {
  const file = FILES.indexOf(sq[0] as any)
  const rank = RANKS.indexOf(sq[1] as any)
  return [file, rank]
}

function getPieceType(piece: Piece): PieceType {
  return piece[1] as PieceType
}

function getPieceColor(piece: Piece): PieceColor {
  return piece[0] as PieceColor
}

function isColor(piece: Piece, color: PieceColor): boolean {
  return piece.startsWith(color)
}

// --- Board Logic ---

function getPieceAt(board: SquareToPieceMap, sq: Square): Piece | undefined {
  return board[sq]
}

// Helper to make a move on a temporary board to check legality (pins)
export function makeMoveTemp(
  board: SquareToPieceMap,
  from: Square,
  to: Square
): SquareToPieceMap {
  const newBoard = { ...board }
  const piece = newBoard[from]
  delete newBoard[from]
  newBoard[to] = piece
  return newBoard
}

function findKing(board: SquareToPieceMap, color: PieceColor): Square | null {
  const kingPiece = (color + 'K') as Piece
  for (const sq in board) {
    if (board[sq as Square] === kingPiece) {
      return sq as Square
    }
  }
  return null
}

// Check if a square is attacked by the opponent
function isSquareAttacked(
  board: SquareToPieceMap,
  targetSq: Square,
  attackerColor: PieceColor
): boolean {
  // Iterate all opponent pieces and see if they can attack targetSq
  // This is expensive but necessary for full correctness.
  // Optimization: Trace rays from targetSq and see if we hit a sliding piece of relevant type,
  // and check knight/pawn/king jumps.

  const [tf, tr] = getCoords(targetSq)

  // 1. Knight attacks
  const knightMoves = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ]
  for (const [df, dr] of knightMoves) {
    const sq = getSquare(tf + df, tr + dr)
    if (sq) {
      const p = getPieceAt(board, sq)
      if (p && isColor(p, attackerColor) && getPieceType(p) === 'N') return true
    }
  }

  // 2. Pawn attacks
  // Attacker is 'w' -> attacks 'up' (rank + 1). Wait, if I'm checking if *target* is attacked by White,
  // White pawns must be on rank-1.
  // const _pawnDir = attackerColor === 'w' ? -1 : 1 // If attacker is white, they are below? No, white moves up (rank increasing).
  // White pawns at (f, r-1) attack (f+/-1, r).
  // Wait, standard board: White is ranks 1-2. White attacks rank+1.
  // If target is at rank R. White pawn must be at R-1.
  // So direction from Target to Attacker is -1 for White.

  // Let's stick to: "Where can a pawn be to attack Target?"
  // If Attacker is White, they attack from (rank-1).
  const attackRank = tr + (attackerColor === 'w' ? -1 : 1)
  for (const df of [-1, 1]) {
    const sq = getSquare(tf + df, attackRank)
    if (sq) {
      const p = getPieceAt(board, sq)
      if (p && isColor(p, attackerColor) && getPieceType(p) === 'P') return true
    }
  }

  // 3. King attacks (adjacent)
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue
      const sq = getSquare(tf + df, tr + dr)
      if (sq) {
        const p = getPieceAt(board, sq)
        if (p && isColor(p, attackerColor) && getPieceType(p) === 'K')
          return true
      }
    }
  }

  // 4. Sliding pieces (Rook, Bishop, Queen)
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0], // Rook
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1], // Bishop
  ]

  for (let i = 0; i < dirs.length; i++) {
    const [df, dr] = dirs[i]
    const isDiagonal = i >= 4
    let cf = tf + df
    let cr = tr + dr

    while (true) {
      const sq = getSquare(cf, cr)
      if (!sq) break

      const p = getPieceAt(board, sq)
      if (p) {
        if (isColor(p, attackerColor)) {
          const type = getPieceType(p)
          if (type === 'Q') return true
          if (isDiagonal && type === 'B') return true
          if (!isDiagonal && type === 'R') return true
        }
        break // Blocked by any piece
      }

      cf += df
      cr += dr
    }
  }

  return false
}

function isInCheck(board: SquareToPieceMap, color: PieceColor): boolean {
  const kingSq = findKing(board, color)
  if (!kingSq) return false // Should not happen in valid game
  const opponentColor = color === 'w' ? 'b' : 'w'
  return isSquareAttacked(board, kingSq, opponentColor)
}

// --- Move Generation ---

// Check if a move is pseudo-legal (geometry + occupancy, ignoring check)
function canPieceMoveTo(
  board: SquareToPieceMap,
  from: Square,
  to: Square,
  piece: Piece
): boolean {
  const [ff, fr] = getCoords(from)
  const [tf, tr] = getCoords(to)
  const df = tf - ff
  const dr = tr - fr
  const type = getPieceType(piece)
  const color = getPieceColor(piece)
  const targetPiece = getPieceAt(board, to)

  // Cannot capture own piece
  if (targetPiece && isColor(targetPiece, color)) return false

  if (type === 'N') {
    return (
      (Math.abs(df) === 2 && Math.abs(dr) === 1) ||
      (Math.abs(df) === 1 && Math.abs(dr) === 2)
    )
  }

  if (type === 'B') {
    if (Math.abs(df) !== Math.abs(dr)) return false
    return isPathClear(board, ff, fr, tf, tr)
  }

  if (type === 'R') {
    if (df !== 0 && dr !== 0) return false
    return isPathClear(board, ff, fr, tf, tr)
  }

  if (type === 'Q') {
    if (df !== 0 && dr !== 0 && Math.abs(df) !== Math.abs(dr)) return false
    return isPathClear(board, ff, fr, tf, tr)
  }

  if (type === 'K') {
    // Normal move
    if (Math.abs(df) <= 1 && Math.abs(dr) <= 1) return true
    // Castling is handled separately in SAN parser or specific logic,
    // but here we are checking if a piece *can* move to a square.
    // For SAN disambiguation, we usually don't disambiguate King moves (only one King).
    return false
  }

  if (type === 'P') {
    const forward = color === 'w' ? 1 : -1
    // Move forward 1
    if (df === 0 && dr === forward) {
      return !targetPiece // Must be empty
    }
    // Move forward 2
    if (df === 0 && dr === forward * 2) {
      const startRank = color === 'w' ? 1 : 6 // 0-indexed: 1 is rank 2
      if (fr !== startRank) return false
      const midSq = getSquare(ff, fr + forward)
      return (!targetPiece && midSq && !getPieceAt(board, midSq)) || true
    }
    // Capture
    if (Math.abs(df) === 1 && dr === forward) {
      // Must be capture OR en passant (handled by caller context usually, but here we check basic geometry)
      // If target is empty, it's only valid if it's en passant.
      // But this function `canPieceMoveTo` is used to find candidates.
      // If target is empty, it's valid ONLY if it's en passant.
      // We'll assume the caller handles en passant check or we pass it in.
      // For simplicity, if it's a diagonal pawn move to an empty square, we allow it ONLY if it matches en passant logic.
      // But wait, `canPieceMoveTo` is generic.
      // Let's just say: if target is occupied by enemy, yes.
      if (targetPiece && !isColor(targetPiece, color)) return true
      // If empty, we return false here, and handle en-passant specifically in the candidate search.
      return false
    }
    return false
  }

  return false
}

function isPathClear(
  board: SquareToPieceMap,
  ff: number,
  fr: number,
  tf: number,
  tr: number
): boolean {
  const df = Math.sign(tf - ff)
  const dr = Math.sign(tr - fr)
  let cf = ff + df
  let cr = fr + dr
  while (cf !== tf || cr !== tr) {
    if (getPieceAt(board, getSquare(cf, cr)!)) return false
    cf += df
    cr += dr
  }
  return true
}

// --- Main Parsing Logic ---

export function parseSan(
  san: string,
  board: SquareToPieceMap,
  turn: PieceColor,
  enPassantTarget: Square | null = null
) {
  // 1. Handle Castling
  if (san === 'O-O' || san === 'O-O-O') {
    const rank = turn === 'w' ? '1' : '8'
    const fromSq = ('e' + rank) as Square
    const toSq = (san === 'O-O' ? 'g' + rank : 'c' + rank) as Square
    const piece = (turn + 'K') as Piece
    return {
      from_sq: fromSq,
      to_sq: toSq,
      piece,
      promotion: null,
      captured_piece: null,
      en_passant: false,
    }
  }

  // 2. Parse SAN string
  // Regex:
  // ^([NBRQK])?       -> Piece type (optional, default P)
  // ([a-h])?([1-8])?  -> Disambiguation (file/rank)
  // (x)?              -> Capture (optional)
  // ([a-h][1-8])      -> Target square
  // (=([NBRQ]))?      -> Promotion
  // (\+|#)?$          -> Check/Mate

  // Note: This regex is tricky because disambiguation can be file, rank, or both.
  // And "bxc3" (Pawn capture) looks like Disambiguation 'b' + Capture 'x' + Target 'c3'.
  // "Nbd7" -> Piece N, Disambig b, Target d7.

  // Let's simplify.
  // Strip check/mate
  const cleanSan = san.replace(/[+#]$/, '')

  // Check promotion
  let promotion: PieceType | null = null
  let baseSan = cleanSan
  if (cleanSan.includes('=')) {
    const parts = cleanSan.split('=')
    baseSan = parts[0]
    promotion = parts[1] as PieceType
  }

  // Target square is always the last 2 chars of the base part
  const targetSq = baseSan.slice(-2) as Square
  if (!isSquare(targetSq)) {
    throw new Error(`Invalid target square in SAN: ${san}`)
  }

  // The rest is the prefix
  const prefix = baseSan.slice(0, -2)

  let pieceType: PieceType = 'P'
  let disambiguation = ''
  // let isCapture = false

  if (prefix.length > 0) {
    let current = prefix

    // Check for piece type
    const firstChar = current[0]
    if (['N', 'B', 'R', 'Q', 'K'].includes(firstChar)) {
      pieceType = firstChar as PieceType
      current = current.slice(1)
    }

    // Check for capture 'x'
    if (current.endsWith('x')) {
      // isCapture = true
      current = current.slice(0, -1)
    }

    // Remaining is disambiguation
    disambiguation = current
  } else {
    // Pawn move e.g. "e4"
    pieceType = 'P'
  }

  // Special case: Pawn captures like "exd5"
  // Prefix "ex". Piece P (implicit). 'x' capture. 'e' disambiguation.
  // My logic above:
  // prefix "ex". firstChar 'e' (not piece).
  // endsWith 'x' -> isCapture=true. current="e".
  // disambiguation="e". Correct.

  // 3. Find candidate moves
  const candidates: Square[] = []
  const pieceToFind = (turn + pieceType) as Piece

  // Iterate all squares to find pieces of type `pieceToFind`
  for (const sqKey in board) {
    const sq = sqKey as Square
    const p = board[sq]
    if (p === pieceToFind) {
      // Check if this piece can move to targetSq
      let canMove = false

      // Special handling for Pawn En Passant in `canPieceMoveTo`
      // We need to pass enPassant info or handle it here.
      // Let's handle it here.
      if (pieceType === 'P') {
        const [ff, fr] = getCoords(sq)
        const [tf, tr] = getCoords(targetSq)
        const df = Math.abs(tf - ff)
        const dr = tr - fr
        const forward = turn === 'w' ? 1 : -1

        if (df === 0) {
          // Push
          if (dr === forward) canMove = !getPieceAt(board, targetSq)
          else if (dr === forward * 2) {
            const startRank = turn === 'w' ? 1 : 6
            const midSq = getSquare(ff, fr + forward)
            canMove =
              fr === startRank &&
              !getPieceAt(board, targetSq) &&
              (!midSq || !getPieceAt(board, midSq))
          }
        } else if (df === 1 && dr === forward) {
          // Capture
          const targetP = getPieceAt(board, targetSq)
          if (targetP && !isColor(targetP, turn)) {
            canMove = true
          } else if (targetSq === enPassantTarget) {
            canMove = true // En Passant
          }
        }
      } else {
        canMove = canPieceMoveTo(board, sq, targetSq, pieceToFind)
      }

      if (canMove) {
        // Check Disambiguation
        if (disambiguation) {
          const [f, r] = getCoords(sq)
          const fileChar = FILES[f]
          const rankChar = RANKS[r]

          // Disambiguation can be file ('a'), rank ('1'), or both ('a1')
          // If disambiguation is 'e', it matches file 'e'.
          // If '1', matches rank '1'.
          // If 'e1', matches both.

          let matches = true
          if (disambiguation.length === 1) {
            if (FILES.includes(disambiguation as any)) {
              if (fileChar !== disambiguation) matches = false
            } else {
              if (rankChar !== disambiguation) matches = false
            }
          } else if (disambiguation.length === 2) {
            if (
              fileChar !== disambiguation[0] ||
              rankChar !== disambiguation[1]
            )
              matches = false
          }

          if (!matches) continue
        }

        // Check Legality (Does it put King in check?)
        // We must simulate the move.
        // Note: For En Passant, the captured piece is not on targetSq, but on [tf, fr].
        // We need to handle that for correct simulation.
        let tempBoard = { ...board }
        delete tempBoard[sq]
        tempBoard[targetSq] = pieceToFind

        if (
          pieceType === 'P' &&
          targetSq === enPassantTarget &&
          Math.abs(getCoords(sq)[0] - getCoords(targetSq)[0]) === 1
        ) {
          // Remove en passant captured pawn
          const capturedSq = getSquare(getCoords(targetSq)[0], getCoords(sq)[1]) // Same file as target, same rank as start
          if (capturedSq) delete tempBoard[capturedSq]
        }

        if (!isInCheck(tempBoard, turn)) {
          candidates.push(sq)
        }
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error(`No legal move found for SAN: ${san}`)
  }
  if (candidates.length > 1) {
    throw new Error(
      `Ambiguous SAN: ${san}. Candidates: ${candidates.join(', ')}`
    )
  }

  const fromSq = candidates[0]
  let capturedPiece = getPieceAt(board, targetSq) || null
  let isEnPassant = false

  // Determine En Passant capture
  if (
    pieceType === 'P' &&
    targetSq === enPassantTarget &&
    !capturedPiece &&
    Math.abs(getCoords(fromSq)[0] - getCoords(targetSq)[0]) === 1
  ) {
    isEnPassant = true
    // The captured piece is the pawn "behind" the target square (from the perspective of the moving pawn)
    // Actually, it's the pawn adjacent to the start square.
    const capturedSq = getSquare(getCoords(targetSq)[0], getCoords(fromSq)[1])
    if (capturedSq) capturedPiece = getPieceAt(board, capturedSq) || null
  }

  return {
    from_sq: fromSq,
    to_sq: targetSq,
    piece: pieceToFind,
    promotion: promotion,
    captured_piece: capturedPiece,
    en_passant: isEnPassant,
  }
}

// --- Main Parsing Logic ---
type ReplayStateResult = {
  position: SquareToPieceMap
  kingInCheck: string
  player_turn: 'w' | 'b'
}

const setSquare = (b: SquareToPieceMap, sq: Square, piece?: Piece) => {
  if (piece === undefined) {
    delete b[sq]
  } else {
    b[sq] = piece
  }
}

const bishopDirs = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

const rookDirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const queenDirs = [...bishopDirs, ...rookDirs]

function applySlidingSanMove(
  san: string,
  board: SquareToPieceMap,
  turn: Color,
  pieceLetter: 'B' | 'R' | 'Q'
): SquareToPieceMap {
  const newBoard = { ...board }
  const piece = (turn + pieceLetter) as Piece

  // Remove B,R,Q,x,+,# to isolate target square
  const cleaned = san.replace(/[BRQx+#]/g, '')
  const target = cleaned.slice(-2) as Square

  const targetCoords = toCoords(target)

  // Disambiguation
  let fileHint: string | null = null
  let rankHint: string | null = null

  // e.g. R1e2 or Be2 (no capture)
  if (san.length >= 3 && !san.includes('x')) {
    const hint = san[1]
    if (/[a-h]/.test(hint)) fileHint = hint
    if (/[1-8]/.test(hint)) rankHint = hint
  }

  let dirs: number[][]
  if (pieceLetter === 'B') dirs = bishopDirs
  else if (pieceLetter === 'R') dirs = rookDirs
  else dirs = queenDirs

  let origin: Square | null = null

  for (const [df, dr] of dirs) {
    let f = targetCoords.file
    let r = targetCoords.rank

    while (true) {
      f -= df
      r -= dr
      const sq = fromCoords(f, r)
      if (!sq) break

      // Hit another piece too early
      if (board[sq] && board[sq] !== piece) break

      // Found the piece
      if (board[sq] === piece) {
        // Apply disambiguation
        if (fileHint && sq[0] !== fileHint) continue
        if (rankHint && sq[1] !== rankHint) continue
        origin = sq
        break
      }
    }

    if (origin) break
  }

  if (!origin) {
    console.warn(`No ${pieceLetter} found for SAN: ${san}`)
    return board
  }

  // Move
  delete newBoard[origin]
  newBoard[target] = piece
  return newBoard
}

function applyKingSanMove(
  san: string,
  board: SquareToPieceMap,
  turn: Color
): SquareToPieceMap {
  const newBoard = { ...board }
  const king = (turn + 'K') as Piece

  // Remove K,x,+,# to get target
  const cleaned = san.replace(/[Kx+#]/g, '')
  const target = cleaned.slice(-2) as Square

  // Search 8 possible king squares
  const { file, rank } = toCoords(target)

  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue

      const sq = fromCoords(file + df, rank + dr)
      if (!sq) continue

      if (board[sq] === king) {
        delete newBoard[sq]
        newBoard[target] = king
        return newBoard
      }
    }
  }

  console.warn('No king move found:', san)
  return board
}

export function parseSan2(
  san: string,
  board: SquareToPieceMap,
  turn: Color
): ReplayStateResult {
  let kingInCheck = ''
  const nextTurn: Color = turn === 'w' ? 'b' : 'w'

  const cloneBoard = (b: SquareToPieceMap): SquareToPieceMap => ({ ...b })

  const newBoard = cloneBoard(board)

  // ----- CASTLING -----
  if (san === 'O-O' || san === 'O-O-O') {
    const rank = turn === 'w' ? '1' : '8'
    const kingFrom = `e${rank}` as Square
    const kingTo =
      san === 'O-O' ? (`g${rank}` as Square) : (`c${rank}` as Square)
    const rookFrom =
      san === 'O-O' ? (`h${rank}` as Square) : (`a${rank}` as Square)
    const rookTo =
      san === 'O-O' ? (`f${rank}` as Square) : (`d${rank}` as Square)
    const kingPiece = (turn + 'K') as Piece
    // deduce rook piece from board if present, fallback to turn + 'R'
    const rookPiece = (turn + 'R') as Piece
    // // validate that the king exists on the expected square (optional)
    // if (newBoard[kingFrom] !== kingPiece) {
    //   // king not where we expect — we still attempt the update but warn
    //   // you may want to throw or return unchanged board depending on your app
    //   // console.warn(`Expected ${kingPiece} on ${kingFrom} but found ${newBoard[kingFrom]}`);
    // }

    delete newBoard[kingFrom]
    delete newBoard[rookFrom]
    newBoard[kingTo] = kingPiece
    newBoard[rookTo] = rookPiece

    // perform moves
    // setSquare(newBoard, kingFrom, undefined) // remove king from original
    // setSquare(newBoard, rookFrom, undefined) // remove rook from original
    // setSquare(newBoard, kingTo, kingPiece) // place king at destination
    // setSquare(newBoard, rookTo, rookPiece) // place rook at destination

    // NOTE: real logic should also:
    // - verify path is clear,
    // - verify king and rook haven't moved,
    // - verify king is not in check and doesn't pass through check.
    //
    // Those checks belong in move validation code, not here.

    // TODO: compute actual kingInCheck using your attack-generation / check-detection
    kingInCheck = '' // placeholder
    return {
      position: newBoard,
      kingInCheck,
      player_turn: nextTurn,
    }
  }

  // ----- NORMAL PAWN MOVE -----
  if (/^[a-h][1-8]$/.test(san)) {
    const updatedBoard = applyPawnSanMove(san, newBoard, turn)
    return {
      position: updatedBoard,
      kingInCheck,
      player_turn: nextTurn,
    }
  }

  if (san.startsWith('N')) {
    return {
      position: applyKnightSanMove(san, board, turn),
      kingInCheck: '',
      player_turn: turn === 'w' ? 'b' : 'w',
    }
  }
  // Bishop
  if (san.startsWith('B')) {
    return {
      position: applySlidingSanMove(san, newBoard, turn, 'B'),
      kingInCheck,
      player_turn: nextTurn,
    }
  }

  // Rook
  if (san.startsWith('R')) {
    return {
      position: applySlidingSanMove(san, newBoard, turn, 'R'),
      kingInCheck,
      player_turn: nextTurn,
    }
  }

  // Queen
  if (san.startsWith('Q')) {
    return {
      position: applySlidingSanMove(san, newBoard, turn, 'Q'),
      kingInCheck,
      player_turn: nextTurn,
    }
  }

  // King (non-castling)
  if (san.startsWith('K')) {
    return {
      position: applyKingSanMove(san, newBoard, turn),
      kingInCheck,
      player_turn: nextTurn,
    }
  }

  // ----- NORMAL PIECE MOVE -----

  return {
    position: newBoard,
    kingInCheck,
    player_turn: nextTurn,
  }
}

function applyPawnSanMove(
  san: string,
  board: SquareToPieceMap,
  turn: Color
): SquareToPieceMap {
  // SAN like "e4"
  const target = san as Square
  const file = target[0] // "e"
  const rank = Number(target[1]) // 4

  const newBoard: SquareToPieceMap = { ...board }
  const pawn = (turn + 'P') as Piece

  // Find origin rank (white moves up, black moves down)
  let origin: Square | null = null

  if (turn === 'w') {
    const oneStep = `${file}${rank - 1}` as Square // e3
    const twoStep = `${file}${rank - 2}` as Square // e2

    if (board[oneStep] === pawn) {
      origin = oneStep
    } else if (rank === 4 && board[twoStep] === pawn) {
      origin = twoStep
    }
  } else {
    const oneStep = `${file}${rank + 1}` as Square // e6
    const twoStep = `${file}${rank + 2}` as Square // e7

    if (board[oneStep] === pawn) {
      origin = oneStep
    } else if (rank === 5 && board[twoStep] === pawn) {
      origin = twoStep
    }
  }

  if (!origin) {
    console.warn(`No pawn found to move to ${san}`)
    return board
  }

  // Perform the move
  delete newBoard[origin]
  newBoard[target] = pawn

  return newBoard
}

const knightOffsets = [
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
]

// Convert file/rank to numeric (a1 → 1,1)
function toCoords(square: Square) {
  return {
    file: square.charCodeAt(0) - 96, // 'a' -> 1
    rank: Number(square[1]), // '1' -> 1
  }
}

// Convert numeric coords back to square
function fromCoords(file: number, rank: number): Square | null {
  if (file < 1 || file > 8 || rank < 1 || rank > 8) return null
  return `${String.fromCharCode(96 + file)}${rank}` as Square
}

function applyKnightSanMove(
  san: string,
  board: SquareToPieceMap,
  turn: Color
): SquareToPieceMap {
  const newBoard = { ...board }
  const knight = (turn + 'N') as Piece

  // Remove N, x, +, # from SAN to get target square
  const cleaned = san.replace(/[N|x|+|#]/g, '')
  const target = cleaned.slice(-2) as Square
  const targetCoords = toCoords(target)

  // Optional disambiguation (e.g., "Nbd2" or "N1c3")
  let fileHint: string | null = null
  let rankHint: string | null = null

  if (san.length === 4 && san[1] !== 'x') {
    // e.g. Nbd2 (file hint)
    if (/[a-h]/.test(san[1])) fileHint = san[1]
    if (/[1-8]/.test(san[1])) rankHint = san[1]
  }

  let origin: Square | null = null

  for (const [df, dr] of knightOffsets) {
    const f = targetCoords.file + df
    const r = targetCoords.rank + dr
    const from = fromCoords(f, r)
    if (!from) continue

    const piece = board[from]
    if (piece !== knight) continue

    // Check disambiguation rules
    if (fileHint && from[0] !== fileHint) continue
    if (rankHint && from[1] !== rankHint) continue

    origin = from
    break
  }

  if (!origin) {
    console.warn('No knight found for SAN:', san)
    return board
  }

  // Apply move
  delete newBoard[origin]
  newBoard[target] = knight

  return newBoard
}
