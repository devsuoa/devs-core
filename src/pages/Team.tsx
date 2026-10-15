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
  React.useEffect(() => {
    if (!isFeatureEnabled("team_page_is_enabled")) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled("team_page_is_enabled")) {
    return null;
  }

  return (
    <>
      <BinaryBackground />
      <Header />
      <main className="min-h-screen">
        <PageTitle title="Meet Our Team" className="p-0" />

        {/* Presidents */}
        <TeamSection title="Co-Presidents" itemClass="w-[calc(50%-1rem)]" maxWidthClass="max-w-sm">
          <a
            href="https://www.linkedin.com/in/alannasantoso/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/alanna.jpg"
              name="Alanna Santoso"
              team={TeamEnum.Presidents}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/baljot-t-779a76264/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/baljot.jpg"
              name="Baljot Toor"
              team={TeamEnum.Presidents}
            />
          </a>
        </TeamSection>

        {/* Senior Advisors */}
        <TeamSection
          title="Senior Advisors"
          itemClass="w-[calc(50%-1rem)]"
          maxWidthClass="max-w-sm"
        >
          <a
            href="https://www.linkedin.com/in/kartik-malik-285681221/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/kartik.jpg"
              name="Kartik Mailk"
              team={TeamEnum.SeniorAdvisor}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/phoebe-fung-/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/pb.jpg"
              name="Phoebe Fung"
              team={TeamEnum.SeniorAdvisor}
            />
          </a>
        </TeamSection>

        {/* Admin */}
        <TeamSection title="Admin" itemClass="w-[calc(25%-1.5rem)]" maxWidthClass="max-w-3xl">
          <a
            href="https://www.linkedin.com/in/julia-venice-escoto-23a166328/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/julia.jpg"
              name="Julia Escoto"
              role="Secretary"
              team={TeamEnum.Admin}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/emmanuel-araba77/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/emmanuel.jpg"
              name="Emmanuel Araba"
              role="Sponsorship Manager"
              team={TeamEnum.Admin}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/koutaroyumiba/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/kot.jpg"
              name="Koutaro Yumiba"
              role="Treasurer"
              team={TeamEnum.Admin}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/terrence-wu-5657a0376/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/terrence.jpg"
              name="Terrence Wu"
              role="Admin Exec"
              team={TeamEnum.Admin}
            />
          </a>
        </TeamSection>

        {/* Tech */}
        <TeamSection
          title="Tech"
          itemClass="w-[calc(33.333%-1.334rem)] md:w-[calc(25%-1.5rem)]"
          maxWidthClass="max-w-xl md:max-w-3xl"
        >
          <a
            href="https://www.linkedin.com/in/kim-ngor/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/kim.jpg" name="Kim Ngor" lead team={TeamEnum.Tech} />
          </a>
          <a
            href="https://www.linkedin.com/in/anurag-bobbili-b3167534a/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/anurag.jpg" name="Anurag Bobbili" team={TeamEnum.Tech} />
          </a>
          <a
            href="https://www.linkedin.com/in/hazik-chaudhry-5123432aa/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/hazik.jpg" name="Hazik Chaudhry" team={TeamEnum.Tech} />
          </a>
          <a
            href="https://www.linkedin.com/in/joseph-wilson-a665332a4/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/joseph.jpg" name="Joseph Wilson" team={TeamEnum.Tech} />
          </a>
        </TeamSection>

        {/* Comps */}
        <TeamSection title="Comps" itemClass="w-[calc(25%-1.5rem)]" maxWidthClass="max-w-3xl">
          <a
            href="https://www.linkedin.com/in/victor-qiu-dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/victor.jpg"
              name="Victor Qiu"
              lead
              team={TeamEnum.Comps}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/anatol-coen/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/anatol.jpg" name="Anatol Coen" team={TeamEnum.Comps} />
          </a>
          <a
            href="https://www.linkedin.com/in/tushar-shaji-33b77b178/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/tushar.jpeg" name="Tushar Shaji" team={TeamEnum.Comps} />
          </a>
          <a
            href="https://www.linkedin.com/in/williamhuangg/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/william.png"
              name="William Huang"
              team={TeamEnum.Comps}
            />
          </a>
        </TeamSection>

        {/* Industry */}
        <TeamSection title="Industry" itemClass="w-[calc(20%-1.6rem)]" maxWidthClass="max-w-4xl">
          <a
            href="https://www.linkedin.com/in/eric-zheng-nz/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/eric.jpeg"
              name="Eric Zheng"
              lead
              team={TeamEnum.Industry}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/annlowe7/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/ann.jpg" name="Ann Lowe" team={TeamEnum.Industry} />
          </a>
          <a
            href="https://www.linkedin.com/in/youyang-fu/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/frank.jpg" name="Frank Fu" team={TeamEnum.Industry} />
          </a>
          <a
            href="https://www.linkedin.com/in/jackyzchen/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/jacky.png" name="Jacky Chen" team={TeamEnum.Industry} />
          </a>
          <a
            href="https://www.linkedin.com/in/joyce-liu-265920357"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/joyce.jpg" name="Joyce Liu" team={TeamEnum.Industry} />
          </a>
        </TeamSection>

        {/* Social */}
        <TeamSection
          title="Social"
          itemClass="w-[calc(33.333%-1.334rem)] md:w-[calc(25%-1.5rem)]"
          maxWidthClass="max-w-xl md:max-w-3xl"
        >
          <a
            href="https://www.linkedin.com/in/marcus-chan-nz/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/marcus.jpg"
              name="Marcus Chan"
              lead
              team={TeamEnum.Social}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/ayemyatthu04/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/aye.jpg" name="Aye Thu" team={TeamEnum.Social} />
          </a>
          <a
            href="https://www.linkedin.com/in/eileen-qiu-7b0009287/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/eileen.jpg" name="Eileen Qiu" team={TeamEnum.Social} />
          </a>
          <a
            href="https://www.linkedin.com/in/kelly-hunt-98a521358/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon image="/team/execs/kelly.jpg" name="Kelly Hunt" team={TeamEnum.Social} />
          </a>
        </TeamSection>

        {/* Marketing */}
        <TeamSection
          title="Marketing"
          itemClass="w-[calc(33.333%-1.334rem)] md:w-[calc(16.666%-1.667rem)]"
          maxWidthClass="max-w-xl md:max-w-6xl"
        >
          <a
            href="https://www.linkedin.com/in/john-andrei-vergara-3b9921285/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/andrei.jpg"
              name="Andrei Vergara"
              lead
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/avishai-narsey/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/avishai.jpg"
              name="Avishai Narsey"
              role="Content Manager"
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/jacob-gray-87888a332/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/jacob.jpg"
              name="Jacob Gray"
              role="Content Manager"
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/nicholaswww/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/nick.jpg"
              name="Nicholas Wilson"
              role="Content Manager"
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/tylerhyoung/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/tyler.jpg"
              name="Tyler Young"
              role="Content Manager"
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/aeryn-lao/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/aeryn.jpeg"
              name="Aeryn Elizabeth Lao"
              role="Designer"
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/amy-yan-936111320/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/amy.jpg"
              name="Amy Yan"
              role="Designer"
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/chaeeunlee0215/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/ava.jpg"
              name="Ava Lee"
              role="Designer"
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/bryanna-y/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/bryanna.jpg"
              name="Bryanna Yeo"
              role="Designer"
              team={TeamEnum.Marketing}
            />
          </a>
          <a
            href="https://www.linkedin.com/in/nicole-lai-in/"
            target="_blank"
            rel="noopener noreferrer"
            className="scale-90 md:scale-100"
          >
            <MemberIcon
              image="/team/execs/nicole.png"
              name="Nicole Lai"
              role="Photographer"
              team={TeamEnum.Marketing}
            />
          </a>
        </TeamSection>

        {/* Team photo */}
        <motion.section
          className="px-4 py-6 my-12 flex justify-center"
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          <img src="/team/execs/team.png" alt="Team Photo" className="w-full h-auto md:w-[70%]" />
        </motion.section>
      </main>
      <Footer />
    </>
  );
};

export default Team;
