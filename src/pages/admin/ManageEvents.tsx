import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { PageTitle } from '../../components/PageTitle';
import { useAdminDashboard } from '../../lib/adminDashboardController';
import {
  useEventsManagement,
  uploadEventImage,
  Event,
  EventFormData,
} from '../../lib/manageEventsController';
import { RSVPQuestion, RSVPQuestionType } from '../../lib/eventRsvpTypes';

const buildEmptyEventFormData = (): EventFormData => ({
  title: '',
  description: '',
  image_url: '',
  tag: '',
  event_date: '',
  event_time: '',
  location: '',
  register_url: '',
  is_active: true,
  max_attendees: null,
  group_rsvp_enabled: false,
  group_rsvp_max_emails: null,
  rsvp_questions: [],
  google_sheet_linked: false,
  google_sheet_url: null,
});

const createNewQuestion = (): RSVPQuestion => ({
  id: crypto.randomUUID(),
  prompt: '',
  type: 'text',
  required: false,
  options: [],
});

const ImageDropZone: React.FC<{
  imageUrl: string | null;
  onUpload: (url: string) => void;
  onError: (msg: string) => void;
}> = ({ imageUrl, onUpload, onError }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Only image files are supported.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadEventImage(file);
      onUpload(url);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }, [onUpload, onError]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        className={`pixel-input w-full flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${dragOver ? 'opacity-70' : ''}`}
        style={{ minHeight: '120px', borderStyle: 'dashed', padding: '16px' }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <p className="font-pixelify text-xs text-white/70">Uploading...</p>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Event preview"
              className="max-h-32 max-w-full object-contain"
              style={{ imageRendering: 'auto' }}
            />
            <p className="font-pixelify text-xs text-white/50">Click or drop to replace</p>
          </>
        ) : (
          <>
            <p className="font-pixelify text-xs text-white/70">Drag & drop or click to upload</p>
            <p className="font-pixelify text-xs text-white/40">PNG, JPG, GIF, WEBP</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
};

const ManageEvents: React.FC = () => {
  const { loading: authLoading, authorized } = useAdminDashboard();
  const { events, loading, error, addEvent, editEvent, removeEvent } =
    useEventsManagement();

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EventFormData>(buildEmptyEventFormData());

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <PageTitle title="Manage Events" className="mt-[5vh]" />
        <div className="flex justify-center min-h-[50vh]">
          <p className="font-pixelify text-white">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!authorized) return null;

  const resetForm = () => {
    setFormData(buildEmptyEventFormData());
    setEditingEvent(null);
    setShowForm(false);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizedQuestions = formData.rsvp_questions
        .map((question) => ({
          ...question,
          prompt: question.prompt.trim(),
          options:
            question.type === 'text'
              ? []
              : question.options.map((option) => option.trim()).filter(Boolean),
        }))
        .filter((question) => question.prompt.length > 0);

      const payload: EventFormData = {
        ...formData,
        max_attendees: formData.max_attendees ?? null,
        group_rsvp_max_emails: formData.group_rsvp_enabled
          ? formData.group_rsvp_max_emails ?? null
          : null,
        rsvp_questions: normalizedQuestions,
      };

      if (editingEvent) {
        await editEvent(editingEvent.id, payload);
      } else {
        await addEvent(payload);
      }
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className="px-[8vw] pt-4 sm:pt-6">
        <Link
          to="/admin/dashboard"
          className="font-silkscreen text-sm sm:text-base text-white/80 hover:text-white py-2 touch-manipulation w-fit"
        >
          ← Back to dashboard
        </Link>
      </div>
      <PageTitle
        title="Manage Events"
        subtext="Create and manage upcoming and past events"
        className="mt-[5vh]"
      />

      <div className="flex justify-center px-4 sm:px-6 py-8 sm:py-12 mb-8 sm:mb-[10vh]">
        <div className="w-full max-w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px] min-w-0">

          {(error || uploadError) && (
            <div className="pixel-panel mb-6 p-4 sm:p-5">
              <p className="font-pixelify text-red-400 text-xs">{error || uploadError}</p>
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="pixel-button font-silkscreen text-base sm:text-lg mb-6 min-h-[44px] touch-manipulation"
            >
              Add New Event
            </button>
          )}

          {showForm && (
            <div className="pixel-panel p-6 sm:p-8 md:p-10 mb-6 sm:mb-8">
              <h2 className="font-silkscreen text-white text-sm sm:text-base mb-6">
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
                  className="pixel-input w-full min-h-[100px] resize-y"
                  style={{ marginBottom: '24px' }}
                  placeholder="Description"
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />

                <ImageDropZone
                  imageUrl={formData.image_url || null}
                  onUpload={(url) => { setUploadError(null); setFormData({ ...formData, image_url: url }); }}
                  onError={(msg) => setUploadError(msg)}
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

                <div className="pixel-panel p-4 sm:p-5 mb-6">
                  <h3 className="font-silkscreen text-white text-xs sm:text-sm mb-4">RSVP Settings</h3>

                  <label className="font-pixelify block mb-2 text-xs sm:text-sm text-white/80">
                    Max attendees (optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="pixel-input w-full"
                    style={{ marginBottom: '24px' }}
                    placeholder="Leave blank for unlimited"
                    value={formData.max_attendees ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_attendees: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      id="google-sheet-linked-toggle"
                      type="checkbox"
                      checked={formData.google_sheet_linked}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          google_sheet_linked: e.target.checked,
                          google_sheet_url: e.target.checked ? formData.google_sheet_url : null,
                        })
                      }
                    />
                    <label htmlFor="google-sheet-linked-toggle" className="font-pixelify text-xs sm:text-sm text-white/90">
                      Link RSVPs to a Google Sheet
                    </label>
                  </div>

                  {formData.google_sheet_linked && (
                    <div style={{ marginBottom: '24px' }}>
                      <label className="font-pixelify block mb-2 text-xs sm:text-sm text-white/80">
                        Google Sheet URL
                      </label>
                      <input
                        type="url"
                        className="pixel-input w-full mb-1"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={formData.google_sheet_url || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            google_sheet_url: e.target.value,
                          })
                        }
                      />
                      <p className="font-pixelify text-xs text-blue-400">
                        Make sure to share this sheet with the project service account as an Editor!
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      id="group-rsvp-toggle"
                      type="checkbox"
                      checked={formData.group_rsvp_enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          group_rsvp_enabled: e.target.checked,
                          group_rsvp_max_emails: e.target.checked
                            ? formData.group_rsvp_max_emails
                            : null,
                        })
                      }
                    />
                    <label htmlFor="group-rsvp-toggle" className="font-pixelify text-xs sm:text-sm text-white/90">
                      Enable group RSVP
                    </label>
                  </div>

                  {formData.group_rsvp_enabled && (
                    <>
                      <label className="font-pixelify block mb-2 text-xs sm:text-sm text-white/80">
                        Max emails per RSVP submission
                      </label>
                      <input
                        type="number"
                        min={2}
                        className="pixel-input w-full"
                        style={{ marginBottom: '24px' }}
                        placeholder="e.g. 5"
                        value={formData.group_rsvp_max_emails ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            group_rsvp_max_emails: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                      />
                    </>
                  )}

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="font-silkscreen text-white text-xs sm:text-sm">Additional RSVP questions</p>
                      <button
                        type="button"
                        className="pixel-button text-xs px-3 py-2"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            rsvp_questions: [...prev.rsvp_questions, createNewQuestion()],
                          }))
                        }
                      >
                        Add question
                      </button>
                    </div>

                    {formData.rsvp_questions.length === 0 ? (
                      <p className="font-pixelify text-xs text-white/60">
                        No additional questions configured.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {formData.rsvp_questions.map((question) => (
                          <div key={question.id} className="rounded border border-white/20 p-3">
                            <div className="flex flex-col sm:flex-row gap-3 mb-3">
                              <input
                                className="pixel-input w-full"
                                placeholder="Question prompt"
                                value={question.prompt}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    rsvp_questions: prev.rsvp_questions.map((item) =>
                                      item.id === question.id ? { ...item, prompt: e.target.value } : item
                                    ),
                                  }))
                                }
                              />
                              <select
                                className="pixel-input w-full sm:w-[220px]"
                                value={question.type}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    rsvp_questions: prev.rsvp_questions.map((item) => {
                                      if (item.id !== question.id) return item;
                                      const nextType = e.target.value as RSVPQuestionType;
                                      return {
                                        ...item,
                                        type: nextType,
                                        options: nextType === 'text' ? [] : item.options.length ? item.options : [''],
                                      };
                                    }),
                                  }))
                                }
                              >
                                <option value="text">Short text</option>
                                <option value="single_select">Single select</option>
                                <option value="multi_select">Multi select</option>
                              </select>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mb-3">
                              <label className="font-pixelify text-xs flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={question.required}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      rsvp_questions: prev.rsvp_questions.map((item) =>
                                        item.id === question.id ? { ...item, required: e.target.checked } : item
                                      ),
                                    }))
                                  }
                                />
                                Required
                              </label>

                              <button
                                type="button"
                                className="pixel-button text-xs px-3 py-2 text-red-400! hover:text-red-300!"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    rsvp_questions: prev.rsvp_questions.filter((item) => item.id !== question.id),
                                  }))
                                }
                              >
                                Remove
                              </button>
                            </div>

                            {question.type !== 'text' && (
                              <div className="flex flex-col gap-2">
                                {question.options.map((option, optionIndex) => (
                                  <div key={`${question.id}-option-${optionIndex}`} className="flex items-center gap-2">
                                    <input
                                      className="pixel-input w-full"
                                      placeholder={`Option ${optionIndex + 1}`}
                                      value={option}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          rsvp_questions: prev.rsvp_questions.map((item) => {
                                            if (item.id !== question.id) return item;
                                            const options = [...item.options];
                                            options[optionIndex] = e.target.value;
                                            return { ...item, options };
                                          }),
                                        }))
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="pixel-button text-xs px-3 py-2"
                                      onClick={() =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          rsvp_questions: prev.rsvp_questions.map((item) => {
                                            if (item.id !== question.id) return item;
                                            return {
                                              ...item,
                                              options:
                                                item.options.length <= 1
                                                  ? ['']
                                                  : item.options.filter((_, idx) => idx !== optionIndex),
                                            };
                                          }),
                                        }))
                                      }
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="pixel-button text-xs px-3 py-2 w-fit"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      rsvp_questions: prev.rsvp_questions.map((item) =>
                                        item.id === question.id
                                          ? { ...item, options: [...item.options, ''] }
                                          : item
                                      ),
                                    }))
                                  }
                                >
                                  Add option
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button
                    className="pixel-button font-silkscreen min-h-[44px] touch-manipulation"
                    type="submit"
                  >
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="pixel-button font-silkscreen min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="pixel-panel p-6 sm:p-8 md:p-10 min-w-0">
            <h2 className="font-pixelify text-white text-xs sm:text-sm mb-6">
              All Events ({events.length})
            </h2>

            <div className="flex flex-col gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="pixel-panel p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-pixelify text-white wrap-break-word">
                      {event.title}
                    </p>
                    <p className="font-pixelify text-gray-400 text-xs mt-1">
                      {new Date(event.event_date).toDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Link
                      className="pixel-button text-xs px-4 py-2 min-h-[40px] touch-manipulation flex items-center"
                      to={`/admin/event-attendees?eventId=${event.id}`}
                    >
                      Attendees
                    </Link>
                    <button
                      className="pixel-button text-xs px-4 py-2 min-h-[40px] touch-manipulation"
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
                          max_attendees: event.max_attendees,
                          group_rsvp_enabled: event.group_rsvp_enabled,
                          group_rsvp_max_emails: event.group_rsvp_max_emails,
                          rsvp_questions: Array.isArray(event.rsvp_questions) ? event.rsvp_questions : [],
                          google_sheet_linked: event.google_sheet_linked || false,
                          google_sheet_url: event.google_sheet_url || null,
                        });
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="pixel-button text-xs px-4 py-2 min-h-[40px] touch-manipulation text-red-400! hover:text-red-300!"
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
