export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number; // in seconds
  audioUrl: string;
}

export const MOCK_TRACKS: Track[] = [
  {
    id: "1",
    title: "Neon Dreams",
    artist: "Synthwave City",
    album: "Retro Nights",
    coverUrl: "https://picsum.photos/seed/music1/400/400",
    duration: 185,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "2",
    title: "Midnight Drive",
    artist: "The Velocity",
    album: "Fast Tracks",
    coverUrl: "https://picsum.photos/seed/music2/400/400",
    duration: 212,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "3",
    title: "Electric Pulse",
    artist: "Cyber Echo",
    album: "Digital Heart",
    coverUrl: "https://picsum.photos/seed/music3/400/400",
    duration: 198,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "4",
    title: "After Hours",
    artist: "Lofi Chill",
    album: "Study Beats",
    coverUrl: "https://picsum.photos/seed/music4/400/400",
    duration: 154,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "5",
    title: "Skyline",
    artist: "Aero Breeze",
    album: "Cloud Walker",
    coverUrl: "https://picsum.photos/seed/music5/400/400",
    duration: 245,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
];
