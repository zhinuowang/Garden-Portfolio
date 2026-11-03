import Image from "next/image";
import type { ProjectImage } from "@/data/projects";

// Real project image at its original aspect ratio, or a neutral placeholder.
// Never substitute decorative art for a missing project asset.
export function AssetPlaceholder({ ratio = "16 / 10", className = "" }: { ratio?: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border-2 border-dashed border-ink-soft/30 bg-[#efe9dc] p-6 text-center ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <p className="max-w-[22ch] text-sm font-medium text-ink-soft">Original project asset to be provided.</p>
    </div>
  );
}

export default function ProjectMedia({
  image,
  sizes,
  priority,
  className = "",
}: {
  image: ProjectImage | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!image) return <AssetPlaceholder className={className} />;
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      className={`h-auto w-full rounded-xl bg-[#efe9dc] ${className}`}
    />
  );
}
