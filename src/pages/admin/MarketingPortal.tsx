import React from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { PageTitle } from "../../components/PageTitle";
import { useMarketingPortal } from "../../lib/marketingPortalController";
import { useAdminDashboard } from "../../lib/adminDashboardController";

/**
 * The marketing portal page for submitting marketing requests for events or sponsorship posts.
 * Event & Sponsorship posts have seperate requirements and fields
 * There are some common fields that are shared between the two types of posts
 * @returns The Marketing Portal page
 */
const MarketingPortal: React.FC = () => {
  const { loading, authorized } = useAdminDashboard();
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
    closeDialog,
    isSubmitting,
  } = useMarketingPortal();

  if (loading) {
    return (
      <>
        <Header />
        <PageTitle title="Marketing Requests" className="mt-[5vh]" />
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
        title="Marketing Requests"
        subtext="Submit a marketing request for an event or sponsorship post. Please fill out the form as early as possible."
        className="mt-[5vh]"
      />
      <div className="flex items-center justify-center mb-8 sm:mb-[10vh] px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px]">
          <div className="pixel-panel relative p-6 sm:p-8 md:p-10 lg:px-10 lg:py-12">
            {showDialog ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] sm:min-h-[400px] py-12 gap-6">
                <div className="font-pixelify text-green-400 text-lg sm:text-xl text-center mb-2">
                  Request submitted!
                </div>
                <p className="font-rethink text-gray-300 text-sm text-center max-w-sm">
                  Your marketing request has been received. The marketing team
                  will be notified.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="pixel-button font-silkscreen min-h-[44px] min-w-[160px] touch-manipulation"
                  >
                    Submit another
                  </button>
                  <Link
                    to="/admin/dashboard"
                    className="pixel-button font-silkscreen min-h-[44px] min-w-[160px] touch-manipulation border-white/60 flex items-center justify-center"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Post Type Selection */}
                <div className="mb-8 sm:mb-10">
                  <label className="pixel-label font-pixelify block mb-4">
                    Is this for an event or sponsorship post?
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer touch-manipulation transition-colors ${
                        postType === "event"
                          ? "border-white bg-white/10"
                          : "border-white/40 hover:border-white/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="postType"
                        value="event"
                        checked={postType === "event"}
                        onChange={(e) =>
                          setPostType(e.target.value as "event" | "sponsorship")
                        }
                        className="sr-only"
                        required
                      />
                      <span className="font-pixelify text-sm sm:text-base text-white">
                        Event
                      </span>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer touch-manipulation transition-colors ${
                        postType === "sponsorship"
                          ? "border-white bg-white/10"
                          : "border-white/40 hover:border-white/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="postType"
                        value="sponsorship"
                        checked={postType === "sponsorship"}
                        onChange={(e) =>
                          setPostType(e.target.value as "event" | "sponsorship")
                        }
                        className="sr-only"
                        required
                      />
                      <span className="font-pixelify text-sm sm:text-base text-white">
                        Sponsorship
                      </span>
                    </label>
                  </div>
                </div>

                {/* Event Fields */}
                {postType === "event" && (
                  <div className="space-y-8 sm:space-y-10">
                    <div>
                      <label
                        htmlFor="eventName"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Name of the Event<span className="text-red-400">*</span>
                      </label>
                      <input
                        id="eventName"
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                        placeholder="Example: DEVS x SESA Kpop Dance Workshop or Leetcode Workshop"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="eventDate"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Date of Event<span className="text-red-400">*</span>
                      </label>
                      <input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="eventTime"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Time of Event<span className="text-red-400">*</span>
                      </label>
                      <input
                        id="eventTime"
                        type="text"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                        placeholder="Example: 6pm - 8pm"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="eventLocation"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Location of Event<span className="text-red-400">*</span>
                      </label>
                      <input
                        id="eventLocation"
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                        placeholder="Example: 201-311 (new arts)"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="eventDescription"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Description of Event
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="eventDescription"
                        type="text"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="eventSuggestions"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Any suggestions?
                      </label>
                      <input
                        id="eventSuggestions"
                        type="text"
                        value={eventSuggestions}
                        onChange={(e) => setEventSuggestions(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Sponsorship Fields */}
                {postType === "sponsorship" && (
                  <div className="space-y-8 sm:space-y-10">
                    <div>
                      <label
                        htmlFor="sponsorName"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Name of the Sponsor
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="sponsorName"
                        type="text"
                        value={sponsorName}
                        onChange={(e) => setSponsorName(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                        placeholder="Example: IMC, Optiver, Visa..."
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sponsorshipEmailDate"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Sponsorship Email Request Received On
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="sponsorshipEmailDate"
                        type="date"
                        value={sponsorshipEmailDate}
                        onChange={(e) =>
                          setSponsorshipEmailDate(e.target.value)
                        }
                        className="pixel-input font-pixelify w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sponsorshipPostDate"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Date it needs to be posted by?
                      </label>
                      <input
                        id="sponsorshipPostDate"
                        type="date"
                        value={sponsorshipPostDate}
                        onChange={(e) => setSponsorshipPostDate(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sponsorshipEventName"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Name of the Sponsorship Event
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="sponsorshipEventName"
                        type="text"
                        value={sponsorshipEventName}
                        onChange={(e) =>
                          setSponsorshipEventName(e.target.value)
                        }
                        className="pixel-input font-pixelify w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sponsorshipLinks"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Related Hyperlinks
                        <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="sponsorshipLinks"
                        value={sponsorshipLinks}
                        onChange={(e) => setSponsorshipLinks(e.target.value)}
                        className="pixel-input font-pixelify w-full min-h-[100px] resize-y"
                        placeholder="Links they want us to include on our social media"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sponsorshipDescription"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Description of the Sponsorship
                        <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="sponsorshipDescription"
                        value={sponsorshipDescription}
                        onChange={(e) =>
                          setSponsorshipDescription(e.target.value)
                        }
                        className="pixel-input font-pixelify w-full min-h-[100px] resize-y"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Common Fields */}
                {postType && (
                  <div className="space-y-8 sm:space-y-10 mt-8 sm:mt-10">
                    <div>
                      <label
                        htmlFor="marketingDescription"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Description/Purpose of Marketing
                      </label>
                      <textarea
                        id="marketingDescription"
                        value={marketingDescription}
                        onChange={(e) =>
                          setMarketingDescription(e.target.value)
                        }
                        className="pixel-input font-pixelify w-full min-h-[100px] resize-y"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="preWrittenCaptions"
                        className="pixel-label font-pixelify block mb-4"
                      >
                        Pre written captions by sponsors : (if any)
                      </label>
                      <textarea
                        id="preWrittenCaptions"
                        value={preWrittenCaptions}
                        onChange={(e) => setPreWrittenCaptions(e.target.value)}
                        className="pixel-input font-pixelify w-full min-h-[100px] resize-y"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-start mt-6 sm:mt-8">
                  <button
                    type="submit"
                    disabled={!postType || isSubmitting}
                    className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MarketingPortal;
