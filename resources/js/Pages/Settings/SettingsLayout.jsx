import React from 'react';
import Layout from '../../Components/Layout';
import { Link, usePage } from '@inertiajs/react';
import { Settings, Shield, Globe, Database, CreditCard } from 'lucide-react';
import './Settings.css';

const SettingsLayout = ({ children, title }) => {
    const { url } = usePage();

    const menuItems = [
        { name: 'Global Settings', href: '/settings/global', icon: Globe },
        { name: 'Roles & Permissions', href: '/settings/roles', icon: Shield },
        { name: 'API Integration', href: '/settings/api', icon: Database },
    ];

    return (
        <Layout>
            <div className="settings-layout-container">
                <div className="settings-sidebar">
                    <div className="settings-header">
                        <Settings size={20} />
                        <h2>Settings</h2>
                    </div>
                    <nav className="settings-nav">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = url.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`settings-nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={18} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="settings-content-area">
                    {title && <h1 className="settings-page-title" style={{ marginBottom: '24px' }}>{title}</h1>}
                    {children}
                </div>
            </div>
        </Layout>
    );
};

export default SettingsLayout;
