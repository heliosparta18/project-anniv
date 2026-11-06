import { useState, useEffect, useRef, useCallback } from 'react';
import type { MusicTrack } from '../types/anniversary';
import { musicTracks as defaultMusicTracks } from '../data/anniversaryData';
import { romanticSynth } from '../utils/audioSynth';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTrack: MusicTrack;
  currentTime: number;
  duration: number;
  progress: number; // 0 to 100 percentage
  volume: number; // 0 to 1
  isMuted: boolean;
  isSynthFallback: boolean;
  toneArmEngaged: boolean;
  showNotesModal: boolean;
  error: string | null;
}

export interface AudioPlayerActions {
  togglePlay: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (index: number) => void;
  seek: (progressPercent: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleNotesModal: (show?: boolean) => void;
}

export function useAudioPlayer(
  tracks: MusicTrack[] = defaultMusicTracks
): [AudioPlayerState, AudioPlayerActions] {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [volume, setVolumeState] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSynthFallback, setIsSynthFallback] = useState<boolean>(false);
  const [toneArmEngaged, setToneArmEngaged] = useState<boolean>(false);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  const playlist = tracks.length > 0 ? tracks : defaultMusicTracks;
  const currentTrack = playlist[currentTrackIndex % playlist.length] || playlist[0];

  // Helper to activate Web Audio procedural synthesizer fallback
  const activateSynthFallback = useCallback(async () => {
    setIsSynthFallback(true);
    setToneArmEngaged(true);
    setIsPlaying(true);
    isPlayingRef.current = true;
    setError(null);

    const activeVol = isMuted ? 0 : volume;
    romanticSynth.setVolume(activeVol);
    await romanticSynth.start();

    // Start simulated progress timer (180s track duration)
    if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    synthTimerRef.current = setInterval(() => {
      setCurrentTime((prev: number) => {
        const next = prev + 0.25;
        if (next >= 180) {
          // Auto advance to next track when simulated duration completes
          setCurrentTrackIndex((idx: number) => (idx + 1) % playlist.length);
          return 0;
        }
        return next;
      });
    }, 250);
  }, [isMuted, volume, playlist.length]);

  // Clean stop for audio element and synth
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setToneArmEngaged(false);

    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        // Safe suppression
      }
    }

    romanticSynth.stop();
  }, []);

  // Initialize and synchronize HTML5 Audio element
  useEffect(() => {
    if (typeof Audio === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isSynthFallback && audio.duration) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setCurrentTime(0);
      setCurrentTrackIndex((prev: number) => (prev + 1) % playlist.length);
    };

    const handleError = () => {
      // Missing audio file or 404 intercepted cleanly without console errors
      if (isPlayingRef.current) {
        activateSynthFallback();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, [playlist.length, isSynthFallback, activateSynthFallback]);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack?.src) {
      audioRef.current.src = currentTrack.src;
      audioRef.current.load();

      if (isPlayingRef.current && !isSynthFallback) {
        audioRef.current.play().catch(() => {
          activateSynthFallback();
        });
      }
    }
  }, [currentTrack, isSynthFallback, activateSynthFallback]);

  // Sync volume & mute changes
  useEffect(() => {
    const activeVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = activeVol;
    }
    romanticSynth.setVolume(activeVol);
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  // Play action
  const play = useCallback(async () => {
    setError(null);
    setToneArmEngaged(true);

    if (isSynthFallback) {
      await activateSynthFallback();
      return;
    }

    if (audioRef.current && currentTrack?.src) {
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
        isPlayingRef.current = true;
      } catch {
        // Autoplay or missing file policy cleanly caught; activate procedural chord synth
        await activateSynthFallback();
      }
    } else {
      await activateSynthFallback();
    }
  }, [isSynthFallback, currentTrack, activateSynthFallback]);

  // Pause action
  const pause = useCallback(() => {
    stopPlayback();
  }, [stopPlayback]);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, pause, play]);

  // Next track
  const nextTrack = useCallback(() => {
    setCurrentTime(0);
    setCurrentTrackIndex((prev: number) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  // Previous track
  const prevTrack = useCallback(() => {
    setCurrentTime(0);
    setCurrentTrackIndex((prev: number) => (prev - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  // Select track by index
  const selectTrack = useCallback((index: number) => {
    setCurrentTime(0);
    setCurrentTrackIndex(Math.max(0, Math.min(playlist.length - 1, index)));
  }, [playlist.length]);

  // Seek position
  const seek = useCallback((progressPercent: number) => {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    const targetTime = (clamped / 100) * duration;
    setCurrentTime(targetTime);

    if (audioRef.current && !isSynthFallback && audioRef.current.duration) {
      audioRef.current.currentTime = targetTime;
    }
  }, [duration, isSynthFallback]);

  // Volume
  const setVolume = useCallback((val: number) => {
    if (typeof val !== 'number' || Number.isNaN(val)) return;
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (isMuted && clamped > 0) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev: boolean) => !prev);
  }, []);

  // Notes Modal Toggle
  const toggleNotesModal = useCallback((show?: boolean) => {
    setShowNotesModal((prev: boolean) => (typeof show === 'boolean' ? show : !prev));
  }, []);

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const state: AudioPlayerState = {
    isPlaying,
    currentTrackIndex,
    currentTrack,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    isSynthFallback,
    toneArmEngaged,
    showNotesModal,
    error,
  };

  const actions: AudioPlayerActions = {
    togglePlay,
    play,
    pause,
    nextTrack,
    prevTrack,
    selectTrack,
    seek,
    setVolume,
    toggleMute,
    toggleNotesModal,
  };

  return [state, actions];
}

export default useAudioPlayer;
