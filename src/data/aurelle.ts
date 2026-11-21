// The AURELLE film: Zhinuo's finished commercial (supplied 2026-11-20). The page itself is the case study in
// src/data/case-studies/aurelle.ts.
//
// THE FILM: public/video/aurelle-commercial.mp4 is the original master remuxed without
// re-encoding (AVFoundation passthrough, "optimise for network use"): the H.264 / AAC
// streams are byte-for-byte the master's; only the MP4 index moved to the front, so a
// browser can start playing before the whole file arrives. 1920 × 1080, 0:59.9, 85.2 MB,
// H.264 High@4.0 ~11.2 Mbps, AAC stereo ~187 kbps. The master itself stays untouched.
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
