'use client';
import { useState, useEffect } from 'react';
import { Game } from '@/utils/games';

export default function GameList({ games }: { games: Game[] }) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const [playing, setPlaying] = useState<Game | null>(null);

    // Prevent background scrolling when playing
    useEffect(() => {
        if (playing) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
    }, [playing]);

    return (
        <div>
            {/* Game Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {games.map((game) => (
                    <div
                        key={game.id}
                        onClick={() => setPlaying(game)}
                        className="bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-purple-500 flex flex-col"
                    >
                        <div className="aspect-[3/4] bg-gray-900 flex items-center justify-center relative">
                            {game.coverUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-600 font-bold text-xl">{game.system.toUpperCase()}</span>
                            )}
                            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-bold uppercase backdrop-blur-sm">
                                {game.system}
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-center">
                            <h3 className="text-white font-bold text-sm truncate">{game.title}</h3>
                        </div>
                    </div>
                ))}

                {games.length === 0 && (
                    <p className="text-gray-400 col-span-full text-center py-12">
                        No games found. Please add ROMs to your public/roms folder.
                    </p>
                )}
            </div>

            {/* Emulator Modal */}
            {playing && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col">
                    <div className="flex justify-between items-center px-6 py-4 bg-gray-950 text-white border-b border-gray-800">
                        <h2 className="font-bold text-xl tracking-wide">{playing.title}</h2>
                        <button
                            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded font-semibold transition"
                            onClick={() => setPlaying(null)}
                        >
                            Close Game
                        </button>
                    </div>
                    <div className="flex-1 w-full bg-black relative">
                        <iframe
                            src={`emulator.html?core=${playing.system}&rom=${encodeURIComponent(playing.romUrl)}`}
                            className="absolute inset-0 w-full h-full border-none block"
                            /* FIX: Removed 'autoplay' so iOS doesn't crash the WASM thread during audio init */
                            allow="gamepad; fullscreen"
                            /* FIX: Force Safari to respect dimensions */
                            scrolling="no"
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
}