/**
 * ,ock data + helpers for the project showcase page.
 *
 * The page features a single project at a time, the most recent hackathon
 * build winner rather than a grid. There is no `projects` table yet, so this module
 * stands in for the Supabase fetch the other controllers do. Keeping the hook
 * signature close to `useEvents` means swapping in a real query later is a
 * change to this file only.
 */

export type ProjectPhoto = {
  /** Image path. Placeholder art until real photos land in /public/projects */
  src: string;

  /** Image alt text */
  alt: string;

  /**
   * Caption shown while this photo is the active slide.
   * Keep to roughly one line so the caption bar does not jump in height.
   */
  caption: string;
};

export type FeaturedProject = {
  /** Stable id, used for the `#project-<id>` anchor */
  id: string;

  /** Project name */
  title: string;

  /**
   * Where it was built
   * @example "DEVS x AUT Hackathon 2026"
   */
  event: string;

  /**
   * When it was built
   * @example "March 2026"
   */
  period: string;

  /**
   * Optional placing or prize, shown as a chip on the cover
   * @example "1st Place"
   */
  award?: string;

  /** Cover image for the front face */
  coverImage: string;

  /** Cover image alt text */
  coverAlt: string;

  /** Everyone who worked on it, shown on the back face */
  team: string[];

  /** Technologies used, rendered as a wrapped list of chips */
  stack: string[];

  /** The write-up. Scrolls within its own column on the back face. */
  description: string;

  /** Optional outbound link shown as the primary action */
  url?: string;

  /** Gallery shown on the back face, one caption per photo */
  photos: ProjectPhoto[];
};

/**
 * Stand-in gallery, reusing the existing home-page slideshow photos.
 * Replace `src` values once real hackathon photos are added.
 */
export const FEATURED_PROJECT: FeaturedProject = {
  id: "hackathon-2026",
  title: "Study Buddy",
  event: "DEVS Hackathon 2026",
  period: "March 2026",
  award: "1st Place",
  coverImage: "/home/slideshow/7.png",
  coverAlt: "The winning team presenting Study Buddy at the DEVS Hackathon",
  team: ["terrence wu", "terrence wu", "terrence wu", "terrence wu"],
  stack: ["React", "TypeScript", "FastAPI", "PostgreSQL", "Claude API", "67"],
  description:
    "Built in 36 hours, Study Buddy turns a folder of lecture slides into a graded practice quiz. Upload a PDF and it extracts the key concepts, writes questions at three difficulty levels, and explains every wrong answer rather than just marking it.\n\nThe team started with a plain retrieval prototype on the Friday night, scrapped it on Saturday morning when the recall proved too noisy on maths-heavy decks, and rebuilt around per-slide chunking with a scoring pass. That rewrite is what won it: the judges called out the explanations as the strongest part of the demo.\n\nIt is now being trialled with a first-year cohort, with spaced repetition and shared decks planned for the next iteration.",
  url: "https://github.com/devsuoa",
  photos: [
    {
      src: "/home/slideshow/7.png",
      alt: "Team presenting on stage",
      caption: "desc 1",
    },
    {
      src: "/home/slideshow/1.png",
      alt: "Opening ceremony",
      caption: "desc 2",
    },
    {
      src: "/home/slideshow/2.png",
      alt: "Team working at a table",
      caption: "desc 3",
    },
    {
      src: "/home/slideshow/3.png",
      alt: "Whiteboard covered in diagrams",
      caption: "desc 4",
    },
    {
      src: "/home/slideshow/4.png",
      alt: "Mentor talking with a team",
      caption: "desc 5",
    },
    {
      src: "/home/slideshow/5.png",
      alt: "Late night at the venue",
      caption: "desc 67",
    },
    {
      src: "/home/slideshow/6.png",
      alt: "Team celebrating with the prize",
      caption: "desc 67",
    },
  ],
};

/**
 * Stands in for a Supabase-backed hook. Returns the mock project synchronously
 * so the page can already handle the loading/empty branches it will need later.
 */
export const useFeaturedProject = () => {
  return {
    project: FEATURED_PROJECT as FeaturedProject | null,
    loading: false,
    error: null as string | null,
  };
};
