import React from "react";
import { toast, type ToastOptions } from "react-toastify";

export type SiteToastVariant = "default" | "success" | "error";

export type SiteToastOptions = Pick<ToastOptions, "autoClose" | "position"> & {
  variant?: SiteToastVariant;
};

const VARIANT_SHELL: Record<SiteToastVariant, string> = {
  default: "border-white ring-[#6E80DA]/60 shadow-[0_0_18px_4px_rgba(110,128,218,0.35)]",
  success: "border-emerald-300/75 ring-emerald-500/45 shadow-[0_0_18px_4px_rgba(52,211,153,0.22)]",
  error: "border-red-300/75 ring-red-500/45 shadow-[0_0_18px_4px_rgba(248,113,113,0.22)]",
};

const defaultToastOptions: ToastOptions = {
  autoClose: 4500,
  hideProgressBar: true,
  closeButton: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: false,
  icon: false,
  className: "!bg-transparent !p-0 !m-0 !mb-3 !min-h-0 !shadow-none !rounded-none border-0",
};

export const SiteToastContent: React.FC<{
  message: string;
  closeToast?: () => void;
  variant?: SiteToastVariant;
}> = ({ message, closeToast, variant = "default" }) => (
  <div
    role="status"
    className={`pointer-events-auto grid max-w-[min(90vw,24rem)] grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-x-2 rounded-xl border-2 bg-[#04060f] px-3 py-3.5 ring-4 sm:px-4 sm:py-4 ${VARIANT_SHELL[variant]}`}
  >
    <span className="block w-full shrink-0" aria-hidden />
    <p className="min-w-0 text-center font-silkscreen text-sm tracking-wide leading-snug text-white sm:text-base">
      {message}
    </p>
    <div className="flex h-7 w-7 shrink-0 items-center justify-center justify-self-end">
      {closeToast ? (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={(e) => {
            e.stopPropagation();
            closeToast();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-white/40 font-pixelify text-sm leading-none text-white/90 transition hover:border-white hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      ) : null}
    </div>
  </div>
);

export function showSiteToast(
  message: string,
  options?: SiteToastOptions,
): void {
  const variant = options?.variant ?? "default";
  const toastId = `site-toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  toast(
    <SiteToastContent
      message={message}
      variant={variant}
      closeToast={() => toast.dismiss(toastId)}
    />,
    {
      ...defaultToastOptions,
      toastId,
      position: options?.position ?? "top-right",
      autoClose: options?.autoClose ?? defaultToastOptions.autoClose,
    },
  );
}
