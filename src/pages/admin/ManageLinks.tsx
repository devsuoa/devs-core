import React, { useCallback, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PageTitle } from "../../components/PageTitle";
import { useAdminDashboard } from "../../lib/adminDashboardController";
import { useLinksManagement, uploadLinkIcon, Link, LinkFormData, getFaviconUrl } from "../../lib/linksController";
import { Link as RouterLink } from "react-router-dom";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ImageDropZone: React.FC<{
  imageUrl: string | null;
  onUpload: (url: string) => void;
  onError: (msg: string) => void;
}> = ({ imageUrl, onUpload, onError }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        onError("Only image files are supported.");
        return;
      }
      setUploading(true);
      try {
        const url = await uploadLinkIcon(file);
        onUpload(url);
      } catch (err: unknown) {
        onError(err instanceof Error ? err.message : "Image upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [onUpload, onError],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div>
      <div
        className={`pixel-input w-full flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${dragOver ? "opacity-70" : ""}`}
        style={{ minHeight: "100px", borderStyle: "dashed", padding: "16px" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <p className="font-pixelify text-xs text-white/70">Uploading...</p>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Icon preview"
              className="w-10 h-10 object-contain"
              style={{ imageRendering: "auto" }}
            />
            <p className="font-pixelify text-xs text-white/50">Click or drop to replace</p>
          </>
        ) : (
          <>
            <p className="font-pixelify text-xs text-white/70">Drag & drop or click to upload icon</p>
            <p className="font-pixelify text-xs text-white/40">PNG, JPG, SVG, WEBP</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
    </div>
  );
};

const SortableLinkItem: React.FC<{
  link: Link;
  isCurrentlyActive: boolean;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
}> = ({ link, isCurrentlyActive, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: "relative" as const,
  };

  if (link.is_spacer) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="cursor-pointer pixel-panel font-pixelify text-[1rem] flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-4 sm:p-6 border-2 border-white border-opacity-20 rounded border-dashed break-words bg-white/5 mb-4 last:mb-0 min-w-0"
        {...attributes}
        {...listeners}
      >
        <div className="flex-1 min-w-0 order-1 sm:order-2">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-pixelify text-white opacity-70" style={{ fontSize: "10px" }}>
              {link.title || "(Empty Space)"}
            </span>
            <span className="font-pixelify text-gray-500" style={{ fontSize: "8px" }}>
              SPACER
            </span>
            {isCurrentlyActive ? (
              <span className="font-pixelify text-green-400" style={{ fontSize: "8px" }}>
                ACTIVE
              </span>
            ) : (
              <span className="font-pixelify text-gray-400" style={{ fontSize: "8px" }}>
                INACTIVE
              </span>
            )}
          </div>
          {(link.active_from || link.active_to) && (
            <div className="text-gray-500 text-xs mt-2">
              {link.active_from && `From: ${new Date(link.active_from).toLocaleDateString()}`}
              {link.active_from && link.active_to && " | "}
              {link.active_to && `To: ${new Date(link.active_to).toLocaleDateString()}`}
            </div>
          )}
        </div>

        <div className="flex flex-row flex-wrap sm:flex-nowrap sm:flex-col items-center gap-2 shrink-0 order-2 sm:order-1">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(link)}
              className="pixel-button font-silkscreen text-[10px] sm:text-[8px] px-4 py-2 min-h-[40px] touch-manipulation"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(link.id)}
              className="pixel-button font-silkscreen text-[10px] sm:text-[8px] px-4 py-2 min-h-[40px] touch-manipulation !text-red-400 hover:!text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="pixel-panel font-pixelify text-[1rem] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 border-2 border-white border-opacity-30 rounded break-words mb-4 last:mb-0 min-w-0 bg-[#1a1a1a] cursor-pointer"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0 order-1">
        <img
          src={link.custom_icon || getFaviconUrl(link.url)}
          alt={`${link.title} icon`}
          className="flex-shrink-0 object-contain rounded w-10 h-10 min-w-10 min-h-10"
          style={{ imageRendering: "auto" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-pixelify text-white text-[1rem]">{link.title}</span>
            {isCurrentlyActive ? (
              <span className="font-pixelify text-green-400 text-[0.8rem]">ACTIVE</span>
            ) : (
              <span className="font-pixelify text-gray-400 text-[0.8rem]">INACTIVE</span>
            )}
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixelify text-gray-400 text-[0.8rem] hover:text-white break-all block"
          >
            {link.url}
          </a>
          {(link.active_from || link.active_to) && (
            <div className="font-pixelify text-gray-500 text-[0.8rem] mt-2">
              {link.active_from && `From: ${new Date(link.active_from).toLocaleDateString()}`}
              {link.active_from && link.active_to && " | "}
              {link.active_to && `To: ${new Date(link.active_to).toLocaleDateString()}`}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-row flex-wrap items-center gap-2 shrink-0 order-2">
        <button
          onClick={() => onEdit(link)}
          className="pixel-button font-silkscreen text-[10px] sm:text-[8px] px-4 py-2 min-h-[40px] touch-manipulation"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(link.id)}
          className="pixel-button font-silkscreen text-[10px] sm:text-[8px] px-4 py-2 min-h-[40px] touch-manipulation !text-red-400 hover:!text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

const ManageLinks: React.FC = () => {
  const { loading: authLoading, authorized } = useAdminDashboard();
  const { links, loading, error, addLink, editLink, removeLink, reorderLink } = useLinksManagement();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LinkFormData>({
    title: "",
    url: "",
    is_active: true,
    active_from: null,
    active_to: null,
    is_spacer: false,
    custom_icon: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      const newLinks = arrayMove(links, oldIndex, newIndex);

      // Call our bulk update function
      if (reorderLink) {
        reorderLink(newLinks);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <PageTitle title="Manage Links" className="mt-[5vh]" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="font-pixelify text-white">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!authorized) {
    return null;
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate: if not a spacer, URL is required
    if (!formData.is_spacer && !formData.url.trim()) {
      alert("URL is required for links");
      return;
    }

    // Validate date range
    if (formData.active_from && formData.active_to && new Date(formData.active_from) > new Date(formData.active_to)) {
      alert("Active From date must be before or equal to Active To date");
      return;
    }

    try {
      await addLink(formData);
      setFormData({
        title: "",
        url: "",
        is_active: true,
        active_from: null,
        active_to: null,
        is_spacer: false,
        custom_icon: null,
      });
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add link:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    if (!formData.is_spacer && !formData.url.trim()) {
      alert("URL is required for links");
      return;
    }

    try {
      await editLink(editingLink.id, formData);
      setEditingLink(null);
      setFormData({
        title: "",
        url: "",
        is_active: true,
        active_from: null,
        active_to: null,
        is_spacer: false,
        custom_icon: null,
      });
    } catch (err) {
      console.error("Failed to update link:", err);
    }
  };

  const handleEditClick = (link: Link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      is_active: link.is_active,
      active_from: link.active_from || null,
      active_to: link.active_to || null,
      is_spacer: link.is_spacer || false,
      custom_icon: link.custom_icon || null,
    });
    setShowAddForm(false);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      try {
        await removeLink(id);
      } catch (err) {
        console.error("Failed to delete link:", err);
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingLink(null);
    setUploadError(null);
    setFormData({
      title: "",
      url: "",
      is_active: true,
      active_from: null,
      active_to: null,
      is_spacer: false,
      custom_icon: null,
    });
  };

  console.log(editingLink);

  return (
    <>
      <Header />
      <div className="px-[8vw] pt-4 sm:pt-6">
        <RouterLink
          to="/admin/dashboard"
          className="font-silkscreen text-sm sm:text-base text-white/80 hover:text-white py-2 touch-manipulation w-fit"
        >
          ← Back to dashboard
        </RouterLink>
      </div>
      <PageTitle title="Manage Links" subtext="Add, edit, and manage active links" className="mt-[5vh]" />
      <div className="flex items-center justify-center mb-8 sm:mb-[10vh] px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px]">
          {(error || uploadError) && (
            <div className="pixel-panel font-pixelify mb-4 p-4 sm:p-5">
              <p className="font-pixelify text-red-400 text-xs sm:text-[10px]">{error || uploadError}</p>
            </div>
          )}

          {!showAddForm && !editingLink && (
            <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setFormData({
                    title: "",
                    url: "",
                    is_active: true,
                    active_from: null,
                    active_to: null,
                    is_spacer: false,
                    custom_icon: null,
                  });
                  setShowAddForm(true);
                }}
                className="pixel-button font-silkscreen min-h-[44px] touch-manipulation"
              >
                Add New Link
              </button>
              <button
                onClick={() => {
                  setFormData({
                    title: "",
                    url: "",
                    is_active: true,
                    active_from: null,
                    active_to: null,
                    is_spacer: true,
                    custom_icon: null,
                  });
                  setShowAddForm(true);
                }}
                className="pixel-button font-silkscreen min-h-[44px] touch-manipulation"
              >
                Add Spacer
              </button>
            </div>
          )}

          {(showAddForm || editingLink) && (
            <div className="pixel-panel font-pixelify relative mb-6 p-6 sm:p-8 md:p-10 lg:px-10 lg:py-12">
              <h2 className="font-pixelify text-white mb-6 text-sm sm:text-xs">
                {editingLink
                  ? formData.is_spacer
                    ? "Edit Spacer"
                    : "Edit Link"
                  : formData.is_spacer
                    ? "Add New Spacer"
                    : "Add New Link"}
              </h2>
              <form onSubmit={editingLink ? handleEditSubmit : handleAddSubmit}>
                <div className="mb-6">
                  <label className="pixel-label font-pixelify flex items-center cursor-pointer gap-2 touch-manipulation">
                    <input
                      type="checkbox"
                      checked={formData.is_spacer || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_spacer: e.target.checked,
                          url: e.target.checked ? "" : formData.url,
                        })
                      }
                      className="w-4 h-4 min-w-[16px] min-h-[16px]"
                    />
                    <span className="font-pixelify text-xs">This is a spacer/divider</span>
                  </label>
                </div>

                <div className="mb-6">
                  <label htmlFor="title" className="pixel-label font-pixelify block mb-4">
                    {formData.is_spacer ? "Spacer Title (optional)" : "Title"}
                    <span className="text-red-400">{formData.is_spacer ? "" : "*"}</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="pixel-input font-pixelify w-full"
                    placeholder={
                      formData.is_spacer
                        ? "Example: Photos! 📷 (leave empty for blank space)"
                        : "Example: Sign up to be a DEVS member"
                    }
                    required={!formData.is_spacer}
                  />
                </div>

                {!formData.is_spacer && (
                  <>
                    <div className="mb-6">
                      <label htmlFor="url" className="pixel-label font-pixelify block mb-4">
                        URL<span className="text-red-400">*</span>
                      </label>
                      <input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="pixel-input font-pixelify w-full"
                        placeholder="https://example.com"
                        required
                      />
                    </div>

                    <div className="mb-6">
                      <label className="pixel-label font-pixelify block mb-4">Custom Icon (optional)</label>
                      <ImageDropZone
                        imageUrl={formData.custom_icon || null}
                        onUpload={(url) => {
                          setUploadError(null);
                          setFormData({ ...formData, custom_icon: url });
                        }}
                        onError={(msg) => setUploadError(msg)}
                      />
                      <p className="font-pixelify text-gray-400 mt-2 text-[10px] sm:text-[8px]">
                        Leave empty to use the website's favicon automatically
                      </p>
                    </div>
                  </>
                )}

                <div className="mb-6">
                  <label className="pixel-label font-pixelify flex items-center cursor-pointer gap-2 touch-manipulation">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 min-w-[16px] min-h-[16px]"
                    />
                    <span className="font-pixelify text-xs">Active</span>
                  </label>
                </div>

                <div className="mb-6">
                  <label htmlFor="active_from" className="pixel-label font-pixelify block mb-4">
                    Active From (optional)
                  </label>
                  <input
                    id="active_from"
                    type="date"
                    value={formData.active_from || ""}
                    onChange={(e) => setFormData({ ...formData, active_from: e.target.value || null })}
                    className="pixel-input font-pixelify w-full"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="active_to" className="pixel-label font-pixelify block mb-4">
                    Active To (optional)
                  </label>
                  <input
                    id="active_to"
                    type="date"
                    value={formData.active_to || ""}
                    onChange={(e) => setFormData({ ...formData, active_to: e.target.value || null })}
                    className="pixel-input font-pixelify w-full"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                  <button type="submit" className="pixel-button font-silkscreen min-h-[44px] touch-manipulation">
                    {editingLink
                      ? formData.is_spacer
                        ? "Update Spacer"
                        : "Update Link"
                      : formData.is_spacer
                        ? "Add Spacer"
                        : "Add Link"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="pixel-button font-silkscreen min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="pixel-panel relative p-6 sm:p-8 md:p-10 lg:px-10 lg:py-12 min-w-0">
            <h2 className="font-pixelify text-white mb-6 text-sm sm:text-xs">All Links ({links.length})</h2>
            {links.length === 0 ? (
              <p className="font-pixelify text-white text-center text-xs sm:text-[10px]">
                No links yet. Add your first link!
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-4">
                    {links.map((link) => {
                      const isCurrentlyActive =
                        link.is_active &&
                        (!link.active_from || new Date(link.active_from) <= new Date()) &&
                        (!link.active_to || new Date(link.active_to) >= new Date());

                      return (
                        <SortableLinkItem
                          key={link.id}
                          link={link}
                          isCurrentlyActive={isCurrentlyActive}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteClick}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ManageLinks;