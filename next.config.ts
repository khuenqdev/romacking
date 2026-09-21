import type { NextConfig } from "next";

// Replace 'romacking' with your exact GitHub repository name
const repoName = 'romacking';
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGithubActions ? `/${repoName}` : '';

const nextConfig: NextConfig = {
  output: 'export', // Tells Next.js to build a static HTML site
  basePath: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;