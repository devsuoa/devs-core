interface SponsorCardProps {
  name: string;
  image: string;
  desc: string;
  tier: "gold" | "silver" | "bronze";
}

export default function SponsorCard({ name, image, desc, tier }: SponsorCardProps) {
  const tierColor =
    tier === "gold" ? "text-yellow-400" : tier === "silver" ? "text-gray-300" : "text-amber-700";

  return (
    <li
      className="sponsor-card list-none p-0 m-0 w-64 flex flex-col justify-center items-center sm:w-72 md:w-80 aspect-5/7 absolute top-0 left-0 rounded-lg ring-2 ring-white/60 shadow-[0_0_18px_4px_rgba(255,255,255,0.35)]"
      data-tier={tier}
      aria-label={`${tier} sponsor: ${name}`}
    >
      <div className="relative w-full justify-center items-center flex flex-col h-full">
        <div className="w-full h-full flex flex-col justify-center items-center bg-black/50 p-4 sm:p-5 md:p-6 rounded-lg">
          <div
            className={`font-silkscreen text-center text-base pt-7 sm:text-lg tracking-wider ${tierColor} mt-3 sm:mt-4`}
          >
            {tier.toUpperCase()} SPONSOR
          </div>

          <div className="w-full shrink-0 rounded-lg px-7 mt-0 mb-0 flex items-center justify-center h-24 sm:h-28 md:h-32">
            {image ? (
              <img src={image} alt={name} className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="font-pixelify text-white text-xl sm:text-2xl">{name}</span>
            )}
          </div>

          <p className="font-pixelify text-white text-[10px] -mt-5 mx-4 sm:text-xs leading-relaxed text-center grow flex items-center">
            {desc}
          </p>
        </div>
      </div>
    </li>
  );
}
