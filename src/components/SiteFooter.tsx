import PaintDefs from "./garden/PaintDefs";

export default function SiteFooter() {
  return (
    <footer className="border-t border-forest/10 px-4 py-8 text-center text-sm text-ink-soft sm:px-6">
      <PaintDefs />
      <p>© {new Date().getFullYear()} Zhinuo Wang · A Garden of Ideas</p>
      <p className="mt-1 text-xs">The garden illustrations are decorative and are not project work.</p>
    </footer>
  );
}
