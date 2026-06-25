import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { 
    GraduationCap, Search, RotateCcw, Trash2, 
    Users, Calendar, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import './Alumni.css';

const Alumni = ({ alumni = [], stats = {} }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    const years = [...new Set(alumni.map(a => a.graduation_year))].sort().reverse();

    const filtered = alumni.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.admission_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchYear = yearFilter === 'all' || a.graduation_year === yearFilter;
        return matchSearch && matchYear;
    });

    const handleRestore = (id) => {
        if (confirm('Restore this student to active enrollment?')) {
            router.post(`/alumni/${id}/restore`);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Permanently delete this alumni record? This cannot be undone.')) {
            router.delete(`/alumni/${id}`);
        }
    };

    return (
        <Layout>
            <Head title="Alumni Management" />
            <div className="alumni-container">
                <div className="alumni-header">
                    <div>
                        <h1><GraduationCap size={24} /> Alumni Management</h1>
                        <p>Graduated students archive — restore or manage records</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="alumni-stats-row">
                    <div className="alumni-stat-card">
                        <GraduationCap size={22} />
                        <div>
                            <span className="stat-number">{stats.total_alumni}</span>
                            <span className="stat-label">Total Alumni</span>
                        </div>
                    </div>
                    <div className="alumni-stat-card">
                        <Calendar size={22} />
                        <div>
                            <span className="stat-number">{stats.this_year}</span>
                            <span className="stat-label">Graduated This Year</span>
                        </div>
                    </div>
                    <div className="alumni-stat-card">
                        <Users size={22} />
                        <div>
                            <span className="stat-number">{stats.by_gender?.male || 0}</span>
                            <span className="stat-label">Male</span>
                        </div>
                    </div>
                    <div className="alumni-stat-card">
                        <Users size={22} />
                        <div>
                            <span className="stat-number">{stats.by_gender?.female || 0}</span>
                            <span className="stat-label">Female</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="alumni-filters">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or admission number..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-select">
                        <Filter size={16} />
                        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                            <option value="all">All Years</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="alumni-list">
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <GraduationCap size={48} />
                            <h3>No alumni records found</h3>
                            <p>Graduated students will appear here after you move them from Students Hub.</p>
                        </div>
                    ) : (
                        filtered.map(a => (
                            <div key={a.id} className="alumni-card">
                                <div className="alumni-card-main" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                                    <div className="alumni-avatar">
                                        {a.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="alumni-info">
                                        <span className="alumni-name">{a.name}</span>
                                        <span className="alumni-meta">{a.admission_number} · {a.last_class} · {a.graduation_year}</span>
                                    </div>
                                    <div className="alumni-actions">
                                        <button className="btn-restore" onClick={(e) => { e.stopPropagation(); handleRestore(a.id); }} title="Restore to active">
                                            <RotateCcw size={16} /> Restore
                                        </button>
                                        <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} title="Delete permanently">
                                            <Trash2 size={16} />
                                        </button>
                                        {expandedId === a.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>
                                {expandedId === a.id && (
                                    <div className="alumni-details">
                                        <div className="detail-row">
                                            <span>Email</span><span>{a.email || '—'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Phone</span><span>{a.phone || '—'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Gender</span><span className="capitalize">{a.gender || '—'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Graduation Term</span><span>{a.graduation_term}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Graduated On</span><span>{a.graduated_at}</span>
                                        </div>
                                        {a.notes && (
                                            <div className="detail-row">
                                                <span>Notes</span><span>{a.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Alumni;
