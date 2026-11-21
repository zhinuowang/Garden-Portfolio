// The AURELLE film: Zhinuo's finished commercial (supplied 2026-11-20). The page itself is the case study in
// src/data/case-studies/aurelle.ts.
//
// THE FILM, as served: public/video/aurelle-commercial.mp4 is a web encode of Zhinuo's export (Desktop/AURELLE AD.mp4),
// made to fit Cloudflare Pages' 25 MiB per-file limit:
// - Video: H.264 High@4.0, two-pass, ~2.75 Mbps, B-frames, a keyframe every 2 s, fast start.
// - Size: 1920 × 1080 at 30 fps, exactly 1797 frames and 59.9 s, the same as the source.
// - Audio: the original AAC, copied untouched.
// - Result: 21.9 MB (20.91 MiB). Against the source: mean PSNR 44.9 dB, every sampled frame SSIM ≥ 0.975.
// THE MASTER: media/master/aurelle-commercial-master.mp4 (85.2 MB, a lossless remux of the export) sits outside
// public/, so it is kept in the repository but never deployed. The Desktop export itself is untouched.
// THE POSTER: a real frame of the film (59.0 s, the closing product shot), not a new image.

export const aurelle = {
  video: {
    src: "/video/aurelle-commercial.mp4",
    type: 'video/mp4; codecs="avc1.640028, mp4a.40.2"',
    width: 1920,
    height: 1080,
    poster: { src: "/video/aurelle-poster-1920.webp", small: "/video/aurelle-poster-1280.webp" },
    source: "Desktop/AURELLE AD.mp4",
  },
};
