import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
    const { institution } = usePage().props;
    const [pageTitle, setPageTitle] = useState('Portal');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    useEffect(() => {
        // ... previous useEffect logic ...
        if (institution) {
            const root = document.documentElement;
            if (institution.primary_color) {
                root.style.setProperty('--primary', institution.primary_color);
                root.style.setProperty('--primary-light', `${institution.primary_color}1A`);
            }
            if (institution.secondary_color) {
                root.style.setProperty('--secondary', institution.secondary_color);
            }
            if (institution.sidebar_color) {
                root.style.setProperty('--sidebar-bg', institution.sidebar_color);
            }
        }
    }, [institution]);

    return (
        <div className="layout">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

            <Sidebar institution={institution} isOpen={isSidebarOpen} onClose={closeSidebar} />

            <div className="main-content">
                <Header title={pageTitle} onMenuButtonClick={toggleSidebar} />

                <main className="content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
