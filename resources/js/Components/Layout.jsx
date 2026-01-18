import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
    // Determine initial title from children or default
    const [pageTitle, setPageTitle] = useState('Portal');

    return (
        <div className="layout">
            <Sidebar portalId="PGN677" institutionName="St. Augustine's College" />

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
