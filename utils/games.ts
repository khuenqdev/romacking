import fs from 'fs';
import path from 'path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export type Game = {
    id: string;
    title: string;
    system: string;
    romUrl: string;
    coverUrl: string | null;
};

const SYSTEMS = ['nes', 'gb', 'gbc', 'gba'];
const ROM_EXTS = ['.nes', '.gb', '.gbc', '.gba'];
const IMG_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

export function getGames(): Game[] {
    const games: Game[] = [];
    const romsDir = path.join(process.cwd(), 'public', 'roms');

    if (!fs.existsSync(romsDir)) return games;

    SYSTEMS.forEach((system) => {
        const systemDir = path.join(romsDir, system);
        if (fs.existsSync(systemDir)) {
            const files = fs.readdirSync(systemDir);

            files.forEach((file) => {
                const ext = path.extname(file).toLowerCase();

                // If it's a ROM file
                if (ROM_EXTS.includes(ext)) {
                    const baseName = path.basename(file, ext);

                    // Format title (e.g., "super_mario-bros" -> "Super Mario Bros")
                    const title = baseName
                        .replace(/[-_]/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                    // Look for matching cover art
                    let coverUrl = null;
                    const matchingImg = files.find(f => {
                        const fBase = path.basename(f, path.extname(f));
                        const fExt = path.extname(f).toLowerCase();
                        return fBase === baseName && IMG_EXTS.includes(fExt);
                    });

                    if (matchingImg) {
                        // FIX: Removed leading slash so it becomes a relative path
                        coverUrl = `roms/${system}/${matchingImg}`;
                    }

                    games.push({
                        id: `${system}-${baseName}`,
                        title,
                        system,
                        // FIX: Removed leading slash so it becomes a relative path
                        romUrl: `roms/${system}/${file}`,
                        coverUrl,
                    });
                }
            });
        }
    });

    return games;
}