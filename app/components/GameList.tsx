'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Game } from '@/utils/games';

type Language = 'vi' | 'en';

const UI_TEXT = {
    vi: {
        title: 'Romacking',
        subtitle: 'Kho trò chơi Retro trên nền Web của bạn',
        searchPlaceholder: 'Tìm kiếm trò chơi (tên tiếng Việt, tiếng Anh, mô tả)...',
        allSystems: 'Tất cả hệ máy',
        gamesCount: 'trò chơi',
        play: 'Chơi ngay',
        download: 'Tải ROM',
        share: 'Chia sẻ',
        copied: 'Đã chép link!',
        close: 'Đóng trò chơi',
        noGames: 'Không tìm thấy trò chơi nào phù hợp.',
        clearSearch: 'Xóa tìm kiếm',
        descLabel: 'Mô tả:',
    },
    en: {
        title: 'Romacking',
        subtitle: 'Your Web-Based Retro Arcade',
        searchPlaceholder: 'Search games (English, Vietnamese, description)...',
        allSystems: 'All Systems',
        gamesCount: 'games',
        play: 'Play Now',
        download: 'Download ROM',
        share: 'Share',
        copied: 'Link copied!',
        close: 'Close Game',
        noGames: 'No games found matching your search.',
        clearSearch: 'Clear search',
        descLabel: 'Description:',
    },
};

const SYSTEMS_CONFIG: Record<
    string,
    { name: string; tag: string; badgeColor: string; headerColor: string; icon: string }
> = {
    nes: {
        name: 'Nintendo Entertainment System',
        tag: 'NES',
        badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
        headerColor: 'from-red-500 to-rose-400',
        icon: '🎮',
    },
    gb: {
        name: 'Game Boy',
        tag: 'GB',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        headerColor: 'from-emerald-400 to-teal-300',
        icon: '🕹️',
    },
    gbc: {
        name: 'Game Boy Color',
        tag: 'GBC',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        headerColor: 'from-cyan-400 to-blue-400',
        icon: '🎨',
    },
    gba: {
        name: 'Game Boy Advance',
        tag: 'GBA',
        badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        headerColor: 'from-indigo-400 to-purple-400',
        icon: '⚡',
    },
};

const ORDERED_SYSTEMS = ['nes', 'gb', 'gbc', 'gba'];

// Vietnamese accent removal helper for flexible diacritic-free searching
function normalizeSearchText(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .trim();
}

export default function GameList({ games }: { games: Game[] }) {
    const [lang, setLang] = useState<Language>('vi'); // Default: Vietnamese
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSystem, setSelectedSystem] = useState<string>('all');
    const [playing, setPlaying] = useState<Game | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Auto-hide top bar state & timer
    const [headerVisible, setHeaderVisible] = useState(true);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    const t = UI_TEXT[lang];

    const resetHideTimer = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setHeaderVisible(false);
        }, 3000);
    };

    const showHeader = () => {
        setHeaderVisible(true);
        resetHideTimer();
    };

    useEffect(() => {
        if (playing) {
            setHeaderVisible(true);
            resetHideTimer();
        }
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [playing]);

    // Handle direct share link (e.g. ?play=<id>)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const playId = params.get('play');
        if (playId) {
            const matched = games.find((g) => g.id === playId);
            if (matched) setPlaying(matched);
        }
    }, [games]);

    useEffect(() => {
        if (playing) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
    }, [playing]);

    const handleShare = (e: React.MouseEvent, game: Game) => {
        e.stopPropagation();
        const url = new URL(window.location.href);
        url.searchParams.set('play', game.id);

        navigator.clipboard.writeText(url.toString()).then(() => {
            setCopiedId(game.id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const handleClose = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setPlaying(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('play');
        window.history.replaceState({}, '', url.toString());
    };

    const getGameName = (game: Game): string => {
        return game.metadata?.name?.[lang] || game.metadata?.name?.en || game.title;
    };

    const getGameDescription = (game: Game): string | null => {
        return game.metadata?.description?.[lang] || game.metadata?.description?.en || null;
    };

    // Bilingual search matching logic
    const matchesSearch = (game: Game, rawQuery: string): boolean => {
        if (!rawQuery.trim()) return true;
        const cleanQuery = normalizeSearchText(rawQuery);

        const candidates = [
            game.title,
            game.fileName,
            game.system,
            game.metadata?.name?.vi || '',
            game.metadata?.name?.en || '',
            game.metadata?.description?.vi || '',
            game.metadata?.description?.en || '',
        ];

        return candidates.some((text) => normalizeSearchText(text).includes(cleanQuery));
    };

    // Group filtered games by system
    const groupedGames = useMemo(() => {
        const groups: Record<string, Game[]> = {};

        ORDERED_SYSTEMS.forEach((sysKey) => {
            if (selectedSystem === 'all' || selectedSystem === sysKey) {
                const sysGames = games.filter(
                    (g) => g.system.toLowerCase() === sysKey && matchesSearch(g, searchQuery)
                );
                if (sysGames.length > 0) {
                    groups[sysKey] = sysGames;
                }
            }
        });

        return groups;
    }, [games, searchQuery, selectedSystem, lang]);

    const totalFilteredCount = useMemo(() => {
        return Object.values(groupedGames).reduce((acc, list) => acc + list.length, 0);
    }, [groupedGames]);

    // Memoize static iframe source to avoid unwanted restarts
    const iframeSrc = useMemo(() => {
        if (!playing) return '';
        return `emulator.html?core=${playing.system}&rom=${encodeURIComponent(playing.romUrl)}`;
    }, [playing?.id]);

    return (
        <div>
            {/* Top Header & Language Selector */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800/80 pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 tracking-tight">
                        {t.title}
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base mt-1">{t.subtitle}</p>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center self-start md:self-auto bg-gray-900/90 p-1 rounded-xl border border-gray-800 shadow-inner">
                    <button
                        onClick={() => setLang('vi')}
                        className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition ${lang === 'vi'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        🇻🇳 Tiếng Việt
                    </button>
                    <button
                        onClick={() => setLang('en')}
                        className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition ${lang === 'en'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        🇬🇧 English
                    </button>
                </div>
            </header>

            {/* Search and System Category Navigation */}
            <div className="mb-10 space-y-4">
                {/* Search Bar */}
                <div className="relative max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full bg-gray-900/90 border border-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500 text-sm md:text-base rounded-2xl pl-12 pr-10 py-3.5 outline-none transition duration-200 backdrop-blur-md shadow-lg"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition"
                            title={t.clearSearch}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* System Category Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    {/* 'All' Tab */}
                    <button
                        onClick={() => setSelectedSystem('all')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 border ${selectedSystem === 'all'
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30'
                                : 'bg-gray-900/70 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                    >
                        <span>✨ {t.allSystems}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-black/40 text-purple-200">
                            {games.filter((g) => matchesSearch(g, searchQuery)).length}
                        </span>
                    </button>

                    {/* Individual Console Tabs */}
                    {ORDERED_SYSTEMS.map((sysKey) => {
                        const config = SYSTEMS_CONFIG[sysKey];
                        const count = games.filter(
                            (g) => g.system.toLowerCase() === sysKey && matchesSearch(g, searchQuery)
                        ).length;

                        return (
                            <button
                                key={sysKey}
                                onClick={() => setSelectedSystem(sysKey)}
                                className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 border ${selectedSystem === sysKey
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30'
                                        : 'bg-gray-900/70 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                <span>
                                    {config.icon} {config.tag}
                                </span>
                                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-black/40 text-purple-200">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Categorized Game Gallery */}
            <div className="space-y-14">
                {ORDERED_SYSTEMS.map((sysKey) => {
                    const systemGames = groupedGames[sysKey];
                    if (!systemGames || systemGames.length === 0) return null;

                    const config = SYSTEMS_CONFIG[sysKey];

                    return (
                        <section key={sysKey} className="space-y-6">
                            {/* Category Section Header */}
                            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{config.icon}</span>
                                    <div>
                                        <h2
                                            className={`text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${config.headerColor}`}
                                        >
                                            {config.name}
                                        </h2>
                                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                            {config.tag} Platform
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-900 text-gray-400 border border-gray-800">
                                    {systemGames.length} {t.gamesCount}
                                </span>
                            </div>

                            {/* Game Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {systemGames.map((game) => {
                                    const gameName = getGameName(game);
                                    const gameDesc = getGameDescription(game);

                                    return (
                                        <div
                                            key={game.id}
                                            onClick={() => setPlaying(game)}
                                            className="group relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg cursor-pointer transform transition duration-300 hover:scale-[1.03] hover:shadow-2xl hover:ring-2 hover:ring-purple-500 flex flex-col border border-gray-800/90"
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
                                                <div
                                                    className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border ${config.badgeColor} z-10`}
                                                >
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
                                                    {/* Download Button */}
                                                    <a
                                                        href={game.romUrl}
                                                        download={game.fileName}
                                                        onClick={(e) => e.stopPropagation()}
                                                        title={t.download}
                                                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-200 text-xs py-1.5 px-2 rounded-lg font-medium transition"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                            />
                                                        </svg>
                                                        <span>{t.download}</span>
                                                    </a>

                                                    {/* Share Button */}
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
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                                                />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {/* Empty State */}
                {totalFilteredCount === 0 && (
                    <div className="text-center py-20 px-4 bg-gray-900/40 rounded-3xl border border-gray-800/60 max-w-md mx-auto space-y-4">
                        <span className="text-4xl block">🔍</span>
                        <p className="text-gray-300 font-semibold">{t.noGames}</p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-bold transition shadow-lg shadow-purple-600/20"
                            >
                                {t.clearSearch}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Full-Screen Immersive Emulator Modal */}
            {playing && (
                <div className="fixed inset-0 bg-black z-50 overflow-hidden">
                    {/* Top Hover Trigger */}
                    <div onMouseEnter={showHeader} className="absolute top-0 left-0 right-0 h-4 z-40" />

                    {/* Floating Pull-Down Tab */}
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

                    {/* Auto-Hiding Header */}
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

                    {/* Game Iframe */}
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