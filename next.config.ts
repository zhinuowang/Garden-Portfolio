import type { NextConfig } from "next";
import path from "node:path";

// A fully static site for Cloudflare Pages (Free plan): `next build` writes plain HTML, CSS, JS and the public/
// assets to out/, with no server. Images are served exactly as supplied (no on-the-fly optimisation, which needs a
// server). The AURELLE master film lives in media/master/, outside public/, so it never reaches out/; out/ holds
// only the web version (under Cloudflare Pages' 25 MiB per-file limit).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
