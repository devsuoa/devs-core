import { useState, useEffect } from 'react';
import { supabase } from './supabase';

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
    return 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
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
 * Fetch all active links based on date ranges
 */
export async function fetchActiveLinks(): Promise<Link[]> {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching links:', error);
      return [];
    }

    // Filter links that are currently active
    return (data || []).filter(isLinkCurrentlyActive);
  } catch (err) {
    console.error('Error fetching active links:', err);
    return [];
  }
}

/**
 * Fetch all links (for admin)
 */
export async function fetchAllLinks(): Promise<Link[]> {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching links:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching all links:', err);
    return [];
  }
}

/**
 * Get the next display order value
 */
async function getNextDisplayOrder(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 0;
    }

    return (data[0].display_order || 0) + 1;
  } catch (err) {
    console.error('Error getting next display order:', err);
    return 0;
  }
}

/**
 * Create a new link
 */
export async function createLink(linkData: LinkFormData): Promise<Link | null> {
  try {
    // If display_order is not provided, get the next one available
    const displayOrder = linkData.display_order !== undefined 
      ? linkData.display_order 
      : await getNextDisplayOrder();

    // For spacers, URL is not required
    const insertData: any = {
      ...linkData,
      display_order: displayOrder,
      is_spacer: linkData.is_spacer || false,
    };

    // If it's a spacer, set url to empty string
    if (insertData.is_spacer && !insertData.url) {
      insertData.url = '';
    }

    const { data, error } = await supabase
      .from('links')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating link:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error creating link:', err);
    throw err;
  }
}

/**
 * Update an existing link
 */
export async function updateLink(id: string, linkData: Partial<LinkFormData>): Promise<Link | null> {
  try {
    const { data, error } = await supabase
      .from('links')
      .update(linkData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating link:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error updating link:', err);
    throw err;
  }
}

/**
 * Delete a link
 */
export async function deleteLink(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  } catch (err) {
    console.error('Error deleting link:', err);
    throw err;
  }
}

/**
 * Update link display order
 */
export async function updateLinkOrder(id: string, newOrder: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('links')
      .update({ display_order: newOrder })
      .eq('id', id);

    if (error) {
      console.error('Error updating link order:', error);
      throw error;
    }
  } catch (err) {
    console.error('Error updating link order:', err);
    throw err;
  }
}

/**
 * Reorder links by swapping two links' display_order
 */
export async function reorderLinks(linkId1: string, linkId2: string): Promise<void> {
  try {
    // Fetch both links display order value
    const { data: links, error: fetchError } = await supabase
      .from('links')
      .select('id, display_order')
      .in('id', [linkId1, linkId2]);

    if (fetchError || !links || links.length !== 2) {
      throw new Error('Failed to fetch links for reordering');
    }

    const link1 = links.find(l => l.id === linkId1);
    const link2 = links.find(l => l.id === linkId2);

    if (!link1 || !link2) {
      throw new Error('One or both links not found');
    }

    // Swap the display_order values
    const tempOrder = link1.display_order;
    
    const { error: error1 } = await supabase
      .from('links')
      .update({ display_order: link2.display_order })
      .eq('id', linkId1);

    if (error1) throw error1;

    const { error: error2 } = await supabase
      .from('links')
      .update({ display_order: tempOrder })
      .eq('id', linkId2);

    if (error2) {
      // Attempt to rollback the first update
      await supabase
        .from('links')
        .update({ display_order: tempOrder })
        .eq('id', linkId1);
      throw error2;
    }
  } catch (err) {
    console.error('Error reordering links:', err);
    throw err;
  }
}

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

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllLinks();
      setLinks(data);
    } catch (err) {
      setError('Failed to load links');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addLink = async (linkData: LinkFormData) => {
    try {
      setError(null);
      await createLink(linkData);
      await loadLinks();
    } catch (err) {
      setError('Failed to create link');
      throw err;
    }
  };

  const editLink = async (id: string, linkData: Partial<LinkFormData>) => {
    try {
      setError(null);
      await updateLink(id, linkData);
      await loadLinks();
    } catch (err) {
      setError('Failed to update link');
      throw err;
    }
  };

  const removeLink = async (id: string) => {
    try {
      setError(null);
      await deleteLink(id);
      await loadLinks();
    } catch (err) {
      setError('Failed to delete link');
      throw err;
    }
  };

  const reorderLink = async (linkId: string, direction: 'up' | 'down') => {
    try {
      setError(null);
      const currentIndex = links.findIndex(l => l.id === linkId);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= links.length) return;

      await reorderLinks(linkId, links[targetIndex].id);
      await loadLinks();
    } catch (err) {
      setError('Failed to reorder link');
      throw err;
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
      setError('Failed to load links');
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

