import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';

// ── Types ──────────────────────────────────────────────
export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export interface ShipDef {
  id: string;
  name: string;
  emoji: string;
  size: number;
}

export interface PlacedShip extends ShipDef {
  cells: [number, number][];
  sunk: boolean;
}

export interface Attack {
  row: number;
  col: number;
  result: 'hit' | 'miss' | 'sunk';
  shipId?: string;
}

export interface PlayerData {
  uid: string;
  name: string;
  ships: PlacedShip[];
  ready: boolean;
}

export interface BattleshipGame {
  roomCode: string;
  status: 'waiting' | 'setup' | 'playing' | 'gameover';
  player1: PlayerData;
  player2: PlayerData | null;
  attacksP1: Attack[]; // attacks player 1 made on player 2's board
  attacksP2: Attack[]; // attacks player 2 made on player 1's board
  currentTurn: 1 | 2;
  winner: 1 | 2 | null;
  createdAt: number;
}

// ── Constants ──────────────────────────────────────────
export const GRID_SIZE = 8;
export const SHIP_DEFS: ShipDef[] = [
  { id: 'carrier', name: 'Portaaviones', emoji: '🚢', size: 4 },
  { id: 'battleship', name: 'Acorazado', emoji: '⛵', size: 3 },
  { id: 'submarine', name: 'Submarino', emoji: '🤿', size: 3 },
  { id: 'destroyer', name: 'Destructor', emoji: '🛥️', size: 2 },
];

const COLLECTION = 'battleship_games';

// ── Room code generation ───────────────────────────────
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Create a new game room ─────────────────────────────
export async function createRoom(uid: string, name: string): Promise<string> {
  // Generate a unique room code
  let roomCode = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await getDoc(doc(db, COLLECTION, roomCode));
    if (!existing.exists()) break;
    roomCode = generateRoomCode();
    attempts++;
  }

  const game: BattleshipGame = {
    roomCode,
    status: 'waiting',
    player1: {
      uid,
      name,
      ships: [],
      ready: false,
    },
    player2: null,
    attacksP1: [],
    attacksP2: [],
    currentTurn: 1,
    winner: null,
    createdAt: Date.now(),
  };

  await setDoc(doc(db, COLLECTION, roomCode), game);
  return roomCode;
}

// ── Join an existing room ──────────────────────────────
export async function joinRoom(
  roomCode: string,
  uid: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  const roomRef = doc(db, COLLECTION, roomCode.toUpperCase());
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    return { success: false, error: 'roomNotFound' };
  }

  const game = snap.data() as BattleshipGame;

  if (game.player1.uid === uid) {
    // Already in the room as player 1
    return { success: true };
  }

  if (game.player2 !== null) {
    return { success: false, error: 'roomFull' };
  }

  if (game.status !== 'waiting') {
    return { success: false, error: 'gameAlreadyStarted' };
  }

  await updateDoc(roomRef, {
    player2: {
      uid,
      name,
      ships: [],
      ready: false,
    },
    status: 'setup',
  });

  return { success: true };
}

// ── Listen to game state changes ───────────────────────
export function subscribeToGame(
  roomCode: string,
  callback: (game: BattleshipGame | null) => void,
): Unsubscribe {
  const roomRef = doc(db, COLLECTION, roomCode);
  return onSnapshot(roomRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as BattleshipGame);
    } else {
      callback(null);
    }
  });
}

// ── Submit ship placement ──────────────────────────────
export async function submitShips(
  roomCode: string,
  playerNumber: 1 | 2,
  ships: PlacedShip[],
): Promise<void> {
  const roomRef = doc(db, COLLECTION, roomCode);
  const field = playerNumber === 1 ? 'player1' : 'player2';

  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const game = snap.data() as BattleshipGame;
  const playerData = game[field];
  if (!playerData) return;

  const updatedPlayer: PlayerData = {
    ...playerData,
    ships,
    ready: true,
  };

  const updates: Record<string, unknown> = {
    [field]: updatedPlayer,
  };

  // If both players are ready, start the battle
  const otherField = playerNumber === 1 ? 'player2' : 'player1';
  const otherPlayer = game[otherField];
  if (otherPlayer && otherPlayer.ready) {
    updates.status = 'playing';
    updates.currentTurn = 1;
  }

  await updateDoc(roomRef, updates);
}

// ── Fire at a cell ─────────────────────────────────────
export async function fireAt(
  roomCode: string,
  attackingPlayer: 1 | 2,
  row: number,
  col: number,
): Promise<Attack | null> {
  const roomRef = doc(db, COLLECTION, roomCode);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return null;

  const game = snap.data() as BattleshipGame;

  // Validate it's this player's turn
  if (game.currentTurn !== attackingPlayer) return null;
  if (game.status !== 'playing') return null;

  // Get target's ships
  const targetField = attackingPlayer === 1 ? 'player2' : 'player1';
  const targetPlayer = game[targetField];
  if (!targetPlayer) return null;

  // Check if cell was already attacked
  const attacksField = attackingPlayer === 1 ? 'attacksP1' : 'attacksP2';
  const existingAttacks: Attack[] = game[attacksField] || [];
  if (existingAttacks.some((a) => a.row === row && a.col === col)) return null;

  // Determine result
  let hitShipId: string | undefined;
  let didSink = false;
  const updatedShips = targetPlayer.ships.map((ship) => {
    const isHit = ship.cells.some(([sr, sc]) => sr === row && sc === col);
    if (isHit) {
      hitShipId = ship.id;

      // Check if this sinks the ship
      const allHits = [...existingAttacks, { row, col, result: 'hit' as const }];
      const allCellsHit = ship.cells.every(([sr, sc]) =>
        allHits.some((a) => a.row === sr && a.col === sc && (a.result === 'hit' || a.result === 'sunk')),
      );

      if (allCellsHit) {
        didSink = true;
        return { ...ship, sunk: true };
      }
    }
    return ship;
  });

  const result: Attack['result'] = hitShipId ? (didSink ? 'sunk' : 'hit') : 'miss';
  const attack: Attack = { row, col, result, shipId: hitShipId };
  const newAttacks = [...existingAttacks, attack];

  // If a ship was sunk, mark previous hits on that ship as 'sunk' too
  let finalAttacks = newAttacks;
  if (didSink && hitShipId) {
    finalAttacks = newAttacks.map((a) => {
      if (a.shipId === hitShipId) return { ...a, result: 'sunk' as const };
      return a;
    });
  }

  // Check if all ships are sunk (game over)
  const allSunk = updatedShips.every((s) => s.sunk);

  const updates: Record<string, unknown> = {
    [attacksField]: finalAttacks,
    [`${targetField}.ships`]: updatedShips,
    currentTurn: attackingPlayer === 1 ? 2 : 1,
  };

  if (allSunk) {
    updates.status = 'gameover';
    updates.winner = attackingPlayer;
  }

  await updateDoc(roomRef, updates);

  return attack;
}

// ── Delete a room ──────────────────────────────────────
export async function deleteRoom(roomCode: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, roomCode));
}

// ── Ship placement helpers ─────────────────────────────
export type Orientation = 'horizontal' | 'vertical';

export function canPlaceShip(
  placedShips: PlacedShip[],
  shipSize: number,
  row: number,
  col: number,
  orientation: Orientation,
): boolean {
  const occupiedCells = new Set(
    placedShips.flatMap((s) => s.cells.map(([r, c]) => `${r},${c}`)),
  );

  for (let i = 0; i < shipSize; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    if (r >= GRID_SIZE || c >= GRID_SIZE) return false;
    if (occupiedCells.has(`${r},${c}`)) return false;
  }
  return true;
}

export function placeShip(
  placedShips: PlacedShip[],
  shipDef: ShipDef,
  row: number,
  col: number,
  orientation: Orientation,
): PlacedShip[] | null {
  if (!canPlaceShip(placedShips, shipDef.size, row, col, orientation)) return null;

  const cells: [number, number][] = [];
  for (let i = 0; i < shipDef.size; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    cells.push([r, c]);
  }

  return [
    ...placedShips,
    { ...shipDef, cells, sunk: false },
  ];
}

export function randomPlacement(): PlacedShip[] {
  let ships: PlacedShip[] = [];
  for (const def of SHIP_DEFS) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      const orientation: Orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const result = placeShip(ships, def, row, col, orientation);
      if (result) {
        ships = result;
        placed = true;
      }
      attempts++;
    }
  }
  return ships;
}

// ── Build display grids from game state ────────────────
export function buildMyGrid(
  myShips: PlacedShip[],
  attacksOnMe: Attack[],
): CellState[][] {
  const grid: CellState[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill('empty'),
  );

  // Place ships
  for (const ship of myShips) {
    for (const [r, c] of ship.cells) {
      grid[r][c] = 'ship';
    }
  }

  // Apply attacks on me
  for (const atk of attacksOnMe) {
    grid[atk.row][atk.col] = atk.result === 'miss' ? 'miss' : atk.result === 'sunk' ? 'sunk' : 'hit';
  }

  return grid;
}

export function buildAttackGrid(myAttacks: Attack[]): CellState[][] {
  const grid: CellState[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill('empty'),
  );

  for (const atk of myAttacks) {
    grid[atk.row][atk.col] = atk.result === 'miss' ? 'miss' : atk.result === 'sunk' ? 'sunk' : 'hit';
  }

  return grid;
}
