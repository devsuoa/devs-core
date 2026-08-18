import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PageTitle } from "../components/PageTitle";
import FeaturedProjectCard from "../components/FeaturedProjectCard";
import BinaryBackground from "../components/BinaryBackground";
import { isFeatureEnabled } from "../lib/featureFlags";
import { onPageNotFound } from "../lib/pageNotFoundController";
import { useFeaturedProject } from "../lib/projectsController";

const Projects = () => {
  const { project, loading } = useFeaturedProject();

  useEffect(() => {
    if (!isFeatureEnabled("projects_page_is_enabled")) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled("projects_page_is_enabled")) {
    return null;
  }

  return (
    <>
      <BinaryBackground />
      <Header />

      <PageTitle
        title="Project Showcase"
        subtext="What our members built at the most recent hackathon."
      />

      <main className="mb-[6vh] min-h-[20vh]">
        {loading ? (
          <p className="text-center font-pixelify text-sm text-white sm:text-base">
            Loading project...
          </p>
        ) : !project ? (
          <p className="text-center font-pixelify text-sm text-white sm:text-base">
            No project to show yet.
          </p>
        ) : (
          <FeaturedProjectCard project={project} />
        )}
      </main>

      <Footer />
    </>
  );
};

export default Projects;
