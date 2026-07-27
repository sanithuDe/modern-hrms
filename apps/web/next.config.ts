import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webDirectory = path.dirname(currentFile);

const nextConfig: NextConfig = {
  turbopack: {
    /*
     * apps/web -> apps -> hr-platform
     *
     * The workspace-level node_modules folder,
     * including Next.js, is available from here.
     */
    root: path.resolve(webDirectory, "../.."),
  },
};

export default nextConfig;