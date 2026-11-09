import { useState, useRef, useEffect, useMemo, ChangeEvent } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  Heart, 
  MoreHorizontal, 
  ChevronDown, 
  Library, 
  Search, 
  Home, 
  Volume2, 
  VolumeX,
  ListMusic,
  Sliders,
  X,
  Check,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_TRACKS, Track } from './constants';
import { EqualizerModal, DEFAULT_BANDS, EQBand } from './components/EqualizerModal';

// --- Utility: Format Time ---
const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- Sub-Component: StatusBar ---
const StatusBar = () => {
  const [timeStr, setTimeStr] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[11px] font-semibold text-white/70 z-30 bg-[#0a0502]/90 backdrop-blur-md shrink-0 select-none">
      <span className="font-mono tracking-tight">{timeStr}</span>
      <div className="flex gap-2 items-center">
        {/* Signal Bars */}
        <div className="flex items-end gap-0.5 h-2.5">
          <div className="w-0.5 h-1 bg-white/70 rounded-full" />
          <div className="w-0.5 h-1.5 bg-white/70 rounded-full" />
          <div className="w-0.5 h-2 bg-white/70 rounded-full" />
          <div className="w-0.5 h-2.5 bg-white/70 rounded-full" />
        </div>
        {/* Wi-Fi */}
        <div className="w-2.5 h-2.5 border-t-2 border-r-2 border-white/70 rounded-tr-full rotate-[-45deg] translate-y-0.5" />
        {/* Battery */}
        <div className="flex items-center gap-0.5">
          <div className="w-5 h-2.5 border border-white/50 rounded-[3px] p-0.5 flex items-center">
            <div className="w-3.5 h-full bg-brand rounded-[1px]" />
          </div>
          <div className="w-0.5 h-1 bg-white/50 rounded-r-xs" />
        </div>
      </div>
    </div>
  );
};

// --- Sub-Component: MiniPlayer ---
interface MiniPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  progress: number;
  duration: number;
  isEqualizerEnabled: boolean;
  onOpenPlayer: () => void;
  onOpenEqualizer: () => void;
  onTogglePlay: () => void;
}

const MiniPlayer = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  isEqualizerEnabled,
  onOpenPlayer,
  onOpenEqualizer,
  onTogglePlay,
}: MiniPlayerProps) => {
  const safeDuration = duration > 0 ? duration : currentTrack.duration;
  const progressPercent = Math.min(100, Math.max(0, (progress / safeDuration) * 100));

  return (
    <motion.div
      key="mini-player-bar"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onOpenPlayer}
      className="absolute bottom-[72px] left-3 right-3 glass rounded-2xl p-2.5 flex items-center gap-3 cursor-pointer z-30 group shadow-[0_12px_32px_rgba(0,0,0,0.75)]"
    >
      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md">
        <img
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-0.5">
            <span className="w-0.5 h-3 bg-brand rounded-full animate-pulse" />
            <span className="w-0.5 h-4 bg-brand rounded-full animate-pulse delay-75" />
            <span className="w-0.5 h-2.5 bg-brand rounded-full animate-pulse delay-150" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold truncate text-white">{currentTrack.title}</h4>
        <p className="text-xs text-white/60 truncate">{currentTrack.artist}</p>
      </div>

      <div className="flex items-center gap-1 pr-0.5 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenEqualizer();
          }}
          className={`p-2 rounded-full transition-colors relative ${
            isEqualizerEnabled ? 'text-brand hover:bg-white/10' : 'text-white/50 hover:text-white'
          }`}
          title="Equalizer"
          aria-label="Open Equalizer"
        >
          <Sliders size={17} />
          {isEqualizerEnabled && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="w-9 h-9 bg-white text-black hover:scale-105 active:scale-95 rounded-full flex items-center justify-center transition-transform shadow-md"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} className="ml-0.5" fill="currentColor" />
          )}
        </button>
      </div>

      {/* Mini progress bar at top of mini player */}
      <div className="absolute top-0 left-3 right-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </motion.div>
  );
};

export default function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(MOCK_TRACKS[0].duration);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(['1', '3']);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'liked'>('all');

  // Equalizer state
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isEqualizerEnabled, setIsEqualizerEnabled] = useState(true);
  const [eqBands, setEqBands] = useState<EQBand[]>(DEFAULT_BANDS);
  const [bassBoost, setBassBoost] = useState(30);
  const [virtualizer, setVirtualizer] = useState(25);
  const [selectedPreset, setSelectedPreset] = useState('Flat');

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = MOCK_TRACKS[currentTrackIndex];
  const effectiveDuration = audioDuration > 0 ? audioDuration : currentTrack.duration;
  const isCurrentLiked = likedTrackIds.includes(currentTrack.id);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // --- Handlers ---
  const togglePlay = () => setIsPlaying((prev) => !prev);

  const toggleLike = (trackId: string) => {
    setLikedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setProgress(0);
    setAudioDuration(MOCK_TRACKS[index].duration);
    setIsPlaying(true);
  };

  const nextTrack = () => {
    if (isShuffle && MOCK_TRACKS.length > 1) {
      let randomIndex = currentTrackIndex;
      while (randomIndex === currentTrackIndex) {
        randomIndex = Math.floor(Math.random() * MOCK_TRACKS.length);
      }
      selectTrack(randomIndex);
      return;
    }

    const nextIndex = (currentTrackIndex + 1) % MOCK_TRACKS.length;
    selectTrack(nextIndex);
  };

  const prevTrack = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }
    const prevIndex = (currentTrackIndex - 1 + MOCK_TRACKS.length) % MOCK_TRACKS.length;
    selectTrack(prevIndex);
  };

  const handleTrackEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      audioRef.current.play().catch(() => setIsPlaying(false));
      return;
    }
    if (repeatMode === 'none' && !isShuffle && currentTrackIndex === MOCK_TRACKS.length - 1) {
      setIsPlaying(false);
      setProgress(0);
      return;
    }
    nextTrack();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  };

  const filteredTracks = useMemo(() => {
    return MOCK_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.album.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const libraryTracks = useMemo(() => {
    if (libraryFilter === 'liked') {
      return MOCK_TRACKS.filter((t) => likedTrackIds.includes(t.id));
    }
    return MOCK_TRACKS;
  }, [libraryFilter, likedTrackIds]);

  // --- Effects ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      let eqMultiplier = 1;
      if (isEqualizerEnabled) {
        const avgGain = eqBands.reduce((acc, b) => acc + b.value, 0) / eqBands.length;
        const bassBoostBonus = (bassBoost / 100) * 0.12;
        eqMultiplier = Math.max(0.75, Math.min(1.2, 1 + avgGain * 0.015 + bassBoostBonus));
      }
      audioRef.current.muted = isMuted;
      audioRef.current.volume = isMuted ? 0 : Math.min(1, volume * eqMultiplier);
    }
  }, [volume, isMuted, isEqualizerEnabled, eqBands, bassBoost]);

  const progressPercentage = Math.min(100, Math.max(0, (progress / effectiveDuration) * 100));

  return (
    <div className="flex justify-center h-[100dvh] w-full bg-black select-none overflow-hidden">
      <div className="atmosphere" />

      {/* Mobile Frame Container */}
      <div className="relative w-full max-w-md h-full bg-[#0a0502]/85 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col z-10 sm:border-x border-white/5">
        <StatusBar />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pb-40 no-scrollbar">
          {activeTab === 'home' && (
            <div className="p-6 pt-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-serif font-bold italic tracking-tight">{greeting}</h1>
                <button
                  onClick={() => setIsEqualizerOpen(true)}
                  className={`p-2.5 rounded-full border transition-all ${
                    isEqualizerEnabled
                      ? 'bg-brand/15 border-brand/40 text-brand'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                  title="Equalizer Settings"
                >
                  <Sliders size={18} />
                </button>
              </div>

              {/* Quick Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {MOCK_TRACKS.slice(0, 4).map((track) => {
                  const trackIdx = MOCK_TRACKS.indexOf(track);
                  const isCurrent = currentTrackIndex === trackIdx;
                  return (
                    <div
                      key={track.id}
                      onClick={() => selectTrack(trackIdx)}
                      className={`p-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer group border ${
                        isCurrent
                          ? 'bg-brand/15 border-brand/30'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-md">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Pause size={16} fill="white" className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-semibold line-clamp-2 leading-tight ${
                            isCurrent ? 'text-brand' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Horizontal Carousel */}
              <div className="flex items-center justify-between mt-9 mb-4">
                <h2 className="text-xl font-serif font-bold italic">Jump back in</h2>
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                  {MOCK_TRACKS.length} Tracks
                </span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                {MOCK_TRACKS.map((track) => {
                  const trackIdx = MOCK_TRACKS.indexOf(track);
                  const isCurrent = currentTrackIndex === trackIdx;
                  return (
                    <div
                      key={track.id}
                      className="w-[148px] shrink-0 cursor-pointer group"
                      onClick={() => selectTrack(trackIdx)}
                    >
                      <div className="relative aspect-square mb-2.5 overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div
                          className={`absolute inset-0 bg-black/35 transition-opacity flex items-center justify-center ${
                            isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
                            {isCurrent && isPlaying ? (
                              <Pause fill="white" size={20} />
                            ) : (
                              <Play fill="white" size={20} className="ml-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                      <p
                        className={`font-semibold text-sm truncate ${
                          isCurrent ? 'text-brand' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-white/50 text-xs truncate">{track.artist}</p>
                    </div>
                  );
                })}
              </div>

              {/* All Tracks List on Home for easy browsing */}
              <h2 className="text-xl font-serif font-bold mt-6 mb-4 italic">Featured Tracks</h2>
              <div className="space-y-2.5">
                {MOCK_TRACKS.map((track, idx) => {
                  const isCurrent = currentTrackIndex === idx;
                  const isLiked = likedTrackIds.includes(track.id);
                  return (
                    <div
                      key={track.id}
                      onClick={() => selectTrack(idx)}
                      className={`p-2.5 rounded-xl flex items-center gap-3.5 cursor-pointer transition-colors border ${
                        isCurrent
                          ? 'bg-white/10 border-brand/30'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-brand' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <p className="text-xs text-white/50 truncate">
                          {track.artist} • {track.album}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isLiked ? 'text-brand' : 'text-white/30 hover:text-white'
                        }`}
                        aria-label="Like Track"
                      >
                        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="p-6 pt-6">
              <h1 className="text-3xl font-serif font-bold mb-5 italic">Search</h1>
              <div className="sticky top-0 bg-[#0a0502]/95 backdrop-blur-md py-2 z-10 mb-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="text"
                    placeholder="Songs, artists, or albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl py-3 pl-10 pr-10 outline-hidden focus:border-brand/50 focus:bg-white/15 transition-all text-sm text-white placeholder:text-white/40"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {filteredTracks.length === 0 ? (
                <div className="text-center py-16 text-white/40">
                  <Music size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No tracks found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTracks.map((track) => {
                    const trackIdx = MOCK_TRACKS.indexOf(track);
                    const isCurrent = currentTrackIndex === trackIdx;
                    const isLiked = likedTrackIds.includes(track.id);
                    return (
                      <div
                        key={track.id}
                        className={`flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer transition-colors ${
                          isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                        onClick={() => selectTrack(trackIdx)}
                      >
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-13 h-13 rounded-lg object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isCurrent ? 'text-brand' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </h4>
                          <p className="text-xs text-white/50 truncate">
                            {track.artist} • {track.album}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(track.id);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            isLiked ? 'text-brand' : 'text-white/30 hover:text-white'
                          }`}
                        >
                          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="p-6 pt-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-serif font-bold text-white italic">Your Library</h1>
                <button
                  onClick={() => setActiveTab('search')}
                  className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                  title="Search Library"
                >
                  <Search size={20} />
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setLibraryFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    libraryFilter === 'all'
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                  }`}
                >
                  All Tracks ({MOCK_TRACKS.length})
                </button>
                <button
                  onClick={() => setLibraryFilter('liked')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    libraryFilter === 'liked'
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                  }`}
                >
                  <Heart size={12} fill="currentColor" />
                  <span>Liked Songs ({likedTrackIds.length})</span>
                </button>
              </div>

              <div className="space-y-3">
                {/* Liked Songs Banner Card */}
                <div
                  onClick={() =>
                    setLibraryFilter((prev) => (prev === 'liked' ? 'all' : 'liked'))
                  }
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border ${
                    libraryFilter === 'liked'
                      ? 'bg-brand/15 border-brand/40'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-brand to-amber-700 flex items-center justify-center text-white shadow-lg shrink-0">
                    <Heart fill="white" size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white">Liked Songs</h4>
                    <p className="text-xs text-white/60">
                      Playlist • {likedTrackIds.length} {likedTrackIds.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                  {libraryFilter === 'liked' && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-brand px-2 py-1 bg-brand/10 rounded-md">
                      Active
                    </span>
                  )}
                </div>

                {libraryTracks.map((track) => {
                  const trackIdx = MOCK_TRACKS.indexOf(track);
                  const isCurrent = currentTrackIndex === trackIdx;
                  const isLiked = likedTrackIds.includes(track.id);
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                      onClick={() => selectTrack(trackIdx)}
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-13 h-13 rounded-xl object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-brand' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <p className="text-xs text-white/50 truncate">
                          {track.artist} • {formatTime(track.duration)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isLiked ? 'text-brand' : 'text-white/30 hover:text-white'
                        }`}
                      >
                        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Global Mini Player */}
        <AnimatePresence>
          {!isPlayerOpen && (
            <MiniPlayer
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              duration={effectiveDuration}
              isEqualizerEnabled={isEqualizerEnabled}
              onOpenPlayer={() => setIsPlayerOpen(true)}
              onOpenEqualizer={() => setIsEqualizerOpen(true)}
              onTogglePlay={togglePlay}
            />
          )}
        </AnimatePresence>

        {/* Full Player Screen */}
        <AnimatePresence>
          {isPlayerOpen && (
            <motion.div
              key="full-player-screen"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute inset-0 z-40 bg-[#0a0502] flex flex-col px-6 pt-3 pb-6 overflow-hidden"
            >
              {/* Animated Background Blur */}
              <div className="absolute inset-0 -z-10 bg-[#0a0502] overflow-hidden pointer-events-none">
                <div
                  style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
                  className="absolute inset-[-80px] bg-cover bg-center blur-[70px] opacity-30 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#0a0502]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between py-2 shrink-0">
                <button
                  onClick={() => {
                    setIsQueueOpen(false);
                    setIsPlayerOpen(false);
                  }}
                  className="w-10 h-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors text-white/80 hover:text-white"
                  aria-label="Minimize Player"
                >
                  <ChevronDown size={22} />
                </button>
                <div className="text-center min-w-0 px-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 font-mono">
                    Playing from Album
                  </p>
                  <p className="text-xs font-semibold text-white/90 truncate">{currentTrack.album}</p>
                </div>
                <button
                  onClick={() => setIsQueueOpen((prev) => !prev)}
                  className={`w-10 h-10 border rounded-full flex items-center justify-center transition-colors ${
                    isQueueOpen
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label="Toggle Queue"
                  title="Up Next Queue"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Center Stage: Album Art OR Queue Drawer */}
              <div className="flex-1 flex flex-col items-center justify-center my-2 min-h-0 relative">
                <AnimatePresence mode="wait">
                  {isQueueOpen ? (
                    <motion.div
                      key="queue-view"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="w-full h-full max-h-[340px] bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col overflow-hidden backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 shrink-0">
                        <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                          Up Next in Queue
                        </span>
                        <button
                          onClick={() => setIsQueueOpen(false)}
                          className="text-xs text-brand font-semibold hover:underline"
                        >
                          Done
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                        {MOCK_TRACKS.map((track, idx) => {
                          const isCurrent = idx === currentTrackIndex;
                          return (
                            <div
                              key={track.id}
                              onClick={() => selectTrack(idx)}
                              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                                isCurrent ? 'bg-brand/20 border border-brand/40' : 'hover:bg-white/10'
                              }`}
                            >
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs font-semibold truncate ${
                                    isCurrent ? 'text-brand' : 'text-white'
                                  }`}
                                >
                                  {track.title}
                                </p>
                                <p className="text-[11px] text-white/50 truncate">{track.artist}</p>
                              </div>
                              {isCurrent && (
                                <span className="text-[10px] font-mono text-brand font-bold px-2">
                                  PLAYING
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="art-view"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="w-full flex flex-col items-center justify-center min-h-0"
                    >
                      <div className="relative w-full max-w-[240px] sm:max-w-[270px] aspect-square rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.65)] overflow-hidden border border-white/10 shrink">
                        <img
                          src={currentTrack.coverUrl}
                          alt={currentTrack.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)] pointer-events-none" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Track Title & Like Button */}
              <div className="w-full flex items-center justify-between gap-4 my-3 shrink-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl sm:text-[28px] font-serif text-white mb-1 truncate tracking-tight">
                    {currentTrack.title}
                  </h2>
                  <p className="text-white/50 text-xs uppercase tracking-widest font-mono truncate">
                    {currentTrack.artist} — {currentTrack.album}
                  </p>
                </div>
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className={`p-2.5 rounded-full border transition-all shrink-0 ${
                    isCurrentLiked
                      ? 'text-brand bg-brand/10 border-brand/30 scale-105'
                      : 'text-white/40 bg-white/5 border-white/10 hover:text-white'
                  }`}
                  aria-label="Toggle Favorite"
                >
                  <Heart size={22} fill={isCurrentLiked ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Controls Section */}
              <div className="w-full space-y-5 pt-1 shrink-0">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={effectiveDuration}
                    step="0.1"
                    value={Math.min(progress, effectiveDuration)}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand"
                    style={{
                      background: `linear-gradient(to right, #ff4e00 ${progressPercentage}%, rgba(255,255,255,0.12) ${progressPercentage}%)`,
                      boxShadow: `0 0 12px rgba(255, 78, 0, ${(progressPercentage / 100) * 0.45})`,
                    }}
                  />
                  <div className="flex justify-between text-[11px] font-mono text-white/40 uppercase tracking-widest">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(effectiveDuration)}</span>
                  </div>
                </div>

                {/* Main Playback Controls */}
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`p-2.5 rounded-full transition-colors relative ${
                      isShuffle ? 'text-brand bg-brand/10' : 'text-white/60 hover:text-white'
                    }`}
                    title="Shuffle"
                    aria-label="Toggle Shuffle"
                  >
                    <Shuffle size={19} />
                  </button>

                  <div className="flex items-center gap-7">
                    <button
                      onClick={prevTrack}
                      className="p-2 text-white hover:scale-110 active:scale-95 transition-transform"
                      aria-label="Previous Track"
                    >
                      <SkipBack size={30} fill="currentColor" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-90 transition-transform shadow-[0_10px_25px_rgba(255,255,255,0.2)]"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause size={28} fill="currentColor" />
                      ) : (
                        <Play size={28} className="ml-1" fill="currentColor" />
                      )}
                    </button>
                    <button
                      onClick={nextTrack}
                      className="p-2 text-white hover:scale-110 active:scale-95 transition-transform"
                      aria-label="Next Track"
                    >
                      <SkipForward size={30} fill="currentColor" />
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      setRepeatMode((prev) =>
                        prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
                      )
                    }
                    className={`p-2.5 rounded-full transition-colors relative ${
                      repeatMode !== 'none'
                        ? 'text-brand bg-brand/10'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title={`Repeat: ${repeatMode}`}
                    aria-label="Toggle Repeat"
                  >
                    <Repeat size={19} />
                    {repeatMode === 'one' && (
                      <span className="absolute top-1 right-1 text-[8px] font-bold bg-brand text-white w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        1
                      </span>
                    )}
                  </button>
                </div>

                {/* Footer Controls (Volume, Equalizer, Queue) */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2.5 flex-1 max-w-[170px]">
                    <button
                      onClick={() => {
                        setIsVolumeOpen((prev) => !prev);
                      }}
                      onDoubleClick={toggleMute}
                      className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                      title="Volume (click to toggle slider, double-click to mute)"
                      aria-label="Toggle Mute or Volume"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={19} className="text-brand" /> : <Volume2 size={19} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className={`w-full h-1 bg-white/15 rounded-full appearance-none cursor-pointer accent-white transition-opacity ${
                        isVolumeOpen ? 'opacity-100' : 'opacity-75 hover:opacity-100'
                      }`}
                      style={{
                        background: `linear-gradient(to right, #ffffff ${
                          (isMuted ? 0 : volume) * 100
                        }%, rgba(255,255,255,0.15) ${(isMuted ? 0 : volume) * 100}%)`,
                      }}
                      aria-label="Volume Slider"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEqualizerOpen(true)}
                      className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 text-xs font-medium border ${
                        isEqualizerEnabled
                          ? 'bg-brand/15 text-brand border-brand/30 hover:bg-brand/25'
                          : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                      title="Equalizer & Sound Effects"
                      aria-label="Open Equalizer"
                    >
                      <Sliders size={15} />
                      <span>EQ</span>
                      {isEqualizerEnabled && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                      )}
                    </button>

                    <button
                      onClick={() => setIsQueueOpen((prev) => !prev)}
                      className={`p-2 rounded-full transition-colors border ${
                        isQueueOpen
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                      title="Up Next Queue"
                      aria-label="View Queue"
                    >
                      <ListMusic size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Equalizer Settings View */}
        <EqualizerModal
          isOpen={isEqualizerOpen}
          onClose={() => setIsEqualizerOpen(false)}
          isEnabled={isEqualizerEnabled}
          setIsEnabled={setIsEqualizerEnabled}
          bands={eqBands}
          setBands={setEqBands}
          bassBoost={bassBoost}
          setBassBoost={setBassBoost}
          virtualizer={virtualizer}
          setVirtualizer={setVirtualizer}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          isPlaying={isPlaying}
        />

        {/* Bottom Tab Navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0a0502]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around z-20 px-6">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors ${
              activeTab === 'home' ? 'text-brand' : 'text-white/45 hover:text-white/80'
            }`}
          >
            <Home size={22} />
            <span className="text-[10px] font-semibold tracking-wide">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors ${
              activeTab === 'search' ? 'text-brand' : 'text-white/45 hover:text-white/80'
            }`}
          >
            <Search size={22} />
            <span className="text-[10px] font-semibold tracking-wide">Search</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors ${
              activeTab === 'library' ? 'text-brand' : 'text-white/45 hover:text-white/80'
            }`}
          >
            <Library size={22} />
            <span className="text-[10px] font-semibold tracking-wide">Library</span>
          </button>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={currentTrack.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleTrackEnded}
        />
      </div>
    </div>
  );
}
