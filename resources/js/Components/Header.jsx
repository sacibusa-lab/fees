import React from 'react';
import { Bell, User, Menu, Search } from 'lucide-react';
import './Header.css';

const Header = ({ title, onMenuButtonClick }) => {
    return (
        <header className="header">
            <div className="header-left">
                <button className="mobile-menu-btn" onClick={onMenuButtonClick}>
                    <Menu size={20} />
                </button>
                <div className="header-search-wrapper">
                    <Search className="search-icon" size={16} />
                    <input type="text" className="header-search-input" placeholder="Search your items..." />
                </div>
            </div>

            <div className="header-actions">
                <button className="icon-btn notification-btn">
                    <Bell size={18} />
                    <span className="notification-badge"></span>
                </button>

                <div className="user-profile-summary">
                    <img
                        src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
                        alt="User"
                        className="user-avatar"
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;
