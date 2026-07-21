import React, { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
    const { institution } = usePage().props;
    const [pageTitle, setPageTitle] = useState('Portal');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
            return next;
        });
    }, []);

    useEffect(() => {
        if (institution) {
            const root = document.documentElement;
            if (institution.primary_color) {
                root.style.setProperty('--primary', institution.primary_color);
                root.style.setProperty('--primary-light', `${institution.primary_color}1A`);
            }
            if (institution.secondary_color) {
                root.style.setProperty('--secondary', institution.secondary_color);
            }
            if (institution.sidebar_color && institution.sidebar_color.toLowerCase() !== '#ffffff' && institution.sidebar_color.toLowerCase() !== 'white') {
                root.style.setProperty('--sidebar-bg', institution.sidebar_color);
            }
        }
        // Apply saved theme on mount
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, [institution]);

    return (
        <div className="layout">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

            <Sidebar institution={institution} isOpen={isSidebarOpen} onClose={closeSidebar} />

            <div className="main-content">
                <Header
                    title={pageTitle}
                    onMenuButtonClick={toggleSidebar}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={toggleDarkMode}
                />

                <main className="content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
