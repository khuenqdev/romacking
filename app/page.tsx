import { getGames } from '@/utils/games';
import GameList from '@/app/components/GameList';

export default function Home() {
  const games = getGames();

  return (
    <main className="min-h-screen bg-gray-950 p-6 md:p-12 selection:bg-purple-500 selection:text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 tracking-tight">
            Romacking
          </h1>
          <p className="text-gray-400 text-lg">Your Web-Based Retro Arcade Made by Khuê</p>
        </header>

        <GameList games={games} />
      </div>
    </main>
  );
}