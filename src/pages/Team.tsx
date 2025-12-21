import React from 'react';
import Footer from '../components/Footer';
import { isFeatureEnabled } from '../lib/featureFlags';
import { onPageNotFound } from '../lib/pageNotFoundController';
import Header from '../components/Header';
import { PageTitle } from '../components/PageTitle';
import { MemberIcon } from '../components/MemberIcon';
import { Team as TeamEnum } from '../components/MemberIcon';

const Team: React.FC = () => {
  React.useEffect(() => {
    if (!isFeatureEnabled('team_page_is_enabled')) {
      onPageNotFound();
    }
  }, []);

  if (!isFeatureEnabled('team_page_is_enabled')) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <PageTitle title="Meet Our Team" image="/theme/title_icon.png" className='p-0' />

        {/* Pres */}
        <section className="px-12 py-6 text-center">
          <p className="text-white text-2xl font-pixelify">Co-Presidents</p>
          <div className="flex flex-row gap-4 justify-center">
            <a href="https://www.linkedin.com/in/alannasantoso/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/alanna.jpg" name="Alanna Santoso" team={TeamEnum.Presidents} />
            </a>

            <a href="https://www.linkedin.com/in/baljot-t-779a76264/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/baljot.jpg" name="Baljot Toor" team={TeamEnum.Presidents} />
            </a>
          </div>
        </section>

        {/* Senior Advisors */}
        <section className="px-12 py-6 text-center">
          <p className="text-white text-2xl font-pixelify">Senior Advisors</p>
          <div className="flex flex-row gap-4 justify-center">
            <a href="https://www.linkedin.com/in/phoebe-fung-/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/pb.jpg" name="Phoebe Fung" team={TeamEnum.SeniorAdvisor} />
            </a>

            <a href="https://www.linkedin.com/in/kartik-malik-285681221/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/kartik.jpg" name="Kartik Mailk" team={TeamEnum.SeniorAdvisor} />
            </a>
          </div>
        </section>

        {/* Admin */}
        <section className="px-12 py-6 text-center">
          <p className="text-white text-2xl font-pixelify">Admin</p>
          <div className="flex flex-row gap-4 justify-center">

            <a href="https://www.linkedin.com/in/julia-venice-escoto-23a166328/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/julia.jpg" name="Julia Escoto" role="Secretary" team={TeamEnum.Admin} />
            </a>

            <a href="https://www.linkedin.com/in/koutaroyumiba/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/kot.jpg" name="Koutaro Yumiba" role="Treasurer" team={TeamEnum.Admin} />
            </a>

            <a href="https://www.linkedin.com/in/emmanuel-araba77/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/emmanuel.jpg" name="Emmanuel Araba" role="Sponsorship Manager" team={TeamEnum.Admin} />
            </a>
          </div>
        </section>

        {/* Tech */}
        <section className="px-12 py-6 text-center">
          <p className="text-white text-2xl font-pixelify">Tech</p>
          <div className="flex flex-row gap-4 justify-center">
            <a href="https://www.linkedin.com/in/kim-ngor/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/kim.jpg" name="Kim Ngor" lead team={TeamEnum.Tech} />
            </a>

            <a href="https://www.linkedin.com/in/anurag-bobbili-b3167534a/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/anurag.jpg" name="Anurag Bobbili" team={TeamEnum.Tech} />
            </a>

            <a href="https://www.linkedin.com/in/hazik-chaudhry-5123432aa/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/hazik.jpg" name="Hazik Chaudhary" team={TeamEnum.Tech} />
            </a>

            <a href="https://www.linkedin.com/in/joseph-wilson-a665332a4/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/joseph.jpg" name="Joseph Wilson" team={TeamEnum.Tech} />
            </a>
          </div>
        </section>

        {/* Comps */}
        <section className="px-12 py-6 text-center">
          <p className="text-white text-2xl font-pixelify">Comps</p>
          <div className="flex flex-row gap-4 justify-center">
            <a href="https://www.linkedin.com/in/victor-qiu-dev/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/victor.jpg" name="Victor Qiu" lead team={TeamEnum.Comps} />
            </a>
            <a href="https://www.linkedin.com/in/anatol-coen/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/anatol.jpg" name="Anatol Coen" team={TeamEnum.Comps} />
            </a>
            <a href="https://www.linkedin.com/in/williamhuangg/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/william.jpg" name="William Huang" team={TeamEnum.Comps} />
            </a>
          </div>
        </section>

        {/* Industry */}
        <section className="px-12 py-6 text-center">
          <p className="text-white text-2xl font-pixelify">Industry</p>
          <div className="flex flex-row gap-4 justify-center">
            <a href="https://www.linkedin.com/in/youyang-fu/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/frank.jpg" name="Frank Fu" lead team={TeamEnum.Industry} />
            </a>

            <a href="https://www.linkedin.com/in/annlowe7/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/ann.jpg" name="Ann Lowe" team={TeamEnum.Industry} />
            </a>

            <a>
              <MemberIcon image="/team/execs/joyce.png" name="Joyce Liu" team={TeamEnum.Industry} />
            </a>
          </div>
        </section>

        {/* Social */}
        <section className="px-12 py-6 text-center">
          <p className="text-white text-2xl font-pixelify">Social</p>
          <div className="flex flex-row gap-4 justify-center">
            <a href="https://www.linkedin.com/in/marcus-chan-nz/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/marcus.jpg" name="Marcus Chan" lead team={TeamEnum.Social} />
            </a>

            <a href="https://www.linkedin.com/in/kelly-hunt-98a521358/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/kelly.jpg" name="Kelly Hunt" team={TeamEnum.Social} />
            </a>

            <a href="https://www.linkedin.com/in/ayemyatthu04/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/aye.jpg" name="Aye Thu" team={TeamEnum.Social} />
            </a>

            <a href="https://www.linkedin.com/in/eileen-qiu-7b0009287/" target="_blank" rel="noopener noreferrer">
              <MemberIcon image="/team/execs/eileen.jpg" name="Eileen Qiu" team={TeamEnum.Social} />
            </a>
          </div>
        </section>

        {/* Marketing */}
        <section className="px-12 py-6 text-center">
          <p className="text-white text-2xl font-pixelify">Marketing</p>
          <div className="flex flex-row gap-4 justify-center">
            <a href="https://www.linkedin.com/in/john-andrei-vergara-3b9921285/" target="_blank" rel="noopener noreferrer">
            <MemberIcon image="/team/execs/andrei.jpg" name="Andrei Vergara" lead team={TeamEnum.Marketing} />
            </a>

            <a href="https://www.linkedin.com/in/tylerhyoung/" target="_blank" rel="noopener noreferrer">
            <MemberIcon image="/team/execs/tyler.jpg" name="Tyler Young" role="Content Manager" team={TeamEnum.Marketing} />
            </a>

            <a href="https://www.linkedin.com/in/nicholaswww/" target="_blank" rel="noopener noreferrer">
            <MemberIcon image="/team/execs/nick.jpg" name="Nicholas Wilson" role="Content Manager" team={TeamEnum.Marketing} />
            </a>

            <a href="https://www.linkedin.com/in/chaeeunlee0215/" target="_blank" rel="noopener noreferrer">
            <MemberIcon image="/team/execs/ava.jpg" name="Ava Lee" role="Designer" team={TeamEnum.Marketing} />
            </a>

            <a href="https://www.linkedin.com/in/amy-yan-936111320/" target="_blank" rel="noopener noreferrer">
            <MemberIcon image="/team/execs/amy.jpg" name="Amy Yan" role="Designer" team={TeamEnum.Marketing} />
            </a>

            <a href="https://www.linkedin.com/in/bryanna-y/" target="_blank" rel="noopener noreferrer">
            <MemberIcon image="/team/execs/bryanna.jpg" name="Bryanna Yeo" role="Designer" team={TeamEnum.Marketing} />
            </a>
          </div>
        </section>

        <section className="px-12 py-6 my-12 flex justify-center">
          <img src="/team/execs/team.png" alt="Team Photo" className="w-[70%] h-auto" />
        </section>

      </main>
      <Footer />
    </>
  );
};

export default Team;
