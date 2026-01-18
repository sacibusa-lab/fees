import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
    const { institution } = usePage().props;
    const [pageTitle, setPageTitle] = useState('Portal');

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
