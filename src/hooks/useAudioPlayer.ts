import { useState, useEffect, useRef, useCallback } from 'react';
import type { MusicTrack } from '../types/anniversary';
import { musicTracks as defaultMusicTracks } from '../data/anniversaryData';
import { romanticSynth } from '../utils/audioSynth';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

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

// Module-level YouTube player state and singleton coordination
let globalYtPlayer: any = null;
let globalYtReady = false;
let globalYtLoading = false;
let globalYtFailed = false;
const ytReadyCallbacks: Array<(yt: any) => void> = [];

function loadYouTubeApi(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(null);
    }

    if (window.YT && window.YT.Player) {
      return resolve(window.YT);
    }

    if (globalYtReady && globalYtPlayer) {
      return resolve(window.YT);
    }

    ytReadyCallbacks.push(resolve);

    if (globalYtLoading) {
      return;
    }
    globalYtLoading = true;

    const prevHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevHandler === 'function') {
        try {
          prevHandler();
        } catch {
          // Safe suppression
        }
      }
      globalYtLoading = false;
      while (ytReadyCallbacks.length > 0) {
        const cb = ytReadyCallbacks.shift();
        if (cb) cb(window.YT);
      }
    };

    if (document.getElementById('youtube-iframe-api-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'youtube-iframe-api-script';
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      globalYtLoading = false;
      globalYtFailed = true;
      while (ytReadyCallbacks.length > 0) {
        const cb = ytReadyCallbacks.shift();
        if (cb) cb(null);
      }
    };
    if (document.head) {
      document.head.appendChild(script);
    }

    // Timeout guard in case YouTube cannot load within 4 seconds
    setTimeout(() => {
      if (!window.YT) {
        globalYtFailed = true;
        while (ytReadyCallbacks.length > 0) {
          const cb = ytReadyCallbacks.shift();
          if (cb) cb(null);
        }
      }
    }, 4000);
  });
}

function parseTrackDuration(track?: MusicTrack): number {
  if (track?.duration) {
    const parts = track.duration.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
  }
  return 180;
}

export function useAudioPlayer(
  tracks: MusicTrack[] = defaultMusicTracks
): [AudioPlayerState, AudioPlayerActions] {
  const playlist = tracks.length > 0 ? tracks : defaultMusicTracks;
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const [volume, setVolumeState] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSynthFallback, setIsSynthFallback] = useState<boolean>(false);
  const [toneArmEngaged, setToneArmEngaged] = useState<boolean>(false);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isYtReady, setIsYtReady] = useState<boolean>(() => globalYtReady);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const pendingPlayRef = useRef<boolean>(false);

  const currentTrack = playlist[currentTrackIndex % playlist.length] || playlist[0];
  const duration = customDuration ?? parseTrackDuration(currentTrack);

  const setDuration = useCallback((val: number) => {
    setCustomDuration(val);
  }, []);

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

  // Clean stop for audio element, YouTube player, and synth
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setToneArmEngaged(false);
    pendingPlayRef.current = false;

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

    if (globalYtPlayer && isYtReady) {
      try {
        globalYtPlayer.pauseVideo();
      } catch {
        // Safe suppression
      }
    }

    romanticSynth.stop();
  }, [isYtReady]);

  // Initialize and synchronize HTML5 Audio element
  useEffect(() => {
    if (typeof Audio === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isSynthFallback && audio.duration && !currentTrack?.youtubeId) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && !currentTrack?.youtubeId) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setCurrentTime(0);
      setCurrentTrackIndex((prev: number) => (prev + 1) % playlist.length);
    };

    const handleError = () => {
      // Missing audio file or 404 intercepted cleanly without console errors
      if (isPlayingRef.current && !currentTrack?.youtubeId) {
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
  }, [playlist.length, isSynthFallback, currentTrack?.youtubeId, activateSynthFallback, setDuration]);

  // Initialize YouTube Iframe Player in browser environment
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.createElement || !document.body) {
      return;
    }

    // Ensure hidden container exists in document.body
    let host = document.getElementById('youtube-audio-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'youtube-audio-host';
      host.style.position = 'fixed';
      host.style.bottom = '-9999px';
      host.style.right = '-9999px';
      host.style.width = '1px';
      host.style.height = '1px';
      host.style.opacity = '0';
      host.style.pointerEvents = 'none';
      host.setAttribute('aria-hidden', 'true');

      const targetDiv = document.createElement('div');
      targetDiv.id = 'youtube-audio-player';
      host.appendChild(targetDiv);
      document.body.appendChild(host);
    }

    if (globalYtPlayer) {
      return;
    }

    loadYouTubeApi().then((YT) => {
      if (!YT || !YT.Player) return;
      if (globalYtPlayer) {
        setIsYtReady(true);
        return;
      }

      try {
        new YT.Player('youtube-audio-player', {
          height: '1',
          width: '1',
          videoId: currentTrack?.youtubeId || 'o25_Tn8BnFM',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: currentTrack?.youtubeId || 'o25_Tn8BnFM',
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              globalYtPlayer = event.target;
              globalYtReady = true;
              setIsYtReady(true);

              try {
                const vol = isMuted ? 0 : Math.round(volume * 100);
                event.target.setVolume(vol);
                if (isMuted) {
                  event.target.mute();
                } else {
                  event.target.unMute();
                }

                const d = event.target.getDuration();
                if (typeof d === 'number' && d > 0) {
                  setDuration(d);
                }
              } catch {
                // Safe suppression
              }

              if (pendingPlayRef.current) {
                pendingPlayRef.current = false;
                try {
                  event.target.playVideo();
                  setIsPlaying(true);
                  isPlayingRef.current = true;
                  setToneArmEngaged(true);
                  setIsSynthFallback(false);
                } catch {
                  activateSynthFallback();
                }
              }
            },
            onStateChange: (event: any) => {
              // 1: PLAYING, 2: PAUSED, 0: ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                isPlayingRef.current = true;
                setToneArmEngaged(true);
                setIsSynthFallback(false);
              } else if (event.data === 2) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                setToneArmEngaged(false);
              } else if (event.data === 0) {
                setCurrentTime(0);
                setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
              }
            },
            onError: () => {
              globalYtFailed = true;
              if (isPlayingRef.current) {
                activateSynthFallback();
              }
            },
          },
        });
      } catch {
        // Safe suppression
      }
    });
  }, [playlist.length, isMuted, volume, currentTrack?.youtubeId, activateSynthFallback, setDuration]);

  // Update audio source when track changes
  useEffect(() => {
    if (currentTrack?.youtubeId) {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // Safe suppression
        }
      }
      if (globalYtPlayer && isYtReady) {
        try {
          if (isPlayingRef.current) {
            globalYtPlayer.loadVideoById(currentTrack.youtubeId);
          } else {
            globalYtPlayer.cueVideoById(currentTrack.youtubeId);
          }
        } catch {
          // Safe suppression
        }
      }
    } else if (audioRef.current && currentTrack?.src) {
      if (globalYtPlayer && isYtReady) {
        try {
          globalYtPlayer.pauseVideo();
        } catch {
          // Safe suppression
        }
      }
      audioRef.current.src = currentTrack.src;
      audioRef.current.load();

      if (isPlayingRef.current && !isSynthFallback) {
        audioRef.current.play().catch(() => {
          activateSynthFallback();
        });
      }
    }
  }, [currentTrack, isYtReady, isSynthFallback, activateSynthFallback]);

  // Poll YouTube playback time when active
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && !isSynthFallback && globalYtPlayer && isYtReady && currentTrack?.youtubeId) {
      timer = setInterval(() => {
        try {
          const cur = globalYtPlayer.getCurrentTime();
          const dur = globalYtPlayer.getDuration();
          if (typeof cur === 'number' && !isNaN(cur)) {
            setCurrentTime(cur);
          }
          if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
            setDuration(dur);
          }
        } catch {
          // Safe suppression
        }
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, isSynthFallback, isYtReady, currentTrack?.youtubeId, setDuration]);

  // Sync volume & mute changes
  useEffect(() => {
    const activeVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = activeVol;
    }
    if (globalYtPlayer && isYtReady) {
      try {
        if (isMuted) {
          globalYtPlayer.mute();
        } else {
          globalYtPlayer.unMute();
          globalYtPlayer.setVolume(Math.round(activeVol * 100));
        }
      } catch {
        // Safe suppression
      }
    }
    romanticSynth.setVolume(activeVol);
  }, [volume, isMuted, isYtReady]);

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

    // 1. YouTube playback route for tracks with youtubeId
    if (currentTrack?.youtubeId) {
      if (globalYtPlayer && isYtReady) {
        try {
          globalYtPlayer.playVideo();
          setIsPlaying(true);
          isPlayingRef.current = true;
          setToneArmEngaged(true);
          setIsSynthFallback(false);
          return;
        } catch {
          await activateSynthFallback();
          return;
        }
      }

      // If YouTube is loading in a real browser environment
      if (typeof window !== 'undefined' && !globalYtFailed) {
        pendingPlayRef.current = true;
        setIsPlaying(true);
        isPlayingRef.current = true;
        setToneArmEngaged(true);

        // Fallback guard if YouTube player cannot ready within 3s
        setTimeout(() => {
          if (!globalYtReady && isPlayingRef.current) {
            activateSynthFallback();
          }
        }, 3000);
        return;
      }
    }

    // 2. HTML5 audio route for tracks with local audio files
    if (audioRef.current && currentTrack?.src && !currentTrack.youtubeId) {
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
        isPlayingRef.current = true;
        return;
      } catch {
        // Autoplay or missing file policy cleanly caught; activate procedural chord synth
        await activateSynthFallback();
        return;
      }
    }

    // 3. Procedural chord synthesizer fallback
    await activateSynthFallback();
  }, [isSynthFallback, currentTrack, isYtReady, activateSynthFallback]);

  // Pause action
  const pause = useCallback(() => {
    if (globalYtPlayer && isYtReady) {
      try {
        globalYtPlayer.pauseVideo();
      } catch {
        // Safe suppression
      }
    }
    stopPlayback();
  }, [isYtReady, stopPlayback]);

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
    setCustomDuration(null);
    setCurrentTrackIndex((prev: number) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  // Previous track
  const prevTrack = useCallback(() => {
    setCurrentTime(0);
    setCustomDuration(null);
    setCurrentTrackIndex((prev: number) => (prev - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  // Select track by index
  const selectTrack = useCallback((index: number) => {
    setCurrentTime(0);
    setCustomDuration(null);
    setCurrentTrackIndex(Math.max(0, Math.min(playlist.length - 1, index)));
  }, [playlist.length]);

  // Seek position
  const seek = useCallback((progressPercent: number) => {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    const targetTime = (clamped / 100) * duration;
    setCurrentTime(targetTime);

    if (currentTrack?.youtubeId && globalYtPlayer && isYtReady) {
      try {
        globalYtPlayer.seekTo(targetTime, true);
      } catch {
        // Safe suppression
      }
    }

    if (audioRef.current && !isSynthFallback && audioRef.current.duration) {
      audioRef.current.currentTime = targetTime;
    }
  }, [duration, currentTrack?.youtubeId, isYtReady, isSynthFallback]);

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
