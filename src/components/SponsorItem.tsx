type SponsorItemProps = {
    /**
     * Name of the sponsor
     * @example "Jane Street"
     */
    name: string;

    /**
     * Image displayed above the sponsor
     * @example "/sponsors/gold/jane_street.png"
     */
    image: string;

    /**
     * Logo of the sponsor displayed below the image
     * @example "/sponsors/gold/jane_street_logo.png"
     */
  logo: string
};

const SponsorItem: React.FC<SponsorItemProps> = ({
  name,
  image,
  logo
}) => {
  return (
    <div className="flex flex-col items-center gap-4 m-4"> 
      <img src={image} alt={name} className="w-[8rem] h-auto p-2" />
      <img src={logo} alt={name} className="w-[12rem] h-auto max-w-[12rem] border-2 border-white rounded-lg p-4" />
    </div>
  );
};

export default SponsorItem;
