import fs from 'fs';
import path from 'path';

export type LocalizedString = {
    en?: string;
    vi?: string;
};

export type GameMetadata = {
    name?: LocalizedString;
    description?: LocalizedString;
};

export type Game = {
    id: string;
    title: string;
    metadata: GameMetadata | null;
    system: string;
    romUrl: string;
    coverUrl: string | null;
    fileName: string;
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

                if (ROM_EXTS.includes(ext)) {
                    const baseName = path.basename(file, ext);

                    // Fallback title derived from filename
                    const title = baseName
                        .replace(/[-_]/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                    // 1. Find matching cover art
                    let coverUrl = null;
                    const matchingImg = files.find((f) => {
                        const fBase = path.basename(f, path.extname(f));
                        const fExt = path.extname(f).toLowerCase();
                        return fBase.toLowerCase() === baseName.toLowerCase() && IMG_EXTS.includes(fExt);
                    });

                    if (matchingImg) {
                        coverUrl = `roms/${system}/${matchingImg}`;
                    }

                    // 2. Find matching metadata JSON file
                    let metadata: GameMetadata | null = null;
                    const matchingJson = files.find((f) => {
                        const fBase = path.basename(f, path.extname(f));
                        return fBase.toLowerCase() === baseName.toLowerCase() && path.extname(f).toLowerCase() === '.json';
                    });

                    if (matchingJson) {
                        try {
                            const jsonContent = fs.readFileSync(path.join(systemDir, matchingJson), 'utf-8');
                            metadata = JSON.parse(jsonContent);
                        } catch (err) {
                            console.error(`Failed to parse metadata for ${file}:`, err);
                        }
                    }

                    games.push({
                        id: `${system}-${baseName}`,
                        title,
                        metadata,
                        system,
                        romUrl: `roms/${system}/${file}`,
                        coverUrl,
                        fileName: file,
                    });
                }
            });
        }
    });

    return games;
}