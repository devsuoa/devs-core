const sponsors = [
    "/sponsors/gold/jane_street.png",
    "/sponsors/gold/serato.png",
    "/sponsors/silver/atlassian.png",
    "/sponsors/silver/optiver.png",
    "/sponsors/silver/sandfield.png",
    "/sponsors/silver/visa.png",
  ];
  
  export default function SponsorTape() {
    return (
      <div className="relative w-full overflow-hidden py-6 opacity-70 grayscale">
        <div className="sponsor-track flex w-max items-center gap-16">
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
  