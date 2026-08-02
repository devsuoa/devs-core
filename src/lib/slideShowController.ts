import { useEffect } from "react";
import { useState } from "react";

const SLIDES = [
  "/home/slideshow/7.png",
  "/home/slideshow/1.png",
  "/home/slideshow/2.png",
  "/home/slideshow/3.png",
  "/home/slideshow/4.png",
  "/home/slideshow/5.png",
  "/home/slideshow/6.png",
];

export function useSlideShowController() {
  const [index, setIndex] = useState(0);
  const intervalMs = 3000; // interval to change slides

  const next = () => {
    setIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const prev = () => {
    setIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(next, intervalMs);
    return () => clearInterval(interval);
  }, [paused, intervalMs]);

  return {
    slide: SLIDES[index],
    index,
    total: SLIDES.length,
    next,
    prev,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
  };
}
