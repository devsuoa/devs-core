import React from "react";
import Footer from "../components/Footer";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import Header from "../components/Header";
import { PageTitle } from "../components/PageTitle";
import { MemberIcon } from "../components/MemberIcon";
import { Team as TeamEnum } from "../components/MemberIcon";
import BinaryBackground from "../components/BinaryBackground";
import { motion } from "framer-motion";
import { Section, useTeamController } from "../lib/teamController";

// Full class names are spelled out so Tailwind can detect them.
const MOBILE_LAYOUT: Record<number, string[]> = {
  2: ["w-[calc(50%-1rem)]", "max-w-sm"],
  3: ["w-[calc(33.333%-1.334rem)]", "max-w-xl"],
  4: ["w-[calc(25%-1.5rem)]", "max-w-3xl"],
  5: ["w-[calc(20%-1.6rem)]", "max-w-4xl"],
  6: ["w-[calc(16.666%-1.667rem)]", "max-w-6xl"],
};

const DESKTOP_LAYOUT: Record<number, string[]> = {
  2: ["md:w-[calc(50%-1rem)]", "md:max-w-sm"],
  3: ["md:w-[calc(33.333%-1.334rem)]", "md:max-w-xl"],
  4: ["md:w-[calc(25%-1.5rem)]", "md:max-w-3xl"],
  5: ["md:w-[calc(20%-1.6rem)]", "md:max-w-4xl"],
  6: ["md:w-[calc(16.666%-1.667rem)]", "md:max-w-6xl"],
};

const sectionLayout = ({ mobileColumns, desktopColumns }: Section) => {
  const [mobileItem, mobileMax] = MOBILE_LAYOUT[mobileColumns] ?? MOBILE_LAYOUT[3];
  const [desktopItem, desktopMax] = DESKTOP_LAYOUT[desktopColumns] ?? DESKTOP_LAYOUT[4];
  return {
    itemClass: `${mobileItem} ${desktopItem}`,
    maxWidthClass: `${mobileMax} ${desktopMax}`,
  };
};

const isTeam = (value: string): value is TeamEnum =>
  (Object.values(TeamEnum) as string[]).includes(value);

const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.02,
      duration: 0.5,
      type: "spring" as const,
      stiffness: 260,
      damping: 18,
    },
  }),
};

const headingVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

type SectionProps = {
  title: string;
  itemClass?: string;
  /** Caps the row width so cards don't stretch out on wide screens. */
  maxWidthClass?: string;
  children: React.ReactNode[];
};

const TeamSection: React.FC<SectionProps> = ({
  title,
  itemClass = "w-[calc(33.333%-1.334rem)]",
  maxWidthClass = "max-w-3xl",
  children,
}) => {
  const childArray = React.Children.toArray(children);

  return (
    <section className="px-10 pb-10 text-center">
      {title && (
        <motion.p
          className="text-white text-2xl font-pixelify mb-4"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.5 }}
        >
          {title}
        </motion.p>
      )}
      <div className={`flex flex-wrap gap-8 justify-center ${maxWidthClass} mx-auto`}>
        {childArray.map((child, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            className={itemClass}
          >
            {child}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Team: React.FC = () => {
  const enabled = isFeatureEnabled("team_page_is_enabled");
  const {
    year,
    years,
    title,
    sections,
    teamPhoto,
    ready,
    selectYear,
    yearMenuOpen,
    toggleYearMenu,
    yearMenuPlacement,
    yearMenuRef,
    yearListRef,
  } = useTeamController(enabled);

  React.useEffect(() => {
    if (!enabled) onPageNotFound();
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <BinaryBackground />
      <Header />
      <main className="min-h-screen">
        <PageTitle title={title} className="p-0" />

        {!ready && (
          <p
            role="status"
            className="px-10 py-24 text-center text-white text-xl font-pixelify animate-pulse"
          >
            Loading...
          </p>
        )}

        {ready && sections.length === 0 && (
          <p className="px-10 py-24 text-center text-white text-xl font-pixelify">
            The {year} team will be added soon.
          </p>
        )}

        {ready &&
          sections.map((section) => {
            const team = isTeam(section.team) ? section.team : undefined;

            return (
              <TeamSection
                key={`${year}-${section.title}`}
                title={section.title}
                {...sectionLayout(section)}
              >
                {section.members.map((member) => {
                  const icon = (
                    <MemberIcon
                      image={member.image}
                      name={member.name}
                      role={member.role}
                      lead={member.lead}
                      team={team}
                    />
                  );

                  return member.linkedin ? (
                    <a
                      key={member.name}
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="scale-90 md:scale-100"
                    >
                      {icon}
                    </a>
                  ) : (
                    <div key={member.name} className="scale-90 md:scale-100">
                      {icon}
                    </div>
                  );
                })}
              </TeamSection>
            );
          })}

        {/* Team photo */}
        {ready && teamPhoto && (
          <motion.section
            key={year}
            className="px-4 mt-4 mb-2 flex justify-center"
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
          >
            <img src={teamPhoto} alt={`${year} Team Photo`} className="w-full h-auto md:w-[70%]" />
          </motion.section>
        )}

        {/* Year selector */}
        <div className="flex justify-center mb-12">
          <div ref={yearMenuRef} className="relative">
            <button
              type="button"
              onClick={toggleYearMenu}
              aria-haspopup="listbox"
              aria-expanded={yearMenuOpen}
              className="text-white text-lg font-pixelify underline underline-offset-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {year} Team
            </button>

            {yearMenuOpen && (
              <ul
                ref={yearListRef}
                role="listbox"
                aria-label="Select team year"
                style={{
                  maxHeight: yearMenuPlacement?.maxHeight,
                  visibility: yearMenuPlacement ? "visible" : "hidden",
                }}
                className={`absolute left-1/2 z-20 min-w-40 -translate-x-1/2 overflow-y-auto border border-white/40 bg-black/90 py-1 text-center rounded-xl ${
                  yearMenuPlacement?.openUp ? "bottom-full mb-2" : "top-full mt-2"
                }`}
              >
                {years.map((y) => (
                  <li key={y} role="option" aria-selected={y === year}>
                    <button
                      type="button"
                      onClick={() => selectYear(y)}
                      className={`w-full px-6 py-2 text-lg font-pixelify cursor-pointer hover:bg-white/15 ${
                        y === year ? "text-white underline underline-offset-4" : "text-white/70"
                      }`}
                    >
                      {y} Team
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Team;
