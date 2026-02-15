interface SponsorCardProps {
  name: string;
  image: string;
  desc: string;
  tier: "gold" | "silver" | "bronze";
}

export default function SponsorCard({
  name,
  image,
  desc,
  tier,
}: SponsorCardProps) {
  const tierColor = tier === "gold" ? "text-yellow-400" : "text-gray-300";
  tier === "gold"
    ? "text-yellow-400"
    : tier === "silver"
      ? "text-gray-300"
      : "text-yellow-700";

  return (
    <li
      className="sponsor-card list-none p-0 m-0 w-64 sm:w-72 md:w-80 aspect-2/3 absolute top-0 left-0"
      data-tier={tier}
      aria-label={`${tier} sponsor: ${name}`}
    >
      <div className="relative w-full h-full">
        {/* Content */}
        <div className="w-full h-full p-4 sm:p-5 md:p-6 flex flex-col items-center justify-between">
          {/* Logo Section */}
          <div className="w-full shrink-0 rounded-lg p-3 sm:p-4 border-2 border-transparent flex items-center justify-center h-24 sm:h-28 md:h-32">
            {image ? (
              <img
                src={image}
                alt={name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="font-pixelify text-white text-xl sm:text-2xl">{name}</span>
            )}
          </div>

          {/* Tier Badge */}
          <div
            className={`font-silkscreen text-base sm:text-lg tracking-wider ${tierColor} mt-3 sm:mt-4`}
          >
            {tier.toUpperCase()} SPONSOR
          </div>

          {/* Description */}
          <p className="font-pixelify text-white text-[10px] sm:text-xs leading-relaxed text-center grow flex items-center px-1 sm:px-2 mt-3 sm:mt-4">
            {desc}
          </p>

          {/* Social Icons */}
        </div>

        {/* Outline Wrapper */}
        <img
          src="/sponsors/outline.png"
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none pixelated"
          draggable={false}
        />
      </div>
    </li>
  );
}
