import React from 'react';
import { Bell, User, Menu, Search, Moon, Sun } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import './Header.css';

const Header = ({ title, onMenuButtonClick, isDarkMode, onToggleDarkMode }) => {
    const { auth } = usePage().props;
    const user = auth.user;
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
                <button
                    className="icon-btn theme-toggle"
                    onClick={onToggleDarkMode}
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button className="icon-btn notification-btn">
                    <Bell size={18} />
                    <span className="notification-badge"></span>
                </button>

                <div className="user-profile-summary">
                    {user.avatar ? (
                        <img
                            src={`/storage/${user.avatar}`}
                            alt="User"
                            className="user-avatar"
                        />
                    ) : (
                        <div className="user-avatar-placeholder">
                            <User size={20} />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
