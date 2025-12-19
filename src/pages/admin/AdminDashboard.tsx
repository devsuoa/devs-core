import React from 'react';
import { useAdminDashboard } from '../../lib/adminDashboardController';
import Header from '../../components/Header';
import { PageTitle } from '../../components/PageTitle';

const AdminDashboard: React.FC = () => {
    const { loading, authorized, onLogout } = useAdminDashboard();

    if (loading) {
        return (
            <>
                <Header />
                <div className="flex items-center justify-center mt-[20vh]">
                    <p className="pixel-text text-white">Loading...</p>
                </div>
            </>
        );
    }

    if (!authorized) {
        return null;
    }

    return (
        <>
            <Header />
            <PageTitle
                image="/icon_logo.png"
                title="Admin Dashboard"
                className='mt-[5vh]'
            />
            <div className="flex items-center justify-center mt-[10vh] px-4 py-12">
                <div className="w-[50vw] max-w-[900px] min-w-[650px]">
                    <div className="relative bg-transparent border-none px-10 py-12">
                        <div className="flex flex-col gap-6">
                            <button
                                onClick={() => { }}
                                className="text-left w-full pixel-text dashboard-link py-[12px] px-0"
                            >
                                Marketing Portal
                            </button>

                            <button
                                onClick={() => { }}
                                className="text-left w-full pixel-text dashboard-link py-[12px] px-0"
                            >
                                Events Page CMS
                            </button>

                            <button
                                onClick={() => { }}
                                className="text-left w-full pixel-text dashboard-link py-[12px] px-0"
                            >
                                Links
                            </button>

                            <button
                                onClick={onLogout}
                                className="text-left w-full pixel-text dashboard-link py-[12px] px-0"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;

