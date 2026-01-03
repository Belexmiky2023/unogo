import { useCallback, useRef, useState } from "react";

// Sound effect URLs (using data URIs for simple sounds)
const SOUNDS = {
  cardPlay: "data:audio/wav;base64,UklGRl9vT19telefonCBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
  cardDraw: "data:audio/wav;base64,UklGRl9vT19telefonCBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
  unoCall: "data:audio/wav;base64,UklGRl9vT19telefonCBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
  victory: "data:audio/wav;base64,UklGRl9vT19telefonCBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
  turnChange: "data:audio/wav;base64,UklGRl9vT19telefonCBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
  penalty: "data:audio/wav;base64,UklGRl9vT19telefonCBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU",
};

export function useSoundEffects() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Generate simple synth sound
  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine", gain: number = 0.3) => {
      if (!soundEnabled) return;

      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(gain, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch (e) {
        console.log("Audio not available");
      }
    },
    [soundEnabled, getAudioContext]
  );

  // Card play sound - quick pop
  const playCardSound = useCallback(() => {
    playTone(800, 0.08, "sine", 0.2);
    setTimeout(() => playTone(1000, 0.05, "sine", 0.15), 30);
  }, [playTone]);

  // Card draw sound - lower swipe
  const playDrawSound = useCallback(() => {
    playTone(400, 0.1, "triangle", 0.2);
    setTimeout(() => playTone(500, 0.08, "triangle", 0.15), 50);
  }, [playTone]);

  // UNO call sound - triumphant
  const playUnoSound = useCallback(() => {
    playTone(523, 0.15, "square", 0.2);
    setTimeout(() => playTone(659, 0.15, "square", 0.2), 100);
    setTimeout(() => playTone(784, 0.2, "square", 0.25), 200);
  }, [playTone]);

  // Victory sound - celebratory fanfare
  const playVictorySound = useCallback(() => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, "sine", 0.25), i * 150);
    });
  }, [playTone]);

  // Turn change sound - soft ding
  const playTurnSound = useCallback(() => {
    playTone(600, 0.1, "sine", 0.15);
  }, [playTone]);

  // Penalty sound - descending
  const playPenaltySound = useCallback(() => {
    playTone(400, 0.1, "sawtooth", 0.2);
    setTimeout(() => playTone(300, 0.15, "sawtooth", 0.15), 80);
  }, [playTone]);

  // Shuffle sound - rapid clicks
  const playShuffleSound = useCallback(() => {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playTone(300 + Math.random() * 200, 0.03, "triangle", 0.1);
      }, i * 40);
    }
  }, [playTone]);

  // Deal card sound
  const playDealSound = useCallback(() => {
    playTone(500, 0.05, "triangle", 0.15);
  }, [playTone]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playCardSound,
    playDrawSound,
    playUnoSound,
    playVictorySound,
    playTurnSound,
    playPenaltySound,
    playShuffleSound,
    playDealSound,
  };
}
