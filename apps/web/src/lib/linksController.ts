import { useState, useEffect } from "react";
import { api } from "./api";

export interface Link {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
  active_from: string | null;
  active_to: string | null;
  display_order: number;
  is_spacer: boolean;
  custom_icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkFormData {
  title: string;
  url: string;
  is_active: boolean;
  active_from: string | null;
  active_to: string | null;
  display_order?: number;
  is_spacer?: boolean;
  custom_icon?: string | null;
}

/**
 * Get favicon URL for a given domain
 */
export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "https://www.google.com/s2/favicons?domain=example.com&sz=64";
  }
}

/**
 * Check if a link is currently active based on date ranges
 */
export function isLinkCurrentlyActive(link: Link): boolean {
  if (link.is_spacer) {
    return link.is_active;
  }

  if (!link.is_active) {
    return false;
  }

  const now = new Date();
  const activeFrom = link.active_from ? new Date(link.active_from) : null;
  const activeTo = link.active_to ? new Date(link.active_to) : null;

  // If no dates are set, link is active if is_active is true
  if (!activeFrom && !activeTo) {
    return true;
  }

  // Check if current date is within range
  if (activeFrom && now < activeFrom) {
    return false;
  }

  if (activeTo && now > activeTo) {
    return false;
  }

  return true;
}

/**
 * Fetch the links visitors should see. The API applies the active and date-range rules;
 * filtering again here keeps the page right if a link expires while it is open.
 */
export async function fetchActiveLinks(): Promise<Link[]> {
  try {
    const data = await api<Link[]>("/api/links");
    return data.filter(isLinkCurrentlyActive);
  } catch (err) {
    console.error("Error fetching active links:", err);
    return [];
  }
}

/**
 * Fetch all links (for admin)
 */
export async function fetchAllLinks(): Promise<Link[]> {
  try {
    return await api<Link[]>("/api/admin/links");
  } catch (err) {
    console.error("Error fetching all links:", err);
    return [];
  }
}

/**
 * Create a new link. Without a display_order it goes to the end of the list.
 */
export async function createLink(linkData: LinkFormData): Promise<Link | null> {
  try {
    return await api<Link>("/api/admin/links", { method: "POST", body: linkData });
  } catch (err) {
    console.error("Error creating link:", err);
    throw err;
  }
}

/**
 * Update an existing link. Send the whole form: the API replaces every field.
 */
export async function updateLink(
  id: string,
  linkData: Partial<LinkFormData>,
): Promise<Link | null> {
  try {
    return await api<Link>(`/api/admin/links/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: linkData,
    });
  } catch (err) {
    console.error("Error updating link:", err);
    throw err;
  }
}

/**
 * Delete a link
 */
export async function deleteLink(id: string): Promise<void> {
  try {
    await api(`/api/admin/links/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    console.error("Error deleting link:", err);
    throw err;
  }
}

/**
 * Save a new order in one request: links are ordered by their display_order here.
 */
export async function updateLinkOrder(
  linksToUpdate: { id: string; display_order: number }[],
): Promise<void> {
  try {
    const ids = [...linksToUpdate]
      .sort((a, b) => a.display_order - b.display_order)
      .map((l) => l.id);
    await api("/api/admin/links/order", { method: "PUT", body: { ids } });
  } catch (err) {
    console.error("Error updating link order:", err);
    throw err;
  }
}

/**
 * Swap two links' positions.
 */
export async function reorderLinks(linkId1: string, linkId2: string): Promise<void> {
  const links = await fetchAllLinks();
  const ids = links.map((l) => l.id);
  const a = ids.indexOf(linkId1);
  const b = ids.indexOf(linkId2);
  if (a === -1 || b === -1) throw new Error("Link not found");
  [ids[a], ids[b]] = [ids[b], ids[a]];
  await api("/api/admin/links/order", { method: "PUT", body: { ids } });
}

/**
 * Hook for managing links in admin pages
 */
/**
 * Hook for managing links in admin pages
 */
export function useLinksManagement() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async (showLoadingScreen = true) => {
    try {
      if (showLoadingScreen) setLoading(true);
      setError(null);
      const data = await fetchAllLinks();
      setLinks(data);
    } catch (err) {
      setError("Failed to load links");
      console.error(err);
    } finally {
      if (showLoadingScreen) setLoading(false);
    }
  };

  const addLink = async (linkData: LinkFormData) => {
    try {
      setError(null);
      await createLink(linkData);
      await loadLinks(false);
    } catch (err) {
      setError("Failed to create link");
      throw err;
    }
  };

  const editLink = async (id: string, linkData: Partial<LinkFormData>) => {
    try {
      setError(null);
      await updateLink(id, linkData);
      await loadLinks(false);
    } catch (err) {
      setError("Failed to update link");
      throw err;
    }
  };

  const removeLink = async (id: string) => {
    try {
      setError(null);
      await deleteLink(id);
      await loadLinks(false);
    } catch (err) {
      setError("Failed to delete link");
      throw err;
    }
  };

  const reorderLink = async (newOrderedLinks: Link[]) => {
    try {
      setError(null);

      // Optimistically update the UI instantly
      setLinks(newOrderedLinks);

      // Re-index the display_order based on the new array positions
      const updates = newOrderedLinks.map((link, index) => ({
        id: link.id,
        display_order: index,
      }));

      await updateLinkOrder(updates);
      await loadLinks(false); // Silently reload to ensure DB parity
    } catch (err) {
      setError("Failed to reorder links");
      await loadLinks(false); // Revert UI if it failed
    }
  };

  return {
    links,
    loading,
    error,
    addLink,
    editLink,
    removeLink,
    reorderLink,
    refreshLinks: loadLinks,
  };
}

/**
 * Upload a custom icon image through the API and return its public URL
 */
export const uploadLinkIcon = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  const { url } = await api<{ url: string }>("/api/admin/uploads/link-icon", {
    method: "POST",
    form,
  });
  return url;
};

/**
 * Hook for displaying active links on public page
 */
export function useActiveLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveLinks();
  }, []);

  const loadActiveLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActiveLinks();
      setLinks(data);
    } catch (err) {
      setError("Failed to load links");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    links,
    loading,
    error,
    refreshLinks: loadActiveLinks,
  };
}
