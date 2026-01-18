import { Bell, User, Menu } from 'lucide-react';
import './Header.css';

const Header = ({ title, onMenuButtonClick }) => {
    return (
        <header className="header">
            <div className="header-left">
                <button className="mobile-menu-btn" onClick={onMenuButtonClick}>
                    <Menu size={24} />
                </button>
                <h1 className="page-title">{title}</h1>
            </div>

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
