import { useEffect, useLayoutEffect, useRef, useState } from "react";
import teamData from "../data/team.json";

export type Member = {
  name: string;
  role?: string;
  lead?: boolean;
  /** Path relative to /public, e.g. "/team/execs/2026/alanna.jpg" */
  image?: string;
  linkedin?: string;
};

export type Section = {
  title: string;
  /** Must match a value of the Team enum in MemberIcon (sets the border colour). */
  team: string;
  /** Cards per row on small screens (2-6). */
  mobileColumns: number;
  /** Cards per row from the md breakpoint up (2-6). */
  desktopColumns: number;
  members: Member[];
};

type YearTeam = {
  teamPhoto: string | null;
  sections: Section[];
};

type YearMenuPlacement = {
  openUp: boolean;
  maxHeight: number;
};

const TEAMS = teamData.teams as Record<string, YearTeam>;
const YEARS = Object.keys(TEAMS).sort();
const DEFAULT_YEAR = teamData.defaultYear in TEAMS ? teamData.defaultYear : YEARS[YEARS.length - 1];
const FOUNDING_YEAR = "2019";
const LEAD_STAR = "/team/lead_star.png";

// gap between dropdown and edge of viewport to determine which way it drops down
const YEAR_MENU_GAP = 16;
const YEAR_MENU_MIN_HEIGHT = 120;

const pageTitle = (year: string) => {
  if (year === FOUNDING_YEAR) return "Meet The Founding Team";
  if (year === DEFAULT_YEAR) return "Meet Our Team";
  return `Meet Our ${year} Team`;
};

/** Every image the given year renders: member photos, the lead star and the team photo. */
const yearImages = (year: string) => {
  const { sections, teamPhoto } = TEAMS[year];
  const urls = new Set<string>();
  if (teamPhoto) urls.add(teamPhoto);
  for (const { members } of sections) {
    for (const { image, lead } of members) {
      if (image) urls.add(image);
      if (lead) urls.add(LEAD_STAR);
    }
  }
  return [...urls];
};

// photos stay loaded
const imageLoads = new Map<string, Promise<void>>();
const yearLoads = new Map<string, Promise<void>>();
const loadedYears = new Set<string>();

const loadImage = (url: string) => {
  let load = imageLoads.get(url);
  if (!load) {
    load = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = url;
    });
    imageLoads.set(url, load);
  }
  return load;
};

// start loading all of the photos for a year
const loadYear = (year: string) => {
  let load = yearLoads.get(year);
  if (!load) {
    load = Promise.all(yearImages(year).map(loadImage)).then(() => {
      loadedYears.add(year);
    });
    yearLoads.set(year, load);
  }
  return load;
};

/**
 * State and behaviour for the Team page: the selected year, photo loading and
 * the year dropdown.
 *
 * Only the selected year's photos are fetched up front; the rest start loading
 * when the dropdown is first opened. `ready` stays false until every photo for
 * the selected year has loaded, so a year is never shown half-populated.
 *
 * @param enabled Pass false to skip photo loading (e.g. the page is feature-flagged off).
 */
export function useTeamController(enabled = true) {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [yearLoaded, setYearLoaded] = useState(() => loadedYears.has(DEFAULT_YEAR));
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [yearMenuPlacement, setYearMenuPlacement] = useState<YearMenuPlacement | null>(null);
  const yearMenuRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLUListElement>(null);

  // Load the selected year's photos. On first visit this is the only year fetched.
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setYearLoaded(loadedYears.has(year));
    loadYear(year).then(() => {
      if (!cancelled) setYearLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, year]);

  // start fetching all other years when dropdown opens
  useEffect(() => {
    if (enabled && yearMenuOpen) YEARS.forEach(loadYear);
  }, [enabled, yearMenuOpen]);

  // Open the year dropdown upwards when it doesn't fit below the trigger,
  // and cap its height to the space available so it never leaves the viewport.
  useLayoutEffect(() => {
    if (!yearMenuOpen) {
      setYearMenuPlacement(null);
      return;
    }

    const place = () => {
      const trigger = yearMenuRef.current;
      const list = yearListRef.current;
      if (!trigger || !list) return;

      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - YEAR_MENU_GAP;
      const spaceAbove = rect.top - YEAR_MENU_GAP;
      const openUp = list.scrollHeight > spaceBelow && spaceAbove > spaceBelow;

      setYearMenuPlacement({
        openUp,
        maxHeight: Math.max(openUp ? spaceAbove : spaceBelow, YEAR_MENU_MIN_HEIGHT),
      });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [yearMenuOpen]);

  // Close the year dropdown on outside click or Escape.
  useEffect(() => {
    if (!yearMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!yearMenuRef.current?.contains(e.target as Node)) setYearMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setYearMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [yearMenuOpen]);

  const selectYear = (next: string) => {
    setYearMenuOpen(false);
    if (next === year) return;
    setYear(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { sections, teamPhoto } = TEAMS[year];

  return {
    year,
    years: YEARS,
    title: pageTitle(year),
    sections,
    teamPhoto,
    // `yearLoaded` lags a render behind `year`, so also check the cache directly.
    ready: yearLoaded && loadedYears.has(year),
    selectYear,
    yearMenuOpen,
    toggleYearMenu: () => setYearMenuOpen((open) => !open),
    yearMenuPlacement,
    /** Attach to the element wrapping the dropdown trigger and list. */
    yearMenuRef,
    /** Attach to the dropdown list. */
    yearListRef,
  };
}
