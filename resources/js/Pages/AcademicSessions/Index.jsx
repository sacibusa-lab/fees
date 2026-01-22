import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { MoreVertical, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
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

    const handleToggleStatus = (session) => {
        router.put(`/academic-sessions/${session.id}/toggle-status`, {}, {
            onSuccess: () => setActiveDropdown(null),
        });
    };

    const handleSetTerm = (session, term) => {
        router.post(`/academic-sessions/${session.id}/set-term`, {
            term: term
        }, {
            onSuccess: () => setActiveDropdown(null),
        });
    };

    const handleStartNextTerm = (paymentAction) => {
        router.post(`/academic-sessions/${currentActionSession.id}/next-term`, {
            payment_action: paymentAction
        }, {
            onSuccess: () => setIsStartTermModalOpen(false),
        });
    };

    const handleSaveNewSession = (year, startDate, endDate) => {
        router.post('/academic-sessions', {
            year: year,
            start_date: startDate,
            end_date: endDate
        }, {
            onSuccess: () => setIsNewSessionModalOpen(false),
        });
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
                                <th>Active Term</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session, index) => (
                                <tr key={session.id}>
                                    <td>{index + 1}</td>
                                    <td>{session.year}</td>
                                    <td>
                                        <div className="term-display">
                                            <span className="current-term-tag">{session.term}</span>
                                        </div>
                                    </td>
                                    <td className="text-sm text-gray-600">
                                        {session.start_date || '-'}
                                    </td>
                                    <td className="text-sm text-gray-600">
                                        {session.end_date || '-'}
                                    </td>
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
                                            <div className="action-dropdown shadow-lg">
                                                <div className="dropdown-section-label">Switch Term</div>
                                                <button className={`dropdown-item ${session.term === '1st Term' ? 'selected' : ''}`} onClick={() => handleSetTerm(session, '1st Term')}>
                                                    <CheckCircle size={14} className={session.term === '1st Term' ? 'visible' : 'hidden'} />
                                                    <span>1st Term</span>
                                                </button>
                                                <button className={`dropdown-item ${session.term === '2nd Term' ? 'selected' : ''}`} onClick={() => handleSetTerm(session, '2nd Term')}>
                                                    <CheckCircle size={14} className={session.term === '2nd Term' ? 'visible' : 'hidden'} />
                                                    <span>2nd Term</span>
                                                </button>
                                                <button className={`dropdown-item ${session.term === '3rd Term' ? 'selected' : ''}`} onClick={() => handleSetTerm(session, '3rd Term')}>
                                                    <CheckCircle size={14} className={session.term === '3rd Term' ? 'visible' : 'hidden'} />
                                                    <span>3rd Term</span>
                                                </button>

                                                <div className="dropdown-divider"></div>

                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => handleNextTermClick(session)}
                                                >
                                                    <ArrowRight size={14} />
                                                    <span>Start Next Term</span>
                                                </button>


                                                {/* Edit Dates Action - Simple Prompt for now */}
                                                <button
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        const start = prompt("Enter Start Date (YYYY-MM-DD)", session.start_date || '');
                                                        if (start) {
                                                            const end = prompt("Enter End Date (YYYY-MM-DD)", session.end_date || '');
                                                            if (end) {
                                                                router.put(`/academic-sessions/${session.id}`, { start_date: start, end_date: end });
                                                            }
                                                        }
                                                        setActiveDropdown(null);
                                                    }}
                                                >
                                                    <CheckCircle size={14} />
                                                    <span>Update Dates</span>
                                                </button>

                                                {session.status === 'inactive' && (
                                                    <button
                                                        className="dropdown-item active-action"
                                                        onClick={() => handleToggleStatus(session)}
                                                    >
                                                        <CheckCircle size={14} color="#10b981" />
                                                        <span>Make Session Active</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="empty-state">No sessions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
