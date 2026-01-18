import React from 'react';
import { Bell, User } from 'lucide-react';
import './Header.css';

const Header = ({ title }) => {
    return (
        <header className="header">
            <h1 className="page-title">{title}</h1>

            <div className="header-actions">
                <button className="icon-btn notification-btn">
                    <Bell size={20} />
                    <span className="notification-badge">1</span>
                </button>

                <button className="icon-btn profile-btn">
                    <User size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
