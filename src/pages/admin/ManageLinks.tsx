import React, { useState } from 'react';
import Header from '../../components/Header';
import { PageTitle } from '../../components/PageTitle';
import { useAdminDashboard } from '../../lib/adminDashboardController';
import { useLinksManagement, Link, LinkFormData, getFaviconUrl } from '../../lib/linksController';

const ManageLinks: React.FC = () => {
  const { loading: authLoading, authorized } = useAdminDashboard();
  const { links, loading, error, addLink, editLink, removeLink, reorderLink } = useLinksManagement();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState<LinkFormData>({
    title: '',
    url: '',
    is_active: true,
    active_from: null,
    active_to: null,
    is_spacer: false,
    custom_icon: null,
  });

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center mt-[20vh]">
          <p className="font-pixelify text-white">Loading...</p>
        </div>
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
      alert('URL is required for links');
      return;
    }

    // Validate date range
    if (formData.active_from && formData.active_to &&
      new Date(formData.active_from) > new Date(formData.active_to)) {
      alert('Active From date must be before or equal to Active To date');
      return;
    }

    try {
      await addLink(formData);
      setFormData({
        title: '',
        url: '',
        is_active: true,
        active_from: null,
        active_to: null,
        is_spacer: false,
        custom_icon: null,
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add link:', err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    if (!formData.is_spacer && !formData.url.trim()) {
      alert('URL is required for links');
      return;
    }

    try {
      await editLink(editingLink.id, formData);
      setEditingLink(null);
      setFormData({
        title: '',
        url: '',
        is_active: true,
        active_from: null,
        active_to: null,
        is_spacer: false,
        custom_icon: null,
      });
    } catch (err) {
      console.error('Failed to update link:', err);
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
    if (window.confirm('Are you sure you want to delete this link?')) {
      try {
        await removeLink(id);
      } catch (err) {
        console.error('Failed to delete link:', err);
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingLink(null);
    setFormData({
      title: '',
      url: '',
      is_active: true,
      active_from: null,
      active_to: null,
      is_spacer: false,
      custom_icon: null,
    });
  };

  return (
    <>
      <Header />
      <PageTitle
        image="/theme/title_icon.png"
        title="Manage Links"
        subtext="Add, edit, and manage active links"
        className="mt-[5vh]"
      />
      <div className="flex items-center justify-center mt-[10vh] mb-[10vh] px-4 py-12">
        <div className="w-[50vw] max-w-[900px] min-w-[650px]">
          {error && (
            <div className="pixel-panel font-pixelify mb-4" style={{ padding: '16px 20px' }}>
              <p className="font-pixelify text-red-400" style={{ fontSize: '10px' }}>
                {error}
              </p>
            </div>
          )}

          {!showAddForm && !editingLink && (
            <div className="mb-6 flex gap-4">
              <button
                onClick={() => {
                  setFormData({
                    title: '',
                    url: '',
                    is_active: true,
                    active_from: null,
                    active_to: null,
                    is_spacer: false,
                    custom_icon: null,
                  });
                  setShowAddForm(true);
                }}
                className="pixel-button font-silkscreen"
              >
                Add New Link
              </button>
              <button
                onClick={() => {
                  setFormData({
                    title: '',
                    url: '',
                    is_active: true,
                    active_from: null,
                    active_to: null,
                    is_spacer: true,
                    custom_icon: null,
                  });
                  setShowAddForm(true);
                }}
                className="pixel-button font-silkscreen"
              >
                Add Spacer
              </button>
            </div>
          )}

          {(showAddForm || editingLink) && (
            <div className="pixel-panel font-pixelify relative mb-6" style={{ padding: '48px 40px' }}>
              <h2 className="font-pixelify text-white mb-6" style={{ fontSize: '12px' }}>
                {editingLink
                  ? (formData.is_spacer ? 'Edit Spacer' : 'Edit Link')
                  : (formData.is_spacer ? 'Add New Spacer' : 'Add New Link')
                }
              </h2>
              <form onSubmit={editingLink ? handleEditSubmit : handleAddSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label className="pixel-label font-pixelify flex items-center cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.is_spacer || false}
                      onChange={(e) => setFormData({ ...formData, is_spacer: e.target.checked, url: e.target.checked ? '' : formData.url })}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="font-pixelify text-xs">This is a spacer/divider</span>
                  </label>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="title" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
                    {formData.is_spacer ? 'Spacer Title (optional)' : 'Title'}<span className="text-red-400">{formData.is_spacer ? '' : '*'}</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="pixel-input font-pixelify w-full"
                    placeholder={formData.is_spacer ? "Example: Photos! 📷 (leave empty for blank space)" : "Example: Sign up to be a DEVS member"}
                    required={!formData.is_spacer}
                  />
                </div>

                {!formData.is_spacer && (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <label htmlFor="url" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
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

                    <div style={{ marginBottom: '24px' }}>
                      <label htmlFor="custom_icon" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
                        Custom Icon URL (optional)
                      </label>
                      <input
                        id="custom_icon"
                        type="url"
                        value={formData.custom_icon || ''}
                        onChange={(e) => setFormData({ ...formData, custom_icon: e.target.value || null })}
                        className="pixel-input font-pixelify w-full"
                        placeholder="https://example.com/icon.png"
                      />
                      <p className="font-pixelify text-gray-400 mt-2" style={{ fontSize: '8px' }}>
                        Leave empty to use the website's favicon automatically
                      </p>
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <label className="pixel-label font-pixelify flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="font-pixelify text-xs">Active</span>
                  </label>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="active_from" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
                    Active From (optional)
                  </label>
                  <input
                    id="active_from"
                    type="date"
                    value={formData.active_from || ''}
                    onChange={(e) => setFormData({ ...formData, active_from: e.target.value || null })}
                    className="pixel-input font-pixelify w-full"
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="active_to" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
                    Active To (optional)
                  </label>
                  <input
                    id="active_to"
                    type="date"
                    value={formData.active_to || ''}
                    onChange={(e) => setFormData({ ...formData, active_to: e.target.value || null })}
                    className="pixel-input font-pixelify w-full"
                  />
                </div>

                <div className="flex gap-4">
                  <button type="submit" className="pixel-button font-silkscreen">
                    {editingLink ? (formData.is_spacer ? 'Update Spacer' : 'Update Link') : (formData.is_spacer ? 'Add Spacer' : 'Add Link')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="pixel-button font-silkscreen"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="pixel-panel relative" style={{ padding: '48px 40px' }}>
            <h2 className="font-pixelify text-white mb-6" style={{ fontSize: '12px' }}>
              All Links ({links.length})
            </h2>
            {links.length === 0 ? (
              <p className="font-pixelify text-white text-center" style={{ fontSize: '10px' }}>
                No links yet. Add your first link!
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {links.map((link, index) => {
                  const isCurrentlyActive = link.is_active &&
                    (!link.active_from || new Date(link.active_from) <= new Date()) &&
                    (!link.active_to || new Date(link.active_to) >= new Date());

                  // Render spacer differently
                  if (link.is_spacer) {
                    return (
                      <div
                        key={link.id}
                        className="pixel-panel font-pixelify text-[1rem] flex items-start gap-4 p-6 border-2 border-white border-opacity-20 rounded border-dashed"
                        style={{ maxWidth: '100%', wordBreak: 'break-word', backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: '1rem' }}
                      >
                        {/* Reordering Controls */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => reorderLink(link.id, 'up')}
                            disabled={index === 0}
                            className="pixel-button font-silkscreen flex-shrink-0"
                            style={{
                              fontSize: '8px',
                              padding: '6px 16px',
                              minWidth: '40px',
                              opacity: index === 0 ? 0.5 : 1
                            }}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => reorderLink(link.id, 'down')}
                            disabled={index === links.length - 1}
                            className="pixel-button font-silkscreen flex-shrink-0"
                            style={{
                              fontSize: '8px',
                              padding: '6px 16px',
                              minWidth: '40px',
                              opacity: index === links.length - 1 ? 0.5 : 1
                            }}
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>

                        {/* Spacer Content */}
                        <div className="flex-1 min-w-0" style={{ maxWidth: '100%' }}>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="font-pixelify text-white opacity-70" style={{ fontSize: '10px' }}>
                              {link.title || '(Empty Space)'}
                            </span>
                            <span className="font-pixelify text-gray-500" style={{ fontSize: '8px' }}>
                              SPACER
                            </span>
                            {isCurrentlyActive && (
                              <span className="font-pixelify text-green-400" style={{ fontSize: '8px' }}>
                                ACTIVE
                              </span>
                            )}
                            {!isCurrentlyActive && (
                              <span className="font-pixelify text-gray-400" style={{ fontSize: '8px' }}>
                                INACTIVE
                              </span>
                            )}
                          </div>
                          {(link.active_from || link.active_to) && (
                            <div className="text-gray-500 text-xs mt-2">
                              {link.active_from && `From: ${new Date(link.active_from).toLocaleDateString()}`}
                              {link.active_from && link.active_to && ' | '}
                              {link.active_to && `To: ${new Date(link.active_to).toLocaleDateString()}`}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditClick(link)}
                            className="pixel-button font-silkscreen"
                            style={{ fontSize: '8px', padding: '8px 16px', whiteSpace: 'nowrap' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(link.id)}
                            className="pixel-button font-silkscreen"
                            style={{ fontSize: '8px', padding: '8px 16px', whiteSpace: 'nowrap' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Regular link rendering
                  return (
                    <div
                      key={link.id}
                      className="pixel-panel font-pixelify text-[1rem] flex items-center gap-4 p-6 border-2 border-white border-opacity-30 rounded"
                      style={{ maxWidth: '100%', wordBreak: 'break-word', marginBottom: '1rem' }}
                    >
                      {/* Reordering Controls */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => reorderLink(link.id, 'up')}
                          disabled={index === 0}
                          className="pixel-button font-silkscreen flex-shrink-0"
                          style={{
                            fontSize: '8px',
                            padding: '6px 10px',
                            minWidth: '40px',
                            opacity: index === 0 ? 0.5 : 1
                          }}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => reorderLink(link.id, 'down')}
                          disabled={index === links.length - 1}
                          className="pixel-button font-silkscreen flex-shrink-0"
                          style={{
                            fontSize: '8px',
                            padding: '6px 10px',
                            minWidth: '40px',
                            opacity: index === links.length - 1 ? 0.5 : 1
                          }}
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>

                      {/* Icon - custom or favicon */}
                      <img
                        src={link.custom_icon || getFaviconUrl(link.url)}
                        alt={`${link.title} icon`}
                        className="flex-shrink-0 mt-1 object-contain rounded w-[40px] h-[40px] min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px]"
                        style={{ imageRendering: 'auto' }}
                      />

                      {/* Link Content */}
                      <div className="flex-1 min-w-0" style={{ maxWidth: '100%' }}>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-pixelify text-white text-[1rem]">
                            {link.title}
                          </span>
                          {isCurrentlyActive && (
                            <span className="font-pixelify text-green-400 text-[0.8rem]">
                              ACTIVE
                            </span>
                          )}
                          {!isCurrentlyActive && (
                            <span className="font-pixelify text-gray-400 text-[0.8rem]">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-pixelify text-gray-400 text-[0.8rem] hover:text-white break-all block"
                          style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                        >
                          {link.url}
                        </a>
                        {(link.active_from || link.active_to) && (
                          <div className="font-pixelify text-gray-500 text-[0.8rem] mt-2">
                            {link.active_from && `From: ${new Date(link.active_from).toLocaleDateString()}`}
                            {link.active_from && link.active_to && ' | '}
                            {link.active_to && `To: ${new Date(link.active_to).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditClick(link)}
                          className="pixel-button font-silkscreen"
                          style={{ fontSize: '8px', padding: '8px 16px', whiteSpace: 'nowrap' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(link.id)}
                          className="pixel-button font-silkscreen"
                          style={{ fontSize: '8px', padding: '8px 16px', whiteSpace: 'nowrap' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageLinks;
