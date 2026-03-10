import sponsorData from "../data/current_sponsors.json";

const sponsors = sponsorData.map((s) => s.image);
  
  export default function SponsorTape() {
  return (
    <div className="relative w-full overflow-hidden py-6 opacity-70 isolate">
      <div className="sponsor-track flex w-max items-center gap-16" style={{ transform: "translateZ(0)" }}>
          {sponsors.map((logo, i) => (
            <img
              key={`a-${i}`}
              src={logo}
              alt="Sponsor logo"
              className="h-10 w-auto object-contain"
            />
          ))}
  
          {sponsors.map((logo, i) => (
            <img
              key={`b-${i}`}
              src={logo}
              alt="Sponsor logo"
              className="h-10 w-auto object-contain"
            />
          ))}
        </div>
      </div>
    );
  }
  