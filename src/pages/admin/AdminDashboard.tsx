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
        <PageTitle image="/theme/title_icon.png" title="Admin Dashboard" className="mt-[5vh]" />
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
      <PageTitle image="/theme/title_icon.png" title="Admin Dashboard" className="mt-[5vh]" />
      <div className="flex items-center justify-center px-4 pb-12">
        <div className="w-[50vw] max-w-[900px] min-w-[650px]">
          <div className="relative bg-transparent border-none px-10 py-12">
            <div className="flex flex-col gap-6">
              <button
                onClick={() => {
                  navigate("/admin/marketing-request");
                }}
                className="text-left w-full font-silkscreen text-[1.25rem] dashboard-link py-[12px] px-0"
              >
                Marketing Portal
              </button>

              <button
                onClick={() => {
                  navigate("/admin/tasks");
                }}
                className="text-left w-full font-silkscreen text-[1.25rem] dashboard-link py-[12px] px-0"
              >
                Task Tracker
              </button>

              <button
                onClick={() => {
                  navigate("/admin/manage-events");
                }}
                className="text-left w-full font-silkscreen text-[1.25rem] dashboard-link py-[12px] px-0"
              >
                Manage Events
              </button>

              <button
                onClick={() => {
                  navigate("/admin/event-attendees");
                }}
                className="text-left w-full font-silkscreen text-[1.25rem] dashboard-link py-[12px] px-0"
              >
                Event Attendees
              </button>

              <button
                onClick={() => {
                  navigate("/admin/manage-links");
                }}
                className="text-left w-full font-silkscreen text-[1.25rem] dashboard-link py-[12px] px-0"
              >
                Links
              </button>

              <button
                onClick={() => {
                  navigate("/admin/members");
                }}
                className="text-left w-full font-silkscreen text-[1.25rem] dashboard-link py-[12px] px-0"
              >
                Members
              </button>

              <button
                onClick={onLogout}
                className="text-left w-full font-silkscreen text-[1.25rem] dashboard-link py-[12px] px-0"
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
