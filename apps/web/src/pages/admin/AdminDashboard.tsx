import React from "react";
import { useAdminDashboard } from "../../lib/adminDashboardController";
import Header from "../../components/Header";
import { PageTitle } from "../../components/PageTitle";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";

const AdminDashboard: React.FC = () => {
  const { loading, authorized, onLogout } = useAdminDashboard();
  const navigate = useNavigate();
  if (loading) {
    return (
      <>
        <Header />
        <PageTitle title="Admin Dashboard" className="mt-[5vh]" />
        <div className="flex items-center justify-center h-[80vh]">
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
      <PageTitle title="Admin Dashboard" className="mt-[5vh]" />
      <div className="flex items-center justify-center px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px]">
          <div className="relative bg-transparent border-none px-4 sm:px-6 md:px-10 py-8 sm:py-12">
            <div className="flex flex-col gap-4 sm:gap-6">
              <button
                onClick={() => {
                  navigate("/admin/marketing-request");
                }}
                className="text-left w-full font-silkscreen text-base sm:text-[1.25rem] dashboard-link py-4 sm:py-[12px] px-0 min-h-[48px] touch-manipulation active:opacity-80"
              >
                Marketing Portal
              </button>

              <button
                onClick={() => {
                  navigate("/admin/tasks");
                }}
                className="text-left w-full font-silkscreen text-base sm:text-[1.25rem] dashboard-link py-4 sm:py-[12px] px-0 min-h-[48px] touch-manipulation active:opacity-80"
              >
                Task Tracker
              </button>

              <button
                onClick={() => {
                  navigate("/admin/event-todo");
                }}
                className="text-left w-full font-silkscreen text-base sm:text-[1.25rem] dashboard-link py-4 sm:py-[12px] px-0 min-h-[48px] touch-manipulation active:opacity-80"
              >
                Event To-Do
              </button>

              <button
                onClick={() => {
                  navigate("/admin/manage-events");
                }}
                className="text-left w-full font-silkscreen text-base sm:text-[1.25rem] dashboard-link py-4 sm:py-[12px] px-0 min-h-[48px] touch-manipulation active:opacity-80"
              >
                Manage Events
              </button>

              <button
                onClick={() => {
                  navigate("/admin/event-attendees");
                }}
                className="text-left w-full font-silkscreen text-base sm:text-[1.25rem] dashboard-link py-4 sm:py-[12px] px-0 min-h-[48px] touch-manipulation active:opacity-80"
              >
                Event Attendees
              </button>

              <button
                onClick={() => {
                  navigate("/admin/manage-links");
                }}
                className="text-left w-full font-silkscreen text-base sm:text-[1.25rem] dashboard-link py-4 sm:py-[12px] px-0 min-h-[48px] touch-manipulation active:opacity-80"
              >
                Links
              </button>

              <button
                onClick={() => {
                  navigate("/admin/members");
                }}
                className="text-left w-full font-silkscreen text-base sm:text-[1.25rem] dashboard-link py-4 sm:py-[12px] px-0 min-h-[48px] touch-manipulation active:opacity-80"
              >
                Members
              </button>

              <button
                onClick={onLogout}
                className="text-left w-full font-silkscreen text-base sm:text-[1.25rem] dashboard-link py-4 sm:py-[12px] px-0 min-h-[48px] touch-manipulation active:opacity-80"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminDashboard;
