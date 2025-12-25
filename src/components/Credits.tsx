import { createPortal } from "react-dom";
import close from '/footer/close.png';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const Credits = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative z-10 w-[90%] max-w-xl max-h-[70vh] overflow-y-auto
                   bg-[#0C1439] opacity-[97%] border border-[#6E80DA] p-6 rounded-3xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-7">
            <h2 className="font-silkscreen text-3xl text-center ">CREDITS</h2>

            <img
                src={close}
                alt="Instagram"
                className="transition-all cursor-pointer duration-300 ease-in-out hover:scale-110 pixelated"
                onClick={onClose}
            />
        </div>

        <p className="font-silkscreen text-xs leading-relaxed">
          Developed by:
          <br />– Baljot Toor, Anurag Bobbili, Hazik Chaudhary, Phoebe Fung, Kim Ngor, Joe Wilson  
          <br /><br />
          Designed by:
          <br />– Amy Yan, Alanna Santoso
          <br /><br />
          Additional assets by:
          <br />- Ava Lee, Bryanna Yeo, Tyler Young
          <br /><br />
          Built with React + Tailwind
        </p>
      </div>
    </div>,
    document.body
  );
};

export default Credits;
