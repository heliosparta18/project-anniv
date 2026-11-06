import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  Heart,
  Sparkles,
  Maximize2,
  Disc3,
  X,
  Music,
} from 'lucide-react';
import type { MusicTrack } from '../../types/anniversary';
import { musicTracks as defaultMusicTracks, coupleProfile } from '../../data/anniversaryData';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

export interface VinylPlayerProps {
  tracks?: MusicTrack[];
  variant?: 'section' | 'dock';
  className?: string;
  onTrackChange?: (track: MusicTrack) => void;
}

/**
 * Format seconds into mm:ss
 */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const VinylPlayer: React.FC<VinylPlayerProps> = ({
  tracks = defaultMusicTracks,
  variant = 'section',
  className = '',
  onTrackChange,
}) => {
  const playlist = tracks;
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [state, actions] = useAudioPlayer(tracks);

  const {
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
  } = state;

  const {
    togglePlay,
    nextTrack,
    prevTrack,
    selectTrack,
    seek,
    setVolume,
    toggleMute,
    toggleNotesModal,
  } = actions;

  const handleTrackSelect = (index: number) => {
    selectTrack(index);
    if (onTrackChange && tracks[index]) {
      onTrackChange(tracks[index]);
    }
  };

  /* =========================================================================
     COMPACT FLOATING DOCK VARIANT
     ========================================================================= */
  if (variant === 'dock') {
    return (
      <div className={`relative ${className}`}>
        {/* Floating Dock Bar */}
        <div
          role="region"
          aria-label="Floating Vinyl Music Player"
          className="flex items-center gap-3 p-2 pr-4 bg-anniv-card/95 backdrop-blur-md border border-anniv-borderSubtle/80 rounded-full shadow-warm-lg hover:shadow-warm-elevation transition-all duration-300"
        >
          {/* Mini Rotating Vinyl Disc */}
          <div
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-[#181414] relative flex items-center justify-center cursor-pointer shadow-sm border border-anniv-rose/30 shrink-0 group overflow-hidden"
            title={isPlaying ? 'Pause music' : 'Play music'}
          >
            {/* Spinning Groove Texture */}
            <div
              className={`w-full h-full rounded-full flex items-center justify-center transition-transform duration-500 ${
                isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
              }`}
            >
              <div className="absolute inset-1 rounded-full border border-white/10" />
              <div className="absolute inset-2.5 rounded-full border border-white/5" />
              {/* Mini Center Label */}
              <div className="w-4 h-4 rounded-full bg-anniv-rose flex items-center justify-center text-[8px] text-white font-serif font-bold">
                {coupleProfile.partnerName[0]}
              </div>
            </div>
            {/* Center Play/Pause Overlay on Hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </div>
          </div>

          {/* Track Info & Progress */}
          <div
            className="flex flex-col cursor-pointer min-w-[120px] max-w-[160px] sm:max-w-[200px]"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-serif font-bold text-xs text-anniv-cocoa truncate">
                {currentTrack.title}
              </span>
              {isSynthFallback && (
                <span
                  title="Web Audio Lo-Fi Synthesizer Fallback"
                  className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-anniv-peach text-anniv-rose text-[9px] font-semibold shrink-0"
                >
                  <Radio className="w-2.5 h-2.5 mr-0.5" />
                  Synth
                </span>
              )}
            </div>
            <span className="text-[11px] text-anniv-secondary truncate">
              {currentTrack.artist}
            </span>
          </div>

          {/* Play/Pause Button (Touch Target >= 44x44px) */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-anniv-rose text-white flex items-center justify-center shadow-sm hover:bg-anniv-roseHover active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Expand to Full Player Modal Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-label="Expand vinyl turntable player"
            className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-anniv-secondary hover:text-anniv-cocoa cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded Full Modal Backdrop */}
        {isExpanded && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vinyl Turntable Audio Showcase"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-anniv-cocoa/60 backdrop-blur-sm animate-fade-in"
          >
            <div className="relative w-full max-w-3xl bg-anniv-card rounded-3xl p-6 sm:p-8 border border-anniv-borderSubtle shadow-warm-lg max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                aria-label="Close vinyl turntable modal"
                className="absolute top-5 right-5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-anniv-peach text-anniv-cocoa flex items-center justify-center hover:bg-anniv-borderSubtle transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <VinylPlayer tracks={tracks} variant="section" onTrackChange={onTrackChange} />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================================
     DEDICATED SECTION / SHOWCASE VARIANT
     ========================================================================= */
  return (
    <div
      role="region"
      aria-label="Aesthetic Vinyl Turntable Player"
      className={`w-full max-w-4xl mx-auto flex flex-col items-center ${className}`}
    >
      {/* Turntable Plinth / Luxury Chassis */}
      <div className="w-full bg-anniv-card border border-anniv-borderSubtle rounded-3xl shadow-warm-lg p-6 sm:p-8 md:p-10 relative overflow-hidden">
        {/* Vintage Hi-Fi Details */}
        <div className="flex items-center justify-between border-b border-anniv-borderSubtle/60 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-anniv-rose animate-pulse" />
            <span className="text-[11px] font-sans font-bold tracking-widest text-anniv-cocoa uppercase">
              Analog Turntable &bull; Hi-Fi Stereo
            </span>
          </div>

          {/* Web Audio Fallback Indicator */}
          {isSynthFallback ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-anniv-peach border border-anniv-borderSubtle text-anniv-rose text-xs font-semibold"
              title="Web Audio API procedural lo-fi chords actively playing"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Lo-Fi Synth Fallback Active</span>
            </div>
          ) : (
            <div className="text-[11px] text-anniv-truffle font-medium tracking-wide">
              33⅓ RPM &bull; High Fidelity Audio
            </div>
          )}
        </div>

        {/* Main Turntable Deck Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: Realistic Vinyl Turntable Record & Tone Arm Platter */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-64 h-64 sm:w-76 sm:h-76 md:w-80 md:h-80 bg-[#141111] rounded-3xl p-4 sm:p-6 shadow-inner flex items-center justify-center border border-white/5">
              {/* Corner Screws */}
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-anniv-champagne/40 border border-white/20" />
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-anniv-champagne/40 border border-white/20" />
              <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-anniv-champagne/40 border border-white/20" />
              <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-anniv-champagne/40 border border-white/20" />

              {/* The Spinning Vinyl Record */}
              <div
                className={`w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#1A1616] relative flex items-center justify-center shadow-2xl transition-transform duration-700 select-none ${
                  isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                }`}
                style={{
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.6)',
                }}
              >
                {/* Realistic Micro-Grooves (Concentric Rings) */}
                <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-5 rounded-full border border-white/[0.03]" />
                <div className="absolute inset-8 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-11 rounded-full border border-white/[0.03]" />
                <div className="absolute inset-14 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-17 rounded-full border border-white/[0.02]" />

                {/* Satin Sheen Reflection across Vinyl Surface */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />

                {/* Rotating Center Label with Couple Initials */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-anniv-peach via-anniv-card to-anniv-blush border-2 border-anniv-rose/40 flex flex-col items-center justify-center text-center p-2 shadow-inner relative z-10">
                  <span className="font-serif font-bold text-xs sm:text-sm text-anniv-rose tracking-wider">
                    {coupleProfile.myName[0]} &amp; {coupleProfile.partnerName[0]}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-anniv-truffle font-semibold">
                    Side A
                  </span>
                  <Heart className="w-2.5 h-2.5 text-anniv-rose fill-anniv-rose mt-0.5" />

                  {/* Brass Spindle Hole */}
                  <div className="w-3.5 h-3.5 rounded-full bg-[#181414] border border-white/20 shadow-inner flex items-center justify-center mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-anniv-champagne" />
                  </div>
                </div>
              </div>

              {/* REALISTIC ANIMATED TONE ARM */}
              <div
                className="absolute top-4 right-4 z-20 pointer-events-none select-none transition-transform duration-700 ease-in-out origin-top-right"
                style={{
                  transform: toneArmEngaged ? 'rotate(26deg)' : 'rotate(0deg)',
                }}
              >
                {/* Pivot Gimbal Base */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-anniv-champagne via-anniv-borderAction to-anniv-cocoa shadow-md border border-white/40 flex items-center justify-center relative">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#3B2F2F] border border-anniv-champagne" />
                </div>

                {/* Metallic Tonearm Stem */}
                <div className="w-1.5 h-28 sm:h-34 bg-gradient-to-b from-[#E2D5C8] via-[#9E8E85] to-[#4F413B] rounded-full shadow-md ml-3.5 -mt-1 relative">
                  {/* Headshell & Stylus Cartridge */}
                  <div className="absolute -bottom-3 -left-1.5 w-4 h-6 bg-[#2B2323] rounded-sm border border-anniv-champagne/60 shadow-sm flex flex-col items-center justify-end pb-0.5">
                    {/* Tiny Stylus Needle */}
                    <div className="w-0.5 h-1.5 bg-anniv-champagne" />
                  </div>
                </div>
              </div>

              {/* Tone Arm Rest Cradle (when paused) */}
              <div className="absolute top-28 right-5 w-2 h-4 rounded-sm bg-anniv-borderAction/60 border border-white/10" />
            </div>
          </div>

          {/* RIGHT: Track Details, Progress Bar & Playback Controls */}
          <div className="lg:col-span-6 flex flex-col justify-center gap-5 text-left">
            {/* Now Playing Header */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-anniv-rose flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  <span>Now Spinning &bull; Track {currentTrackIndex + 1} of {playlist.length}</span>
                </span>

                {/* Romantic Note Modal Trigger */}
                <button
                  type="button"
                  onClick={() => toggleNotesModal()}
                  aria-label="View Rama's romantic note for this track"
                  className="inline-flex items-center gap-1 text-xs text-anniv-rose hover:text-anniv-roseHover font-semibold transition-colors cursor-pointer min-h-[44px] min-w-[44px] px-2 py-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Read Note</span>
                </button>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-anniv-cocoa mb-1 leading-tight">
                {currentTrack.title}
              </h3>
              <p className="font-sans text-sm sm:text-base text-anniv-secondary font-medium">
                {currentTrack.artist}
              </p>
            </div>

            {/* Track Progress Scrubber Slider */}
            <div className="space-y-1.5">
              <div className="relative flex items-center w-full">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  aria-label="Track progress slider"
                  className="w-full h-11 py-[18px] bg-anniv-peach bg-clip-content rounded-full appearance-none cursor-pointer accent-anniv-rose focus:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose"
                />
              </div>
              <div className="flex justify-between text-xs text-anniv-truffle font-medium tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls (Play/Pause, Prev, Next, Volume) */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Previous Track Button (min-w-[44px] min-h-[44px]) */}
                <button
                  type="button"
                  onClick={prevTrack}
                  aria-label="Play previous track"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-anniv-peach hover:bg-anniv-borderSubtle text-anniv-cocoa flex items-center justify-center transition-colors cursor-pointer"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Primary Play/Pause Button (min-w-[56px] min-h-[56px] >= 44x44px) */}
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause music' : 'Play music'}
                  className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-anniv-rose text-white flex items-center justify-center shadow-warm-md hover:bg-anniv-roseHover hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                {/* Next Track Button (min-w-[44px] min-h-[44px]) */}
                <button
                  type="button"
                  onClick={nextTrack}
                  aria-label="Play next track"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-anniv-peach hover:bg-anniv-borderSubtle text-anniv-cocoa flex items-center justify-center transition-colors cursor-pointer"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume & Mute Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-anniv-secondary hover:text-anniv-cocoa transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label="Volume slider"
                  className="w-16 sm:w-24 h-11 py-[19px] bg-anniv-peach bg-clip-content rounded-full appearance-none cursor-pointer accent-anniv-rose focus:outline-none focus-visible:ring-2 focus-visible:ring-anniv-rose"
                />
              </div>
            </div>

            {/* Playlist Track Selector List */}
            <div className="mt-4 pt-4 border-t border-anniv-borderSubtle/60 space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-anniv-truffle font-bold block mb-2">
                Anniversary Playlist
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {playlist.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <button
                      key={track.id || idx}
                      type="button"
                      onClick={() => handleTrackSelect(idx)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-left flex items-center justify-between text-xs transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-anniv-peach/80 border-anniv-rose/40 text-anniv-cocoa font-bold shadow-warm-sm'
                          : 'bg-white/60 hover:bg-anniv-peach/30 border-anniv-borderSubtle text-anniv-secondary font-medium'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="truncate text-anniv-cocoa">{track.title}</div>
                        <div className="text-[10px] text-anniv-truffle truncate">{track.artist}</div>
                      </div>
                      {isCurrent && isPlaying ? (
                        <Disc3 className="w-4 h-4 text-anniv-rose animate-spin shrink-0" />
                      ) : (
                        <span className="text-[10px] text-anniv-truffle font-mono shrink-0">
                          0{idx + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Romantic Notes Modal / Tooltip */}
      {showNotesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Romantic note for ${currentTrack.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-anniv-cocoa/50 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg bg-anniv-card rounded-2xl p-6 sm:p-8 border border-anniv-borderSubtle shadow-warm-lg text-left">
            <div className="washi-tape absolute -top-2.5 left-8" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 fill-anniv-rose text-anniv-rose" />
                <span className="text-xs uppercase tracking-wider font-bold text-anniv-rose">
                  Why This Song Matters to Us
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleNotesModal(false)}
                aria-label="Close romantic note"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-anniv-secondary hover:text-anniv-cocoa cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="font-serif text-xl sm:text-2xl font-bold text-anniv-cocoa mb-1">
              &ldquo;{currentTrack.title}&rdquo;
            </h4>
            <p className="text-xs text-anniv-truffle mb-4">by {currentTrack.artist}</p>

            <blockquote className="font-serif italic text-base sm:text-lg text-anniv-cocoa leading-relaxed bg-anniv-peach/40 p-4 rounded-xl border-l-4 border-anniv-rose mb-4">
              &ldquo;{currentTrack.notes || 'Soundtrack indah dari setiap detik kebersamaan kita.'}&rdquo;
            </blockquote>

            <div className="text-right font-serif text-sm text-anniv-rose font-bold">
              ~ Rama for Alya 💕
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VinylPlayer;
