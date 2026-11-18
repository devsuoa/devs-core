import React from "react";

// eslint-disable-next-line react-refresh/only-export-components -- Team enum is shared with callers; move to its own file later
export enum Team {
  Presidents = "Presidents",
  SeniorAdvisor = "Senior Advisor",
  Admin = "Admin",
  Tech = "Tech",
  Industry = "Industry",
  Comps = "Comps",
  Social = "Social",
  Marketing = "Marketing",
}

type MemberIconProps = {
  /**
   * Image of exec
   * @example "/team/execs/2026/alanna.jpg"
   */
  image?: string | undefined;

  /**
   * Name of exec
   * Automatically prefixed with '>' and converted to uppercase
   * @example "Alanna Santoso"
   */
  name: string;

  /**
   * Role of exec
   * @example "Secretary"
   */
  role?: string;

  /**
   * If the exec is the lead of a team
   * @example true
   */
  lead?: boolean;

  /**
   * Class name for the container for extra styling
   */
  className?: string;

  /**
   * Team of exec
   * @example Team.Presidents
   */
  team?: Team;
};

export const MemberIcon: React.FC<MemberIconProps> = ({
  image,
  name,
  role,
  lead,
  className = "max-w-4xl",
  team,
}) => {
  const TEAM_BORDER_CLASSES: Record<Team, string> = {
    [Team.Presidents]: "border-[#6E80DA]",
    [Team.SeniorAdvisor]: "border-[#EE6EFF]",
    [Team.Admin]: "border-[#9D4CB7]",
    [Team.Tech]: "border-[#622ACB]",
    [Team.Social]: "border-[#6E80DA]",
    [Team.Industry]: "border-[#EFEFEF]",
    [Team.Comps]: "border-[#9060F0]",
    [Team.Marketing]: "border-[#EB75C5]",
  };

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {image && (
            <img
              src={image}
              alt={name}
              className={`max-h-[100px] max-w-[100px] shrink-0 object-contain rounded-full border-2 hover:scale-103 transition-all duration-300 ease-in-out ${
                team ? TEAM_BORDER_CLASSES[team] : "border-white"
              }`}
            />
          )}

          {lead && (
            <img
              src="/team/lead_star.png"
              alt="Lead"
              className="absolute -top-1 -right-1 w-5 h-5 pixelated"
            />
          )}
        </div>

        <div className="flex text-center">
          <p className="text-m font-normal text-white font-rethink">{name}</p>
        </div>

        {role && (
          <div className="flex text-center p-0">
            <p className="text-sm font-normal text-white font-rethink">{role}</p>
          </div>
        )}
      </div>
    </div>
  );
};
