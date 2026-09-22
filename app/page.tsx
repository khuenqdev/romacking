import { getGames } from '@/utils/games';
import GameList from '@/app/components/GameList';

export default function Home() {
  const games = getGames();

  return (
    <main className="min-h-screen bg-gray-950 p-6 md:p-12 selection:bg-purple-500 selection:text-white">
      <div className="max-w-7xl mx-auto">
        <GameList games={games} />
      </div>
    </main>
  );
}