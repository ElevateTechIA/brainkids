'use client';

import useSound from 'use-sound';

const sources = (name: string) => [`/sounds/${name}.m4a`, `/sounds/${name}.ogg`];

export function useGameSounds() {
  const [playCorrect] = useSound(sources('correct'), { volume: 0.6 });
  const [playWrong] = useSound(sources('wrong'), { volume: 0.4 });
  const [playTap] = useSound(sources('tap'), { volume: 0.5 });
  const [playDrop] = useSound(sources('drop'), { volume: 0.5 });
  const [playStar] = useSound(sources('star'), { volume: 0.6 });
  const [playLevelUp] = useSound(sources('levelup'), { volume: 0.7 });
  const [playWin] = useSound(sources('win'), { volume: 0.7 });
  const [playComplete] = useSound(sources('complete'), { volume: 0.7 });
  const [playPerfect] = useSound(sources('perfect'), { volume: 0.7 });
  const [playPop] = useSound(sources('pop'), { volume: 0.5 });
  const [playWhoosh] = useSound(sources('whoosh'), { volume: 0.4 });
  const [playCombo] = useSound(sources('combo'), { volume: 0.6 });
  const [playBadge] = useSound(sources('badge'), { volume: 0.7 });
  const [playStreak] = useSound(sources('streak'), { volume: 0.7 });

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
