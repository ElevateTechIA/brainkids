'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  IconButton,
  Chip,
  TextField,
  CircularProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import RotateRightRoundedIcon from '@mui/icons-material/RotateRightRounded';
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme/colors';
import { useTranslations } from 'next-intl';
import { useGameSounds } from '@/lib/hooks/useGameSounds';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import RewardCelebration from '@/components/game/RewardCelebration';
import {
  type BattleshipGame,
  type PlacedShip,
  type Attack,
  type CellState,
  type Orientation,
  GRID_SIZE,
  SHIP_DEFS,
  createRoom,
  joinRoom,
  subscribeToGame,
  submitShips,
  fireAt,
  placeShip,
  randomPlacement,
  buildMyGrid,
  buildAttackGrid,
} from '@/lib/firebase/battleship';

// ── Constants ──────────────────────────────────────────
const WATER_COLOR = '#e3f2fd';
const HIT_COLOR = colors.error;
const MISS_COLOR = '#b0bec5';
const SHIP_COLOR = colors.math;
const SUNK_COLOR = '#d32f2f';
const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const CELL_SIZE = 38;

// ════════════════════════════════════════════════════════
// GRID RENDERER
// ════════════════════════════════════════════════════════
function GameGrid({
  grid,
  onClick,
  interactive,
  showShips,
}: {
  grid: CellState[][];
  onClick: (r: number, c: number) => void;
  interactive: boolean;
  showShips: boolean;
}) {
  return (
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
                    '&:hover': isClickable ? { bgcolor: '#90caf9', transform: 'scale(1.08)' } : {},
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
}

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function BattleshipMultiplayer() {
  const router = useRouter();
  const t = useTranslations('game');
  const tBattle = useTranslations('games.battleship');
  const { playCorrect, playWrong, playTap, playPerfect, playWhoosh, playPop } = useGameSounds();
  const playerName = usePlayerStore((s) => s.displayName) || 'Jugador';
  const playerUid = usePlayerStore((s) => s.uid);

  // ── State ──────────────────────────────────────────
  const [screen, setScreen] = useState<'lobby' | 'game'>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [myPlayerNumber, setMyPlayerNumber] = useState<1 | 2 | null>(null);
  const [game, setGame] = useState<BattleshipGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Setup state
  const [myShips, setMyShips] = useState<PlacedShip[]>([]);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [shipsSubmitted, setShipsSubmitted] = useState(false);

  // Battle state
  const [lastAttack, setLastAttack] = useState<Attack | null>(null);
  const [firing, setFiring] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const unsubRef = useRef<(() => void) | null>(null);
  const prevAttackCountRef = useRef(0);

  // Effective UID: use Firebase uid or fallback to a localStorage-based ID
  const uid = playerUid || (() => {
    if (typeof window === 'undefined') return 'anon';
    let id = localStorage.getItem('brainkids-anon-uid');
    if (!id) {
      id = 'anon-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('brainkids-anon-uid', id);
    }
    return id;
  })();

  // ── Subscribe to game ──────────────────────────────
  const startListening = useCallback(
    (code: string) => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = subscribeToGame(code, (g) => {
        setGame(g);
      });
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  // Sound effects for incoming attacks
  useEffect(() => {
    if (!game || game.status !== 'playing' || !myPlayerNumber) return;
    const attacksOnMe = myPlayerNumber === 1 ? game.attacksP2 : game.attacksP1;
    if (attacksOnMe.length > prevAttackCountRef.current) {
      const latest = attacksOnMe[attacksOnMe.length - 1];
      if (latest.result === 'hit' || latest.result === 'sunk') playWrong();
    }
    prevAttackCountRef.current = attacksOnMe.length;
  }, [game, myPlayerNumber, playWrong]);

  // Show celebration on game over
  useEffect(() => {
    if (game?.status === 'gameover' && game.winner === myPlayerNumber && !showCelebration) {
      playPerfect();
      setShowCelebration(true);
    }
  }, [game?.status, game?.winner, myPlayerNumber, playPerfect, showCelebration]);

  // ── Create Room ────────────────────────────────────
  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const code = await createRoom(uid, playerName);
      setRoomCode(code);
      setMyPlayerNumber(1);
      startListening(code);
      setScreen('game');
    } catch {
      setError(tBattle('errorCreating'));
    }
    setLoading(false);
  };

  // ── Join Room ──────────────────────────────────────
  const handleJoin = async () => {
    if (joinCode.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const code = joinCode.toUpperCase();
      const result = await joinRoom(code, uid, playerName);
      if (result.success) {
        setRoomCode(code);
        setMyPlayerNumber(2);
        startListening(code);
        setScreen('game');
      } else {
        setError(tBattle(result.error || 'errorJoining'));
      }
    } catch {
      setError(tBattle('errorJoining'));
    }
    setLoading(false);
  };

  // ── Copy room code ─────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Place ship (setup) ─────────────────────────────
  const currentShipIndex = myShips.length;
  const handlePlaceShip = useCallback(
    (row: number, col: number) => {
      if (currentShipIndex >= SHIP_DEFS.length) return;
      const result = placeShip(myShips, SHIP_DEFS[currentShipIndex], row, col, orientation);
      if (!result) {
        playWrong();
        return;
      }
      playPop();
      setMyShips(result);
    },
    [myShips, currentShipIndex, orientation, playWrong, playPop],
  );

  // ── Random placement ───────────────────────────────
  const handleRandom = () => {
    playWhoosh();
    setMyShips(randomPlacement());
  };

  // ── Submit ships ───────────────────────────────────
  const handleSubmitShips = async () => {
    if (myShips.length < SHIP_DEFS.length || !myPlayerNumber) return;
    playTap();
    setShipsSubmitted(true);
    await submitShips(roomCode, myPlayerNumber, myShips);
  };

  // ── Fire! ──────────────────────────────────────────
  const handleFire = useCallback(
    async (row: number, col: number) => {
      if (firing || !myPlayerNumber || !game) return;
      if (game.currentTurn !== myPlayerNumber) return;

      setFiring(true);
      const attack = await fireAt(roomCode, myPlayerNumber, row, col);
      if (attack) {
        setLastAttack(attack);
        if (attack.result === 'hit' || attack.result === 'sunk') playCorrect();
        else playWrong();
      }
      setFiring(false);
    },
    [firing, myPlayerNumber, game, roomCode, playCorrect, playWrong],
  );

  // ── Restart (back to lobby) ────────────────────────
  const handleBackToLobby = () => {
    if (unsubRef.current) unsubRef.current();
    setScreen('lobby');
    setGame(null);
    setRoomCode('');
    setJoinCode('');
    setMyPlayerNumber(null);
    setMyShips([]);
    setShipsSubmitted(false);
    setLastAttack(null);
    setShowCelebration(false);
    prevAttackCountRef.current = 0;
  };

  // ════════════════════════════════════════════════════
  // RENDER: LOBBY
  // ════════════════════════════════════════════════════
  if (screen === 'lobby') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${colors.math}, ${colors.mathLight})`,
            color: 'white',
            p: 3,
            pb: 4,
            borderRadius: '0 0 28px 28px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => router.back()} sx={{ color: 'white' }}>
              <ArrowBackRoundedIcon />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {tBattle('title')}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5, ml: 6 }}>
            {tBattle('description')}
          </Typography>
        </Box>

        <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>🚢</Typography>

            {/* Create Room */}
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 4,
                p: 3,
                mb: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: colors.math }}>
                {tBattle('createRoom')}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2 }}>
                {tBattle('createRoomDesc')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleCreate}
                disabled={loading}
                sx={{
                  bgcolor: colors.math,
                  borderRadius: 6,
                  px: 5,
                  fontWeight: 700,
                  '&:hover': { bgcolor: colors.math },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : tBattle('create')}
              </Button>
            </Box>

            {/* Join Room */}
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 4,
                p: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: colors.math }}>
                {tBattle('joinRoom')}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2 }}>
                {tBattle('joinRoomDesc')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <TextField
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="ABCD"
                  inputProps={{
                    maxLength: 4,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                    },
                  }}
                  sx={{
                    width: 160,
                    '& .MuiOutlinedInput-root': { borderRadius: 3 },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleJoin}
                  disabled={loading || joinCode.length < 4}
                  sx={{
                    bgcolor: colors.math,
                    borderRadius: 3,
                    fontWeight: 700,
                    '&:hover': { bgcolor: colors.math },
                  }}
                >
                  {tBattle('join')}
                </Button>
              </Box>
            </Box>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Typography sx={{ color: colors.error, mt: 2, fontWeight: 700 }}>
                  {error}
                </Typography>
              </motion.div>
            )}
          </motion.div>
        </Container>
      </Box>
    );
  }

  // ════════════════════════════════════════════════════
  // RENDER: IN-GAME
  // ════════════════════════════════════════════════════
  if (!game) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: colors.math }} />
      </Box>
    );
  }

  const isMyTurn = game.currentTurn === myPlayerNumber;
  const myData = myPlayerNumber === 1 ? game.player1 : game.player2;
  const opponentData = myPlayerNumber === 1 ? game.player2 : game.player1;
  const myAttacks = myPlayerNumber === 1 ? game.attacksP1 : game.attacksP2;
  const attacksOnMe = myPlayerNumber === 1 ? game.attacksP2 : game.attacksP1;

  // ── Waiting for player 2 ──────────────────────────
  if (game.status === 'waiting') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>⏳</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.math, mb: 2 }}>
              {tBattle('waitingForPlayer')}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3 }}>
              {tBattle('shareCode')}
            </Typography>

            {/* Room code display */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'white',
                borderRadius: 4,
                px: 4,
                py: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                mb: 3,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: colors.math,
                  letterSpacing: '0.3em',
                  fontFamily: 'monospace',
                }}
              >
                {roomCode}
              </Typography>
              <IconButton onClick={handleCopy} sx={{ color: colors.math }}>
                <ContentCopyRoundedIcon />
              </IconButton>
            </Box>
            {copied && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', color: colors.success, fontWeight: 700 }}>
                  {tBattle('copied')}
                </Typography>
              </motion.div>
            )}

            <Box sx={{ mt: 3 }}>
              <CircularProgress size={28} sx={{ color: colors.math }} />
            </Box>

            <Button
              variant="text"
              onClick={handleBackToLobby}
              sx={{ mt: 3, color: colors.textSecondary }}
            >
              {t('back')}
            </Button>
          </Box>
        </motion.div>
      </Box>
    );
  }

  // ── Setup phase ────────────────────────────────────
  if (game.status === 'setup') {
    const setupGrid: CellState[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill('empty'),
    );
    for (const ship of myShips) {
      for (const [r, c] of ship.cells) {
        setupGrid[r][c] = 'ship';
      }
    }

    const allPlaced = myShips.length >= SHIP_DEFS.length;

    // Already submitted, waiting for opponent
    if (shipsSubmitted) {
      return (
        <Box sx={{ minHeight: '100vh', bgcolor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography sx={{ fontSize: '3rem', mb: 2 }}>✅</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: colors.math, mb: 1 }}>
                {tBattle('shipsReady')}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3 }}>
                {tBattle('waitingForOpponent')}
              </Typography>
              <CircularProgress size={28} sx={{ color: colors.math }} />
            </Box>
          </motion.div>
        </Box>
      );
    }

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
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleBackToLobby} size="small">
              <ArrowBackRoundedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: colors.math, fontWeight: 700 }}>
              {tBattle('title')}
            </Typography>
          </Box>
          <Chip
            label={`${tBattle('room')}: ${roomCode}`}
            size="small"
            sx={{ fontWeight: 700, bgcolor: `${colors.math}22`, color: colors.math }}
          />
        </Box>

        <Container maxWidth="sm" sx={{ pt: 2, textAlign: 'center' }}>
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
                onClick={handleRandom}
                sx={{ borderRadius: 4, borderColor: colors.math, color: colors.math, textTransform: 'none' }}
              >
                {tBattle('random')}
              </Button>
            </Box>
          </motion.div>

          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <GameGrid
              grid={setupGrid}
              onClick={handlePlaceShip}
              interactive={currentShipIndex < SHIP_DEFS.length}
              showShips={true}
            />
          </motion.div>

          {/* Ship list */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {SHIP_DEFS.map((def, idx) => {
              const isPlaced = idx < myShips.length;
              return (
                <Chip
                  key={def.id}
                  label={`${def.emoji} ${def.size}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: isPlaced ? `${colors.success}22` : `${colors.math}11`,
                    color: isPlaced ? colors.success : colors.textSecondary,
                    border: idx === currentShipIndex && !isPlaced ? `2px solid ${colors.math}` : undefined,
                  }}
                />
              );
            })}
          </Box>

          {allPlaced && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmitShips}
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
        </Container>
      </Box>
    );
  }

  // ── Battle phase ───────────────────────────────────
  if (game.status === 'playing' || game.status === 'gameover') {
    const attackGrid = buildAttackGrid(myAttacks);
    const myGrid = buildMyGrid(myShips.length > 0 ? myShips : myData?.ships || [], attacksOnMe);
    const opponentShips = opponentData?.ships || [];

    // Game over screen
    if (game.status === 'gameover') {
      const iWon = game.winner === myPlayerNumber;
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
              <Typography sx={{ fontSize: '3.5rem', mb: 1 }}>
                {iWon ? '🏆' : '💔'}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: iWon ? colors.math : colors.error, mb: 1 }}>
                {iWon ? tBattle('youWin') : tBattle('youLose')}
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 2 }}>
                vs {opponentData?.name || tBattle('player')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, my: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    {tBattle('yourHits')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {myAttacks.filter((a) => a.result !== 'miss').length} 💥
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                    {tBattle('yourMisses')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {myAttacks.filter((a) => a.result === 'miss').length} 💧
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
                  onClick={handleBackToLobby}
                  sx={{ bgcolor: colors.math, borderRadius: 4, '&:hover': { bgcolor: colors.math } }}
                >
                  {t('playAgain')}
                </Button>
              </Box>
            </Box>
          </motion.div>

          <RewardCelebration
            show={showCelebration && iWon}
            message={`🚢 ${tBattle('youWin')}!`}
            stars={3}
            onComplete={() => setShowCelebration(false)}
          />
        </Box>
      );
    }

    // Battle screen
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
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleBackToLobby} size="small">
              <ArrowBackRoundedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: colors.math, fontWeight: 700 }}>
              {tBattle('title')}
            </Typography>
          </Box>
          <Chip
            label={isMyTurn ? `🎯 ${tBattle('yourTurnShort')}` : `⏳ ${tBattle('opponentTurn')}`}
            sx={{
              fontWeight: 700,
              bgcolor: isMyTurn ? `${colors.success}22` : `${colors.warning}22`,
              color: isMyTurn ? colors.success : colors.textSecondary,
              animation: isMyTurn ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
              },
            }}
          />
        </Box>

        <Container maxWidth="sm" sx={{ pt: 2, textAlign: 'center' }}>
          {/* Turn indicator */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isMyTurn ? 'my' : 'their'}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: isMyTurn ? colors.success : colors.textMuted,
                }}
              >
                {isMyTurn ? tBattle('tapToFire') : `${opponentData?.name || tBattle('player')} ${tBattle('isThinking')}...`}
              </Typography>
            </motion.div>
          </AnimatePresence>

          {/* Target grid (opponent) */}
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, mb: 0.5, color: colors.error, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            🎯 {tBattle('enemyWaters')}
          </Typography>

          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <GameGrid
              grid={attackGrid}
              onClick={handleFire}
              interactive={isMyTurn && !firing}
              showShips={false}
            />
          </motion.div>

          {/* Enemy ships status */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1, mb: 2, flexWrap: 'wrap' }}>
            {opponentShips.map((ship) => (
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

          {/* My board (reference) */}
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, mb: 0.5, color: colors.math, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            🛡️ {tBattle('myFleet')}
          </Typography>

          <Box sx={{ transform: 'scale(0.7)', transformOrigin: 'top center', mb: -6 }}>
            <GameGrid grid={myGrid} onClick={() => {}} interactive={false} showShips={true} />
          </Box>
        </Container>
      </Box>
    );
  }

  // Fallback
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: colors.math }} />
    </Box>
  );
}
