import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { MoreVertical, ArrowRight } from 'lucide-react';
import StartNextTermModal from '../../Components/StartNextTermModal';
import NewSessionModal from '../../Components/NewSessionModal';
import './Index.css';

const SessionsIndex = ({ sessions = [] }) => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isStartTermModalOpen, setIsStartTermModalOpen] = useState(false);
    const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
    const [currentActionSession, setCurrentActionSession] = useState(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.action-cell')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    const handleActionClick = (sessionId) => {
        setActiveDropdown(activeDropdown === sessionId ? null : sessionId);
    };

    const handleNextTermClick = (session) => {
        setCurrentActionSession(session);
        setActiveDropdown(null);
        setIsStartTermModalOpen(true);
    };

    const handleStartNextTerm = (paymentAction) => {
        console.log(`Starting next term for session ${currentActionSession?.year}, action: ${paymentAction}`);
        // Here you would make an API call to start next term
        setIsStartTermModalOpen(false);
    };

    const handleSaveNewSession = (year) => {
        console.log(`Creating new session: ${year}`);
        // API call to create session
        setIsNewSessionModalOpen(false);
    };

    return (
        <Layout>
            <Head title="Academic Sessions" />
            <div className="sessions-page">
                <div className="page-header">
                    <h1 className="page-title">Sessions</h1>
                    <button
                        className="new-session-btn"
                        onClick={() => setIsNewSessionModalOpen(true)}
                    >
                        + New Session
                    </button>
                </div>

                <div className="sessions-table-container card">
                    <table className="sessions-table">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Year</th>
                                <th>Term</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session, index) => (
                                <tr key={session.id}>
                                    <td>{index + 1}</td>
                                    <td>{session.year}</td>
                                    <td>{session.term}</td>
                                    <td>
                                        <span className={`status-badge ${session.status}`}>
                                            <span className="status-dot"></span>
                                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="action-cell" style={{ position: 'relative' }}>
                                        <button
                                            className="action-btn"
                                            onClick={() => handleActionClick(session.id)}
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeDropdown === session.id && (
                                            <div className="action-dropdown">
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => handleNextTermClick(session)}
                                                >
                                                    <ArrowRight size={14} />
                                                    <span>Next Term</span>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="empty-state">No sessions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="table-pagination">
                        <button className="page-nav-btn disabled">« Previous</button>
                        <div className="page-numbers">
                            <button className="page-num-btn active">1</button>
                        </div>
                        <button className="page-nav-btn disabled">Next »</button>
                    </div>
                </div>

                {/* Modals */}
                <StartNextTermModal
                    isOpen={isStartTermModalOpen}
                    onClose={() => setIsStartTermModalOpen(false)}
                    currentTerm={currentActionSession?.term}
                    onNext={handleStartNextTerm}
                />

                <NewSessionModal
                    isOpen={isNewSessionModalOpen}
                    onClose={() => setIsNewSessionModalOpen(false)}
                    onSave={handleSaveNewSession}
                />
            </div>
        </Layout>
    );
};

export default SessionsIndex;
