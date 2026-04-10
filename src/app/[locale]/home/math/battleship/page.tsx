'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, Button, Container, IconButton, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import RotateRightRoundedIcon from '@mui/icons-material/RotateRightRounded';
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme/colors';
import { useTranslations } from 'next-intl';
import { useGameSounds } from '@/lib/hooks/useGameSounds';
import RewardCelebration from '@/components/game/RewardCelebration';

// ── Types ──────────────────────────────────────────────
type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';
type Phase = 'setup-p1' | 'setup-p2' | 'transition' | 'battle-p1' | 'battle-p2' | 'gameover';
type Orientation = 'horizontal' | 'vertical';

interface Ship {
  id: string;
  name: string;
  emoji: string;
  size: number;
  placed: boolean;
  cells: [number, number][];
  sunk: boolean;
}

interface Board {
  cells: CellState[][];
  ships: Ship[];
}

// ── Constants ──────────────────────────────────────────
const GRID_SIZE = 8;
const SHIP_DEFS = [
  { id: 'carrier', name: 'Portaaviones', emoji: '🚢', size: 4 },
  { id: 'battleship', name: 'Acorazado', emoji: '⛵', size: 3 },
  { id: 'submarine', name: 'Submarino', emoji: '🤿', size: 3 },
  { id: 'destroyer', name: 'Destructor', emoji: '🛥️', size: 2 },
];

const WATER_COLOR = '#e3f2fd';
const HIT_COLOR = colors.error;
const MISS_COLOR = '#b0bec5';
const SHIP_COLOR = colors.math;
const SUNK_COLOR = '#d32f2f';

// ── Helpers ────────────────────────────────────────────
function createEmptyBoard(): Board {
  return {
    cells: Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('empty')),
    ships: SHIP_DEFS.map((d) => ({ ...d, placed: false, cells: [], sunk: false })),
  };
}

function canPlaceShip(
  board: Board,
  shipSize: number,
  row: number,
  col: number,
  orientation: Orientation,
): boolean {
  for (let i = 0; i < shipSize; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    if (r >= GRID_SIZE || c >= GRID_SIZE) return false;
    if (board.cells[r][c] !== 'empty') return false;
  }
  return true;
}

function placeShipOnBoard(
  board: Board,
  shipIndex: number,
  row: number,
  col: number,
  orientation: Orientation,
): Board {
  const ship = board.ships[shipIndex];
  if (!canPlaceShip(board, ship.size, row, col, orientation)) return board;

  const newCells = board.cells.map((r) => [...r]);
  const shipCells: [number, number][] = [];

  for (let i = 0; i < ship.size; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    newCells[r][c] = 'ship';
    shipCells.push([r, c]);
  }

  const newShips = board.ships.map((s, idx) =>
    idx === shipIndex ? { ...s, placed: true, cells: shipCells } : s,
  );

  return { cells: newCells, ships: newShips };
}

function randomPlacement(): Board {
  let board = createEmptyBoard();
  for (let si = 0; si < SHIP_DEFS.length; si++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      const orientation: Orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (canPlaceShip(board, SHIP_DEFS[si].size, row, col, orientation)) {
        board = placeShipOnBoard(board, si, row, col, orientation);
        placed = true;
      }
      attempts++;
    }
  }
  return board;
}

function checkSunk(board: Board, shipIndex: number): boolean {
  const ship = board.ships[shipIndex];
  return ship.cells.every(([r, c]) => board.cells[r][c] === 'hit' || board.cells[r][c] === 'sunk');
}

function allShipsSunk(board: Board): boolean {
  return board.ships.filter((s) => s.placed).every((s) => s.sunk);
}

// ── Column/Row labels ──────────────────────────────────
const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8'];

// ── Cell size based on grid ────────────────────────────
const CELL_SIZE = 38;

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function BattleshipGame() {
  const router = useRouter();
  const t = useTranslations('game');
  const tBattle = useTranslations('games.battleship');
  const { playCorrect, playWrong, playTap, playWin, playPerfect, playWhoosh, playPop } =
    useGameSounds();

  // ── State ──────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('setup-p1');
  const [boardP1, setBoardP1] = useState<Board>(createEmptyBoard);
  const [boardP2, setBoardP2] = useState<Board>(createEmptyBoard);
  const [attackBoardP1, setAttackBoardP1] = useState<CellState[][]>(
    () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('empty')),
  );
  const [attackBoardP2, setAttackBoardP2] = useState<CellState[][]>(
    () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('empty')),
  );
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [hitsP1, setHitsP1] = useState(0);
  const [hitsP2, setHitsP2] = useState(0);
  const [lastAction, setLastAction] = useState<string>('');
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentPlayer = phase === 'setup-p1' || phase === 'battle-p1' ? 1 : 2;
  const isSetup = phase === 'setup-p1' || phase === 'setup-p2';

  // ── Setup: place ship ──────────────────────────────
  const handleSetupClick = useCallback(
    (row: number, col: number) => {
      const board = currentPlayer === 1 ? boardP1 : boardP2;
      const setBoard = currentPlayer === 1 ? setBoardP1 : setBoardP2;
      if (currentShipIndex >= SHIP_DEFS.length) return;

      const newBoard = placeShipOnBoard(board, currentShipIndex, row, col, orientation);
      if (newBoard === board) {
        playWrong();
        return;
      }

      playPop();
      setBoard(newBoard);

      if (currentShipIndex + 1 >= SHIP_DEFS.length) {
        // All ships placed
        if (phase === 'setup-p1') {
          setTimeout(() => {
            setCurrentShipIndex(0);
            setPhase('transition');
          }, 400);
        } else {
          setTimeout(() => {
            setPhase('transition');
          }, 400);
        }
      } else {
        setCurrentShipIndex(currentShipIndex + 1);
      }
    },
    [currentPlayer, boardP1, boardP2, currentShipIndex, orientation, phase, playWrong, playPop],
  );

  // ── Setup: random placement ────────────────────────
  const handleRandomPlace = useCallback(() => {
    playWhoosh();
    const board = randomPlacement();
    if (currentPlayer === 1) setBoardP1(board);
    else setBoardP2(board);
    setCurrentShipIndex(SHIP_DEFS.length);
    setTimeout(() => {
      setPhase('transition');
    }, 400);
  }, [currentPlayer, playWhoosh]);

  // ── Transition continue ────────────────────────────
  const handleTransitionContinue = useCallback(() => {
    playTap();
    if (phase === 'transition') {
      // Determine next phase
      if (!boardP2.ships.some((s) => s.placed)) {
        // P2 still needs to set up
        setCurrentShipIndex(0);
        setPhase('setup-p2');
      } else {
        // Both set up, start battle
        setPhase('battle-p1');
      }
    }
  }, [phase, boardP2.ships, playTap]);

  // ── Battle: fire ───────────────────────────────────
  const handleFire = useCallback(
    (row: number, col: number) => {
      const attackingPlayer = phase === 'battle-p1' ? 1 : 2;
      const targetBoard = attackingPlayer === 1 ? boardP2 : boardP1;
      const setTargetBoard = attackingPlayer === 1 ? setBoardP2 : setBoardP1;
      const attackBoard = attackingPlayer === 1 ? attackBoardP1 : attackBoardP2;
      const setAttackBoard = attackingPlayer === 1 ? setAttackBoardP1 : setAttackBoardP2;

      // Already attacked this cell
      if (attackBoard[row][col] !== 'empty') return;

      const newAttackBoard = attackBoard.map((r) => [...r]);
      const isHit = targetBoard.cells[row][col] === 'ship';

      if (isHit) {
        playCorrect();
        newAttackBoard[row][col] = 'hit';

        // Update target board
        const newTargetCells = targetBoard.cells.map((r) => [...r]);
        newTargetCells[row][col] = 'hit';
        let newTargetShips = [...targetBoard.ships];

        // Check if any ship is sunk
        let sunkShipName = '';
        newTargetShips = newTargetShips.map((ship) => {
          if (ship.sunk) return ship;
          const isSunk = ship.cells.every(
            ([sr, sc]) => newTargetCells[sr][sc] === 'hit' || newTargetCells[sr][sc] === 'sunk',
          );
          if (isSunk) {
            sunkShipName = ship.emoji + ' ' + ship.name;
            // Mark cells as sunk
            ship.cells.forEach(([sr, sc]) => {
              newTargetCells[sr][sc] = 'sunk';
              newAttackBoard[sr][sc] = 'sunk';
            });
            return { ...ship, sunk: true };
          }
          return ship;
        });

        const updatedTargetBoard = { cells: newTargetCells, ships: newTargetShips };
        setTargetBoard(updatedTargetBoard);

        if (attackingPlayer === 1) setHitsP1((h) => h + 1);
        else setHitsP2((h) => h + 1);

        if (sunkShipName) {
          setLastAction(`💥 ${sunkShipName} hundido!`);
        } else {
          setLastAction('💥 Impacto!');
        }

        // Check win
        if (allShipsSunk(updatedTargetBoard)) {
          setWinner(attackingPlayer as 1 | 2);
          setPhase('gameover');
          playPerfect();
          setShowCelebration(true);
          setAttackBoard(newAttackBoard);
          return;
        }
      } else {
        playWrong();
        newAttackBoard[row][col] = 'miss';
        setLastAction('💧 Agua!');
      }

      setAttackBoard(newAttackBoard);

      // Switch turns after a delay
      setTimeout(() => {
        setPhase('transition');
      }, 1200);
    },
    [
      phase,
      boardP1,
      boardP2,
      attackBoardP1,
      attackBoardP2,
      playCorrect,
      playWrong,
      playPerfect,
    ],
  );

  // ── Restart ────────────────────────────────────────
  const handleRestart = () => {
    setBoardP1(createEmptyBoard());
    setBoardP2(createEmptyBoard());
    setAttackBoardP1(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('empty')));
    setAttackBoardP2(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('empty')));
    setCurrentShipIndex(0);
    setOrientation('horizontal');
    setHitsP1(0);
    setHitsP2(0);
    setLastAction('');
    setWinner(null);
    setShowCelebration(false);
    setPhase('setup-p1');
  };

  // ════════════════════════════════════════════════════
  // RENDER GRID
  // ════════════════════════════════════════════════════
  const renderGrid = (
    grid: CellState[][],
    onClick: (r: number, c: number) => void,
    showShips: boolean,
    interactive: boolean,
  ) => (
    <Box sx={{ display: 'inline-block' }}>
      {/* Column labels */}
      <Box sx={{ display: 'flex', ml: `${CELL_SIZE}px` }}>
        {COL_LABELS.map((label) => (
          <Box
            key={label}
            sx={{
              width: CELL_SIZE,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textSecondary }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {grid.map((row, ri) => (
        <Box key={ri} sx={{ display: 'flex' }}>
          {/* Row label */}
          <Box
            sx={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.textSecondary }}>
              {ROW_LABELS[ri]}
            </Typography>
          </Box>

          {row.map((cell, ci) => {
            let bgColor = WATER_COLOR;
            let content = '';
            let borderColor = '#bbdefb';

            if (cell === 'ship' && showShips) {
              bgColor = SHIP_COLOR;
              borderColor = '#0767b0';
            } else if (cell === 'hit') {
              bgColor = HIT_COLOR;
              content = '💥';
              borderColor = '#c62828';
            } else if (cell === 'sunk') {
              bgColor = SUNK_COLOR;
              content = '🔥';
              borderColor = '#b71c1c';
            } else if (cell === 'miss') {
              bgColor = MISS_COLOR;
              content = '•';
              borderColor = '#90a4ae';
            }

            const isClickable =
              interactive && (cell === 'empty' || (cell === 'ship' && !showShips));

            return (
              <motion.div
                key={ci}
                whileTap={isClickable ? { scale: 0.85 } : {}}
                style={{ display: 'inline-block' }}
              >
                <Box
                  onClick={() => isClickable && onClick(ri, ci)}
                  sx={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    bgcolor: bgColor,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    '&:hover': isClickable
                      ? { bgcolor: '#90caf9', transform: 'scale(1.08)' }
                      : {},
                    fontSize: cell === 'miss' ? '1.2rem' : '0.9rem',
                    color: cell === 'miss' ? 'white' : undefined,
                    fontWeight: 700,
                  }}
                >
                  {content}
                </Box>
              </motion.div>
            );
          })}
        </Box>
      ))}
    </Box>
  );

  // ════════════════════════════════════════════════════
  // RENDER PHASES
  // ════════════════════════════════════════════════════

  // ── Transition screen (pass device) ────────────────
  if (phase === 'transition') {
    const nextPlayer = !boardP2.ships.some((s) => s.placed)
      ? 2
      : phase === 'transition' && lastAction
      ? currentPlayer === 1
        ? 2
        : 1
      : 1;
    const isSetupTransition = !boardP2.ships.some((s) => s.placed);

    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: colors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>
              {isSetupTransition ? '🎯' : '🔄'}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.math, mb: 1 }}>
              {tBattle('player')} {nextPlayer}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 1 }}>
              {isSetupTransition ? tBattle('placeYourShips') : tBattle('yourTurn')}
            </Typography>
            {lastAction && !isSetupTransition && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Chip
                  label={lastAction}
                  sx={{
                    mt: 1,
                    mb: 2,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    bgcolor: lastAction.includes('Impacto') || lastAction.includes('hundido')
                      ? `${HIT_COLOR}22`
                      : `${MISS_COLOR}22`,
                  }}
                />
              </motion.div>
            )}
            <Typography variant="caption" sx={{ display: 'block', color: colors.textMuted, mb: 3 }}>
              {tBattle('passDevice')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleTransitionContinue}
              sx={{
                bgcolor: colors.math,
                borderRadius: 6,
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                '&:hover': { bgcolor: colors.math },
              }}
            >
              {tBattle('ready')}
            </Button>
          </Box>
        </motion.div>
      </Box>
    );
  }

  // ── Game Over ──────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: colors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              p: 4,
              bgcolor: 'white',
              borderRadius: 5,
              boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
              mx: 2,
            }}
          >
            <Typography sx={{ fontSize: '3.5rem', mb: 1 }}>🏆</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: colors.math, mb: 1 }}>
              {tBattle('player')} {winner} {tBattle('wins')}!
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, my: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                  {tBattle('player')} 1
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {hitsP1} 💥
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                  {tBattle('player')} 2
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {hitsP2} 💥
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                sx={{ borderRadius: 4, borderColor: colors.math, color: colors.math }}
              >
                {t('back')}
              </Button>
              <Button
                variant="contained"
                onClick={handleRestart}
                sx={{ bgcolor: colors.math, borderRadius: 4, '&:hover': { bgcolor: colors.math } }}
              >
                {t('playAgain')}
              </Button>
            </Box>
          </Box>
        </motion.div>

        <RewardCelebration
          show={showCelebration}
          message={`🚢 ${tBattle('player')} ${winner} ${tBattle('wins')}!`}
          stars={3}
          onComplete={() => setShowCelebration(false)}
        />
      </Box>
    );
  }

  // ── Setup & Battle phases ──────────────────────────
  const isBattle = phase === 'battle-p1' || phase === 'battle-p2';
  const myBoard = currentPlayer === 1 ? boardP1 : boardP2;
  const attackBoard = currentPlayer === 1 ? attackBoardP1 : attackBoardP2;
  const targetBoard = currentPlayer === 1 ? boardP2 : boardP1;

  // For battle: build a combined view of the target for display
  const targetView: CellState[][] = Array.from({ length: GRID_SIZE }, (_, ri) =>
    Array.from({ length: GRID_SIZE }, (_, ci) => attackBoard[ri][ci]),
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background, pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          bgcolor: 'white',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => router.back()} size="small">
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ color: colors.math, fontWeight: 700 }}>
            {tBattle('title')}
          </Typography>
        </Box>
        <Chip
          label={`${tBattle('player')} ${currentPlayer}`}
          sx={{
            bgcolor: `${colors.math}22`,
            color: colors.math,
            fontWeight: 700,
          }}
        />
      </Box>

      <Container maxWidth="sm" sx={{ pt: 2, textAlign: 'center' }}>
        {/* ── SETUP PHASE ── */}
        {isSetup && (
          <>
            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, color: colors.textPrimary }}>
                {tBattle('placeYourShips')}
              </Typography>

              {currentShipIndex < SHIP_DEFS.length && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontSize: '1.3rem' }}>
                    {SHIP_DEFS[currentShipIndex].emoji}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: colors.math }}>
                    {SHIP_DEFS[currentShipIndex].name} ({SHIP_DEFS[currentShipIndex].size})
                  </Typography>
                  <Chip
                    label={orientation === 'horizontal' ? '↔️' : '↕️'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RotateRightRoundedIcon />}
                  onClick={() => {
                    playTap();
                    setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'));
                  }}
                  sx={{ borderRadius: 4, borderColor: colors.math, color: colors.math, textTransform: 'none' }}
                >
                  {tBattle('rotate')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ShuffleRoundedIcon />}
                  onClick={handleRandomPlace}
                  sx={{ borderRadius: 4, borderColor: colors.math, color: colors.math, textTransform: 'none' }}
                >
                  {tBattle('random')}
                </Button>
              </Box>
            </motion.div>

            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {renderGrid(myBoard.cells, handleSetupClick, true, currentShipIndex < SHIP_DEFS.length)}
            </motion.div>

            {/* Ship list */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {myBoard.ships.map((ship, idx) => (
                <Chip
                  key={ship.id}
                  label={`${ship.emoji} ${ship.size}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: ship.placed ? `${colors.success}22` : `${colors.math}11`,
                    color: ship.placed ? colors.success : colors.textSecondary,
                    border: idx === currentShipIndex && !ship.placed ? `2px solid ${colors.math}` : undefined,
                  }}
                />
              ))}
            </Box>

            {currentShipIndex >= SHIP_DEFS.length && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    playTap();
                    setPhase('transition');
                  }}
                  sx={{
                    mt: 3,
                    bgcolor: colors.math,
                    borderRadius: 6,
                    px: 5,
                    fontWeight: 700,
                    '&:hover': { bgcolor: colors.math },
                  }}
                >
                  {tBattle('confirm')}
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* ── BATTLE PHASE ── */}
        {isBattle && (
          <>
            {/* Last action feedback */}
            <AnimatePresence>
              {lastAction && (
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                >
                  <Chip
                    label={lastAction}
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      bgcolor: lastAction.includes('Impacto') || lastAction.includes('hundido')
                        ? `${HIT_COLOR}22`
                        : `${MISS_COLOR}22`,
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Target grid (opponent) */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, mb: 0.5, color: colors.error, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              🎯 {tBattle('enemyWaters')}
            </Typography>

            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {renderGrid(targetView, handleFire, false, true)}
            </motion.div>

            {/* Enemy ships status */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1, mb: 2, flexWrap: 'wrap' }}>
              {(currentPlayer === 1 ? boardP2 : boardP1).ships.map((ship) => (
                <Chip
                  key={ship.id}
                  label={`${ship.emoji} ${ship.size}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: ship.sunk ? `${colors.error}22` : `${colors.math}11`,
                    color: ship.sunk ? colors.error : colors.textSecondary,
                    textDecoration: ship.sunk ? 'line-through' : 'none',
                  }}
                />
              ))}
            </Box>

            {/* My board (small reference) */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, mb: 0.5, color: colors.math, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              🛡️ {tBattle('myFleet')}
            </Typography>

            <Box sx={{ transform: 'scale(0.7)', transformOrigin: 'top center', mb: -6 }}>
              {renderGrid(myBoard.cells, () => {}, true, false)}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
