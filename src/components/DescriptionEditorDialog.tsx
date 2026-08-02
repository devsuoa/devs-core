import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

type DescriptionEditorDialogProps = {
  isOpen: boolean;
  initialValue: string;
  onClose: () => void;
  onDiscard: () => void;
  onStash: (description: string) => void;
};

export default function DescriptionEditorDialog({
  isOpen,
  initialValue,
  onClose: _onClose,
  onDiscard,
  onStash,
}: DescriptionEditorDialogProps) {
  const [draftHtml, setDraftHtml] = useState(initialValue);
  const [draftText, setDraftText] = useState(initialValue);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialValue || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setDraftHtml(currentEditor.getHTML());
      setDraftText(currentEditor.getText());
    },
  });

  useEffect(() => {
    if (!isOpen || !editor) return;

    const content = initialValue || "<p></p>";
    editor.commands.setContent(content, { emitUpdate: false });
    setDraftHtml(content);
    setDraftText(editor.getText());
  }, [editor, initialValue, isOpen]);

  if (!isOpen || !editor) {
    return <></>;
  }

  const handleDiscard = () => {
    const content = initialValue || "<p></p>";
    editor?.commands.setContent(content, { emitUpdate: false });
    setDraftHtml(content);
    setDraftText(editor?.getText() ?? "");
    onDiscard();
  };

  const handleStash = () => {
    onStash(draftHtml);
  };

  return (
    <div className="absolute right-full top-0 h-full w-full max-w-full sm:min-w-400">
      <aside className="absolute right-0 top-0 z-60 h-full w-full max-w-full border-l-2 border-[#6E80DA] bg-black shadow-lg sm:w-130    ">
        <div className="flex h-full flex-col p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="font-sans text-sm uppercase tracking-wide text-white">
              Description Editor
            </h3>
            <div className="flex items-center gap-2"></div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-3 hidden md:flex flex-wrap gap-2 border-b border-white/10 pb-3">
              {[
                {
                  label: "Bold",
                  onClick: () => editor?.chain().focus().toggleBold().run(),
                  active: editor?.isActive("bold") ?? false,
                },
                {
                  label: "Italic",
                  onClick: () => editor?.chain().focus().toggleItalic().run(),
                  active: editor?.isActive("italic") ?? false,
                },
                {
                  label: "Underline",
                  onClick: () =>
                    editor?.chain().focus().toggleUnderline().run(),
                  active: editor?.isActive("underline") ?? false,
                },
                {
                  label: "Strike",
                  onClick: () => editor?.chain().focus().toggleStrike().run(),
                  active: editor?.isActive("strike") ?? false,
                },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-sans transition hover:bg-white/10 hover:text-white/75 ${
                    action.active
                      ? "bg-white/10 text-white/80"
                      : "text-white/40"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black p-3 hidden md:block">
              <EditorContent
                editor={editor}
                className="h-full [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-48 [&_.ProseMirror]:w-full [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:wrap-break-word [&_.ProseMirror]:leading-relaxed [&_.ProseMirror]:outline-none"
              />
            </div>

            <textarea
              value={draftText}
              onChange={(e) => {
                setDraftText(e.target.value);
                setDraftHtml(e.target.value);
              }}
              rows={8}
              className="md:hidden min-h-48 w-full flex-1 rounded-xl border border-white/10 bg-black p-3 text-sm text-white font-sans leading-relaxed resize-y"
              placeholder="Enter description..."
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleDiscard}
              className="rounded-xl border border-white/20 px-4 py-2 text-xs font-sans text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Discard Changes
            </button>
            <button
              onClick={handleStash}
              className="rounded-xl border border-[#6E80DA] px-4 py-2 text-xs font-sans text-white transition hover:bg-[#6E80DA]/10"
            >
              Stash Changes
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
