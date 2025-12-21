import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { PageTitle } from '../../components/PageTitle';
import { useAdminDashboard } from '../../lib/adminDashboardController';
import {
  useEventsManagement,
  Event,
  EventFormData,
} from '../../lib/manageEventsController';

const ManageEvents: React.FC = () => {
  const { loading: authLoading, authorized } = useAdminDashboard();
  const { events, loading, error, addEvent, editEvent, removeEvent } =
    useEventsManagement();

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    image_url: '',
    tag: '',
    event_date: '',
    event_time: '',
    location: '',
    register_url: '',
    is_active: true,
  });

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center mt-[20vh]">
          <p className="font-pixelify text-white">Loading...</p>
        </div>
      </>
    );
  }

  if (!authorized) return null;

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      tag: '',
      event_date: '',
      event_time: '',
      location: '',
      register_url: '',
      is_active: true,
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await editEvent(editingEvent.id, formData);
      } else {
        await addEvent(formData);
      }
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <PageTitle
        image="/theme/title_icon.png"
        title="Manage Events"
        subtext="Create and manage upcoming and past events"
        className="mt-[5vh]"
      />

      <div className="flex justify-center px-4 py-12 mb-[10vh]">
        <div className="w-[50vw] min-w-[650px] max-w-[900px]">

          {error && (
            <div className="pixel-panel mb-6 p-4">
              <p className="font-pixelify text-red-400 text-xs">{error}</p>
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="pixel-button font-silkscreen text-lg mb-6"
            >
              Add New Event
            </button>
          )}

          {showForm && (
            <div className="pixel-panel p-10 mb-8">
              <h2 className="font-silkscreen text-white text-m mb-6">
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6 font-pixelify">
                <input
                  className="pixel-input w-full"
                  style={{ marginBottom: '24px' }}
                  placeholder="Title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />

                <textarea
                  className="pixel-input w-full"
                  style={{ marginBottom: '24px' }}
                  placeholder="Description"
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />

                <input
                  className="pixel-input w-full"
                  style={{ marginBottom: '24px' }}
                  placeholder="Image URL"
                  value={formData.image_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />

                <input
                  className="pixel-input w-full"
                  style={{ marginBottom: '24px' }}
                  placeholder="Tag (Workshop, Social, Talk)"
                  value={formData.tag || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value })
                  }
                />

                <input
                  type="date"
                  className="pixel-input w-full"
                  style={{ marginBottom: '24px' }}
                  required
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                />

                <input
                  className="pixel-input w-full"
                  style={{ marginBottom: '24px' }}
                  placeholder="Time (e.g. 6:00 PM)"
                  value={formData.event_time || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, event_time: e.target.value })
                  }
                />

                <input
                  className="pixel-input w-full"
                  style={{ marginBottom: '24px' }}
                  placeholder="Location"
                  value={formData.location || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />

                <input
                type="url"
                className="pixel-input w-full"
                style={{ marginBottom: '24px' }}
                placeholder="Register URL (https://...)"
                value={formData.register_url || ''}
                onChange={(e) =>
                    setFormData({ ...formData, register_url: e.target.value })
                }
                />

                <div className="flex gap-4">
                  <button className="pixel-button font-silkscreen" type="submit">
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="pixel-button font-silkscreen"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="pixel-panel p-10">
            <h2 className="font-pixelify text-white text-xs mb-6">
              All Events ({events.length})
            </h2>

            <div className="flex flex-col gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="pixel-panel p-6 flex justify-between items-start"
                >
                  <div>
                    <p className="font-pixelify text-white">
                      {event.title}
                    </p>
                    <p className="font-pixelify text-gray-400 text-xs">
                      {new Date(event.event_date).toDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="pixel-button text-xs"
                      onClick={() => {
                        setEditingEvent(event);
                        setFormData({
                          title: event.title,
                          description: event.description || '',
                          image_url: event.image_url || '',
                          tag: event.tag || '',
                          event_date: event.event_date,
                          event_time: event.event_time || '',
                          location: event.location || '',
                          register_url: event.register_url || '',
                          is_active: event.is_active,
                        });
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="pixel-button text-xs"
                      onClick={() => removeEvent(event.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ManageEvents;
