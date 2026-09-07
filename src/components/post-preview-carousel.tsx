import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { PostCard } from "@/components/post-card";
import type { PublicPost } from "@/lib/cms/types";

export function PostPreviewCarousel({ posts }: { posts: PublicPost[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);

  useEffect(() => {
    if (posts.length < 2 || paused || hovered || focused || touching) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      const element = track.current;
      if (!element || document.hidden || reducedMotion.matches) return;
      const maxScroll = element.scrollWidth - element.clientWidth;
      if (maxScroll <= 1) return;
      const first = element.children[0] as HTMLElement | undefined;
      const second = element.children[1] as HTMLElement | undefined;
      const step = first && second ? second.offsetLeft - first.offsetLeft : element.clientWidth;
      element.scrollTo({
        left:
          element.scrollLeft >= maxScroll - 2 ? 0 : Math.min(element.scrollLeft + step, maxScroll),
        behavior: "smooth",
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [posts.length, paused, hovered, focused, touching]);

  if (posts.length === 0) return null;

  function scroll(direction: number) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <section
      className="mt-12"
      aria-labelledby="post-previews-title"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onTouchStart={() => setTouching(true)}
      onTouchEnd={() => setTouching(false)}
      onTouchCancel={() => setTouching(false)}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="post-previews-title" className="font-serif text-2xl text-white">
          À découvrir
        </h2>
        {posts.length > 1 ? (
          <div className="flex gap-2">
            <button
              type="button"
              aria-label={
                paused ? "Reprendre le défilement automatique" : "Mettre le défilement en pause"
              }
              aria-controls="post-previews"
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-gold-400 hover:bg-white/5"
            >
              {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            <button
              type="button"
              aria-label="Articles précédents"
              aria-controls="post-previews"
              onClick={() => scroll(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-gold-400 hover:bg-white/5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Articles suivants"
              aria-controls="post-previews"
              onClick={() => scroll(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-gold-400 hover:bg-white/5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </div>
      <div
        ref={track}
        id="post-previews"
        tabIndex={0}
        aria-label="Aperçus des articles"
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 focus-visible:outline-2 focus-visible:outline-gold-400"
      >
        {posts.map((post) => (
          <div
            key={post.id}
            className="grid w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
          >
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </section>
  );
}
