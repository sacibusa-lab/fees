import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
    const { institution } = usePage().props;
    const [pageTitle, setPageTitle] = useState('Portal');

    useEffect(() => {
        if (institution) {
            const root = document.documentElement;
            if (institution.primary_color) {
                root.style.setProperty('--primary', institution.primary_color);
                // Also update primary-light for backgrounds (10% opacity)
                root.style.setProperty('--primary-light', `${institution.primary_color}1A`);
            }
            if (institution.secondary_color) {
                root.style.setProperty('--secondary', institution.secondary_color);
            }
            if (institution.sidebar_color) {
                root.style.setProperty('--sidebar-bg', institution.sidebar_color);
                // If sidebar color is dark, we might need to adjust sidebar text color, 
                // but let's stick to background for now.
            }
        }
    }, [institution]);

    return (
        <div className="layout">
            <Sidebar institution={institution} />

            <div className="main-content">
                <Header title={pageTitle} />

                <main className="content">
                    {/* We can use React.cloneElement if we need to pass setPageTitle down, 
                        but better to use userPage() or a context provider for title management in Inertia */}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
