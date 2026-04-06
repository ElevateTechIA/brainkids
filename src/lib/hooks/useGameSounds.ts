'use client';

import useSound from 'use-sound';

export function useGameSounds() {
  const [playCorrect] = useSound('/sounds/correct.ogg', { volume: 0.6 });
  const [playWrong] = useSound('/sounds/wrong.ogg', { volume: 0.4 });
  const [playTap] = useSound('/sounds/tap.ogg', { volume: 0.5 });
  const [playDrop] = useSound('/sounds/drop.ogg', { volume: 0.5 });
  const [playStar] = useSound('/sounds/star.ogg', { volume: 0.6 });
  const [playLevelUp] = useSound('/sounds/levelup.ogg', { volume: 0.7 });
  const [playWin] = useSound('/sounds/win.ogg', { volume: 0.7 });
  const [playComplete] = useSound('/sounds/complete.ogg', { volume: 0.7 });
  const [playPerfect] = useSound('/sounds/perfect.ogg', { volume: 0.7 });
  const [playPop] = useSound('/sounds/pop.ogg', { volume: 0.5 });
  const [playWhoosh] = useSound('/sounds/whoosh.ogg', { volume: 0.4 });
  const [playCombo] = useSound('/sounds/combo.ogg', { volume: 0.6 });
  const [playBadge] = useSound('/sounds/badge.ogg', { volume: 0.7 });
  const [playStreak] = useSound('/sounds/streak.ogg', { volume: 0.7 });

  return {
    playCorrect,
    playWrong,
    playTap,
    playDrop,
    playStar,
    playLevelUp,
    playWin,
    playComplete,
    playPerfect,
    playPop,
    playWhoosh,
    playCombo,
    playBadge,
    playStreak,
  };
}
