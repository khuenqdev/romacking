'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Game } from '@/utils/games';

type Language = 'vi' | 'en';

const UI_TEXT = {
    vi: {
        title: 'Romacking',
        subtitle: 'Máy chơi game Retro trên nền Web của bạn',
        play: 'Chơi ngay',
        download: 'Tải ROM',
        share: 'Chia sẻ',
        copied: 'Đã sao chép liên kết!',
        close: 'Đóng trò chơi',
        noGames: 'Không tìm thấy trò chơi nào trong thư mục public/roms.',
        descLabel: 'Mô tả:',
        menuHint: 'Menu điều khiển',
    },
    en: {
        title: 'Romacking',
        subtitle: 'Your Web-Based Retro Arcade',
        play: 'Play Now',
        download: 'Download ROM',
        share: 'Share',
        copied: 'Link copied!',
        close: 'Close Game',
        noGames: 'No games found in public/roms directory.',
        descLabel: 'Description:',
        menuHint: 'Game Menu',
    },
};

export default function GameList({ games }: { games: Game[] }) {
    const [lang, setLang] = useState<Language>('vi'); // Default language: Vietnamese
    const [playing, setPlaying] = useState<Game | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Auto-hide header state & timer
    const [headerVisible, setHeaderVisible] = useState(true);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    const t = UI_TEXT[lang];

    // Helper to start/reset the 3-second auto-hide timer
    const resetHideTimer = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setHeaderVisible(false);
        }, 3000); // Automatically hides after 3 seconds
    };

    const showHeader = () => {
        setHeaderVisible(true);
        resetHideTimer();
    };

    // Trigger auto-hide whenever a new game starts
    useEffect(() => {
        if (playing) {
            setHeaderVisible(true);
            resetHideTimer();
        }
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [playing]);

    // Auto-launch game if "?play=<gameId>" is in the URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const playId = params.get('play');
        if (playId) {
            const matched = games.find((g) => g.id === playId);
            if (matched) {
                setPlaying(matched);
            }
        }
    }, [games]);

    // Lock page scrolling when emulator modal is open
    useEffect(() => {
        if (playing) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [playing]);

    // Copy shareable link to clipboard
    const handleShare = (e: React.MouseEvent, game: Game) => {
        e.stopPropagation();
        const url = new URL(window.location.href);
        url.searchParams.set('play', game.id);

        navigator.clipboard.writeText(url.toString()).then(() => {
            setCopiedId(game.id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    // Close emulator modal and clean up URL
    const handleClose = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setPlaying(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('play');
        window.history.replaceState({}, '', url.toString());
    };

    const getGameName = (game: Game): string => {
        if (game.metadata?.name) {
            return game.metadata.name[lang] || game.metadata.name.en || game.title;
        }
        return game.title;
    };

    const getGameDescription = (game: Game): string | null => {
        if (game.metadata?.description) {
            return game.metadata.description[lang] || game.metadata.description.en || null;
        }
        return null;
    };

    // Memoize the emulator URL so it NEVER reloads during state changes/re-renders
    const iframeSrc = useMemo(() => {
        if (!playing) return '';
        return `emulator.html?core=${playing.system}&rom=${encodeURIComponent(playing.romUrl)}`;
    }, [playing?.id]);

    return (
        <div>
            {/* Header & Language Switcher */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-tight">
                        {t.title}
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base mt-1">{t.subtitle}</p>
                </div>

                {/* Language Selector */}
                <div className="flex items-center self-start md:self-auto bg-gray-900 p-1 rounded-xl border border-gray-800 shadow-inner">
                    <button
                        onClick={() => setLang('vi')}
                        className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition ${lang === 'vi'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        🇻🇳 Tiếng Việt
                    </button>
                    <button
                        onClick={() => setLang('en')}
                        className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition ${lang === 'en'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        🇬🇧 English
                    </button>
                </div>
            </header>

            {/* Game Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {games.map((game) => {
                    const gameName = getGameName(game);
                    const gameDesc = getGameDescription(game);

                    return (
                        <div
                            key={game.id}
                            onClick={() => setPlaying(game)}
                            className="group relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg cursor-pointer transform transition duration-300 hover:scale-[1.03] hover:shadow-2xl hover:ring-2 hover:ring-purple-500 flex flex-col border border-gray-800"
                        >
                            {/* Cover Art Container */}
                            <div className="aspect-[3/4] bg-gray-950 flex items-center justify-center relative overflow-hidden">
                                {game.coverUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={game.coverUrl}
                                        alt={gameName}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <span className="text-gray-700 font-bold text-2xl tracking-widest">
                                        {game.system.toUpperCase()}
                                    </span>
                                )}

                                {/* System Badge */}
                                <div className="absolute top-2 right-2 bg-black/75 px-2.5 py-1 rounded-md text-[10px] text-purple-300 font-extrabold uppercase tracking-wider backdrop-blur-md border border-purple-500/20 z-10">
                                    {game.system}
                                </div>

                                {/* Hover Description Overlay */}
                                {gameDesc && (
                                    <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm p-4 text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center pointer-events-none z-20">
                                        <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1.5">
                                            {t.descLabel}
                                        </span>
                                        <p className="line-clamp-6 leading-relaxed text-gray-300">{gameDesc}</p>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer & Action Buttons */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between bg-gray-900/80">
                                <h3 className="text-white font-bold text-sm truncate mb-3" title={gameName}>
                                    {gameName}
                                </h3>

                                <div className="flex items-center gap-2 pt-2 border-t border-gray-800/80">
                                    {/* Download ROM */}
                                    <a
                                        href={game.romUrl}
                                        download={game.fileName}
                                        onClick={(e) => e.stopPropagation()}
                                        title={t.download}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-200 text-xs py-1.5 px-2 rounded-lg font-medium transition"
                                    >
                                        <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>{t.download}</span>
                                    </a>

                                    {/* Share Link */}
                                    <button
                                        onClick={(e) => handleShare(e, game)}
                                        title={t.share}
                                        className="flex items-center justify-center bg-gray-800 hover:bg-purple-900/40 hover:text-purple-300 active:bg-gray-600 text-gray-400 p-1.5 rounded-lg text-xs transition"
                                    >
                                        {copiedId === game.id ? (
                                            <span className="text-green-400 font-bold px-1 text-[11px] animate-pulse">
                                                ✓ {t.copied}
                                            </span>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {games.length === 0 && (
                    <p className="text-gray-400 col-span-full text-center py-16 text-sm">{t.noGames}</p>
                )}
            </div>

            {/* Full-Screen Immersive Emulator Modal */}
            {playing && (
                <div className="fixed inset-0 bg-black z-50 overflow-hidden">
                    {/* Top Edge Hover Trigger (Moving mouse to the top edge restores header) */}
                    <div
                        onMouseEnter={showHeader}
                        className="absolute top-0 left-0 right-0 h-4 z-40"
                    />

                    {/* Floating Pull-Down Tab (Appears when header is hidden so users on mobile/desktop can tap it) */}
                    <button
                        onClick={showHeader}
                        className={`absolute top-0 left-1/2 -translate-x-1/2 z-40 bg-gray-950/80 hover:bg-gray-900 text-gray-400 hover:text-purple-300 px-4 py-1 rounded-b-xl text-xs font-semibold border-b border-x border-gray-800 backdrop-blur-md transition-all duration-500 shadow-2xl flex items-center gap-2 ${headerVisible
                            ? '-translate-y-full opacity-0 pointer-events-none'
                            : 'translate-y-0 opacity-100'
                            }`}
                    >
                        <span>{getGameName(playing)}</span>
                        <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Auto-Hiding Top Navigation Header */}
                    <div
                        onMouseEnter={() => {
                            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                        }}
                        onMouseLeave={resetHideTimer}
                        className={`absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-3 bg-gray-950/90 backdrop-blur-md text-white border-b border-gray-800 shadow-2xl transition-all duration-500 transform ${headerVisible
                            ? 'translate-y-0 opacity-100'
                            : '-translate-y-full opacity-0 pointer-events-none'
                            }`}
                    >
                        <h2 className="font-bold text-lg md:text-xl tracking-wide text-purple-200 truncate pr-4">
                            {getGameName(playing)}
                        </h2>
                        <button
                            className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white px-4 py-1.5 rounded-lg font-semibold text-sm transition shadow-lg shadow-red-600/20 flex-shrink-0"
                            onClick={handleClose}
                        >
                            {t.close}
                        </button>
                    </div>

                    {/* The Game Iframe (Always 100% full screen) */}
                    <iframe
                        src={iframeSrc}
                        className="w-full h-full border-none block"
                        allow="gamepad; autoplay; fullscreen"
                        scrolling="no"
                    ></iframe>
                </div>
            )}
        </div>
    );
}