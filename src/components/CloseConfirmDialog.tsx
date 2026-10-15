type CloseConfirmDialogProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  disableConfirm?: boolean;
};

export default function CloseConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title = "Confirm Close",
  description = "Discard your changes and close this panel?",
  cancelLabel = "Keep Editing",
  confirmLabel = "Discard & Close",
  disableConfirm = false,
}: CloseConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-2xl border border-white/20 bg-[#090909] p-5 shadow-2xl"
      >
        <h3 className="text-white font-sans text-base uppercase tracking-wide">{title}</h3>
        <p className="mt-2 text-sm text-white/80 font-sans">{description}</p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onCancel}
            className="w-full py-2 border rounded-xl font-sans border-white/30 text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={disableConfirm}
            className="w-full py-2 border rounded-xl font-sans border-red-500 text-red-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
