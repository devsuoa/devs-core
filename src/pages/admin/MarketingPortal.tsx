import React from 'react';
import Header from '../../components/Header';
import { PageTitle } from '../../components/PageTitle';
import { useMarketingPortal } from '../../lib/marketingPortalController';


/**
 * The marketing portal page for submitting marketing requests for events or sponsorship posts.
 * Event & Sponsorship posts have seperate requirements and fields
 * There are some common fields that are shared between the two types of posts
 * @returns The Marketing Portal page
 */
const MarketingPortal: React.FC = () => {
  const {
    postType,
    showDialog,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    eventDescription,
    eventSuggestions,
    sponsorName,
    sponsorshipEmailDate,
    sponsorshipPostDate,
    sponsorshipEventName,
    sponsorshipLinks,
    sponsorshipDescription,
    marketingDescription,
    preWrittenCaptions,
    setPostType,
    setEventName,
    setEventDate,
    setEventTime,
    setEventLocation,
    setEventDescription,
    setEventSuggestions,
    setSponsorName,
    setSponsorshipEmailDate,
    setSponsorshipPostDate,
    setSponsorshipEventName,
    setSponsorshipLinks,
    setSponsorshipDescription,
    setMarketingDescription,
    setPreWrittenCaptions,
    handleSubmit,
  } = useMarketingPortal();

  return (
    <>
      <Header />
      <PageTitle
        image="/icon_logo.png"
        title="Marketing Requests"
        subtext="Submit a marketing request for an event or sponsorship post. Please fill out the form as early as possible."
        className='mt-[5vh]'
      />
      <div className="flex items-center justify-center mt-[10vh] mb-[10vh] px-4 py-12">
        <div className="w-[50vw] max-w-[900px] min-w-[650px]">
          <div className="pixel-panel relative" style={{ padding: '48px 40px' }}>
            {showDialog ? (
              <div className="flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
                <h2 className="pixel-text text-white text-center mb-4" style={{ fontSize: '12px' }}>
                  Request submitted!
                </h2>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
              {/* Post Type Selection */}
              <div style={{ marginBottom: '40px' }}>
                <label className="pixel-label block" style={{ marginBottom: '16px' }}>
                  Is this for an event or sponsorship post?<span className="text-red-400">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="postType"
                      value="event"
                      checked={postType === 'event'}
                      onChange={(e) => setPostType(e.target.value as 'event' | 'sponsorship')}
                      className="mr-2"
                      required
                    />
                    <span className="pixel-text text-xs">Event</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="postType"
                      value="sponsorship"
                      checked={postType === 'sponsorship'}
                      onChange={(e) => setPostType(e.target.value as 'event' | 'sponsorship')}
                      className="mr-2"
                      required
                    />
                    <span className="pixel-text text-xs">Sponsorship</span>
                  </label>
                </div>
              </div>

              {/* Event Fields */}
              {postType === 'event' && (
                <>
                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="eventName" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Name of the Event<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="eventName"
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="pixel-input w-full"
                      placeholder="Example: DEVS x SESA Kpop Dance Workshop or Leetcode Workshop"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="eventDate" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Date of Event<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="pixel-input w-full"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="eventTime" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Time of Event<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="eventTime"
                      type="text"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="pixel-input w-full"
                      placeholder="Example: 6pm - 8pm"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="eventLocation" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Location of Event<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="eventLocation"
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="pixel-input w-full"
                      placeholder="Example: 201-311 (new arts)"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="eventDescription" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Description of Event<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="eventDescription"
                      type="text"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="pixel-input w-full"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="eventSuggestions" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Any suggestions?
                    </label>
                    <input
                      id="eventSuggestions"
                      type="text"
                      value={eventSuggestions}
                      onChange={(e) => setEventSuggestions(e.target.value)}
                      className="pixel-input w-full"
                    />
                  </div>
                </>
              )}

              {/* Sponsorship Fields */}
              {postType === 'sponsorship' && (
                <>
                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="sponsorName" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Name of the Sponsor<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="sponsorName"
                      type="text"
                      value={sponsorName}
                      onChange={(e) => setSponsorName(e.target.value)}
                      className="pixel-input w-full"
                      placeholder="Example: IMC, Optiver, Visa..."
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="sponsorshipEmailDate" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Sponsorship Email Request Received On<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="sponsorshipEmailDate"
                      type="date"
                      value={sponsorshipEmailDate}
                      onChange={(e) => setSponsorshipEmailDate(e.target.value)}
                      className="pixel-input w-full"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="sponsorshipPostDate" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Date it needs to be posted by?
                    </label>
                    <input
                      id="sponsorshipPostDate"
                      type="date"
                      value={sponsorshipPostDate}
                      onChange={(e) => setSponsorshipPostDate(e.target.value)}
                      className="pixel-input w-full"
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="sponsorshipEventName" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Name of the Sponsorship Event<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="sponsorshipEventName"
                      type="text"
                      value={sponsorshipEventName}
                      onChange={(e) => setSponsorshipEventName(e.target.value)}
                      className="pixel-input w-full"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="sponsorshipLinks" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Related Hyperlinks<span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="sponsorshipLinks"
                      value={sponsorshipLinks}
                      onChange={(e) => setSponsorshipLinks(e.target.value)}
                      className="pixel-input w-full"
                      style={{ minHeight: '100px', resize: 'vertical' }}
                      placeholder="Links they want us to include on our social media"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="sponsorshipDescription" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Description of the Sponsorship<span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="sponsorshipDescription"
                      value={sponsorshipDescription}
                      onChange={(e) => setSponsorshipDescription(e.target.value)}
                      className="pixel-input w-full"
                      style={{ minHeight: '100px', resize: 'vertical' }}
                      required
                    />
                  </div>
                </>
              )}

              {/* Common Fields */}
              {postType && (
                <>
                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="marketingDescription" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Description/Purpose of Marketing
                    </label>
                    <textarea
                      id="marketingDescription"
                      value={marketingDescription}
                      onChange={(e) => setMarketingDescription(e.target.value)}
                      className="pixel-input w-full"
                      style={{ minHeight: '100px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <label htmlFor="preWrittenCaptions" className="pixel-label block" style={{ marginBottom: '16px' }}>
                      Pre written captions by sponsors : (if any)
                    </label>
                    <textarea
                      id="preWrittenCaptions"
                      value={preWrittenCaptions}
                      onChange={(e) => setPreWrittenCaptions(e.target.value)}
                      className="pixel-input w-full"
                      style={{ minHeight: '100px', resize: 'vertical' }}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-start mt-8">
                <button
                  type="submit"
                  disabled={!postType}
                  className="pixel-button"
                >
                  Submit
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketingPortal;

