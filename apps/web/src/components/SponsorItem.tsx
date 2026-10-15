type SponsorItemProps = {
  /**
   * Name of the sponsor
   * @example "Jane Street"
   */
  name: string;

  /**
   * Logo of the sponsor displayed below the image
   * @example "/sponsors/gold/jane_street_logo.png"
   */
  logo: string;

  /**
   * Class name for the container for extra styling
   */
  className?: string;
};

const SponsorItem: React.FC<SponsorItemProps> = ({ name, className, logo }) => {
  return (
    <div className="flex flex-col items-center gap-4 m-4">
      <img src={logo} alt={name} className={`w-[12rem] h-auto max-w-[12rem] p-4 ${className}`} />
    </div>
  );
};

export default SponsorItem;
