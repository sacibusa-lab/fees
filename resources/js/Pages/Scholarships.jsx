import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { 
    GraduationCap, Plus, CheckCircle, XCircle, Trash2, 
    Search, AlertTriangle, BookOpen, Award, Edit3
} from 'lucide-react';
import './Scholarships.css';

const Scholarships = ({ scholarships = [], students = [], sessions = [], stats = {} }) => {
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Add modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [form, setForm] = useState({
        session_id: '',
        type: 'scholarship',
        amount: '',
        term: '',
        description: '',
    });

    // Edit modal
    const [editItem, setEditItem] = useState(null);
    const [editStudentSearch, setEditStudentSearch] = useState('');
    const [showEditDropdown, setShowEditDropdown] = useState(false);

    // Filter list
    const filtered = scholarships.filter(s => {
        const matchSearch = s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admission_no.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchType = filterType === 'all' || s.type === filterType;
        return matchSearch && matchStatus && matchType;
    });

    // Multi-student: toggle selection
    const toggleStudent = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Submit new award (multiple students)
    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedStudents.length === 0) return alert('Please select at least one student.');
        router.post('/scholarships', { ...form, student_ids: selectedStudents }, {
            onSuccess: () => {
                setShowAddModal(false);
                setSelectedStudents([]);
                setForm({ session_id: '', type: 'scholarship', amount: '', term: '', description: '' });
                setStudentSearch('');
            },
        });
    };

    // Submit edit
    const handleEditSubmit = (e) => {
        e.preventDefault();
        router.post(`/scholarships/${editItem.id}/update`, editItem, {
            onSuccess: () => setEditItem(null),
        });
    };

    const handleApprove = (id) => {
        if (confirm('Approve this award? A discount will be applied to the student\'s account.')) {
            router.post(`/scholarships/${id}/approve`);
        }
    };

    const handleReject = (id) => {
        if (confirm('Reject this award?')) {
            router.post(`/scholarships/${id}/reject`);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Delete this record permanently?')) {
            router.delete(`/scholarships/${id}`);
        }
    };

    return (
        <Layout>
            <Head title="Scholarships & Bursaries" />
            <div className="scholarships-page">
                <div className="scholarships-header">
                    <div>
                        <h1>Scholarships & Bursaries</h1>
                        <p>Manage fee awards and discounts for students</p>
                    </div>
                    <button className="btn-add" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> New Award
                    </button>
                </div>

                {/* Stats */}
                <div className="awards-stats-row">
                    <div className="award-stat-card approved">
                        <span className="award-stat-value">{stats.approved_count || 0}</span>
                        <span className="award-stat-label">Approved</span>
                    </div>
                    <div className="award-stat-card pending">
                        <span className="award-stat-value">{stats.pending_count || 0}</span>
                        <span className="award-stat-label">Pending</span>
                    </div>
                    <div className="award-stat-card total">
                        <span className="award-stat-value">₦{((stats.total_approved || 0)).toLocaleString()}</span>
                        <span className="award-stat-label">Total Approved Value</span>
                    </div>
                    <div className="award-stat-card pending-value">
                        <span className="award-stat-value">₦{((stats.total_pending || 0)).toLocaleString()}</span>
                        <span className="award-stat-label">Pending Value</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="awards-filters">
                    <div className="search-box">
                        <Search size={16} />
                        <input 
                            type="text" placeholder="Search by student name or admission..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="scholarship">Scholarship</option>
                        <option value="bursary">Bursary</option>
                    </select>
                </div>

                {/* Table */}
                <div className="awards-table-container">
                    <table className="awards-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Term</th>
                                <th>Status</th>
                                <th>Approved By</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="8" className="no-data">No awards found</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="award-student-info">
                                            <span className="award-student-name">{s.student_name}</span>
                                            <span className="award-student-class">{s.class_name} · {s.admission_no}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`award-type-badge ${s.type}`}>
                                            {s.type === 'scholarship' ? <BookOpen size={12} /> : <Award size={12} />}
                                            {s.type_label}
                                        </span>
                                    </td>
                                    <td className="award-amount">₦{s.amount.toLocaleString()}</td>
                                    <td>{s.term}</td>
                                    <td>
                                        <span className={`award-status status-${s.status}`}>
                                            {s.status === 'approved' && <CheckCircle size={12} />}
                                            {s.status === 'pending' && <AlertTriangle size={12} />}
                                            {s.status === 'rejected' && <XCircle size={12} />}
                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>{s.approved_by || '—'}</td>
                                    <td className="award-date">{s.created_at}</td>
                                    <td>
                                        <div className="award-actions">
                                            <button className="btn-icon edit" onClick={() => setEditItem({...s, session_id: s.session_id || ''})} title="Edit">
                                                <Edit3 size={16} />
                                            </button>
                                            {s.status === 'pending' && (
                                                <>
                                                    <button className="btn-icon success" onClick={() => handleApprove(s.id)} title="Approve">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button className="btn-icon danger" onClick={() => handleReject(s.id)} title="Reject">
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button className="btn-icon muted" onClick={() => handleDelete(s.id)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add Modal */}
                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="award-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3><GraduationCap size={20} /> New Award</h3>
                                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Students * <span className="form-hint">(select one or more)</span></label>
                                        <div className="student-multi-wrapper">
                                            <div className="student-search-input" onClick={() => setShowStudentDropdown(true)}>
                                                <Search size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Type to search and select students..."
                                                    value={studentSearch}
                                                    onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }}
                                                    onFocus={() => setShowStudentDropdown(true)}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            {showStudentDropdown && (
                                                <>
                                                    <div className="student-dropdown-overlay" onClick={() => setShowStudentDropdown(false)} />
                                                    <div className="student-dropdown">
                                                        <div className="student-dropdown-select-all" onClick={() => {
                                                            const filtered = students.filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.admission_number.toLowerCase().includes(studentSearch.toLowerCase()));
                                                            const allIds = filtered.map(s => s.id);
                                                            setSelectedStudents(prev => prev.length === allIds.length ? [] : allIds);
                                                        }}>
                                                            <CheckCircle size={14} />
                                                            {students.filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.admission_number.toLowerCase().includes(studentSearch.toLowerCase())).length === selectedStudents.length
                                                                ? 'Deselect All' : 'Select All'}
                                                        </div>
                                                        {students
                                                            .filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.admission_number.toLowerCase().includes(studentSearch.toLowerCase()))
                                                            .map(s => (
                                                                <div key={s.id}
                                                                    className={`student-dropdown-item ${selectedStudents.includes(s.id) ? 'selected' : ''}`}
                                                                    onClick={() => toggleStudent(s.id)}
                                                                >
                                                                    <input type="checkbox" readOnly checked={selectedStudents.includes(s.id)} className="student-check-input" />
                                                                    <div className="student-dropdown-info">
                                                                        <span className="student-dropdown-name">{s.name}</span>
                                                                        <span className="student-dropdown-meta">{s.class_name} · {s.admission_number}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        {students.filter(s => !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.admission_number.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                                                            <div className="student-dropdown-empty">No students match "{studentSearch}"</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {selectedStudents.length > 0 && (
                                            <div className="selected-students-tags">
                                                {selectedStudents.map(id => {
                                                    const s = students.find(st => st.id === id);
                                                    return s ? (
                                                        <span key={id} className="student-tag">
                                                            {s.name}
                                                            <button type="button" onClick={() => toggleStudent(id)}>×</button>
                                                        </span>
                                                    ) : null;
                                                })}
                                                <span className="selected-count">{selectedStudents.length} selected</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Type *</label>
                                            <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                                <option value="scholarship">Scholarship</option>
                                                <option value="bursary">Bursary</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Amount (₦) *</label>
                                            <input type="number" required min="1" step="0.01"
                                                value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Session</label>
                                            <select value={form.session_id} onChange={e => setForm({...form, session_id: e.target.value})}>
                                                <option value="">Current Session</option>
                                                {sessions.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Term</label>
                                            <select value={form.term} onChange={e => setForm({...form, term: e.target.value})}>
                                                <option value="">All Terms</option>
                                                <option value="1st Term">1st Term</option>
                                                <option value="2nd Term">2nd Term</option>
                                                <option value="3rd Term">3rd Term</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description (reason for award)</label>
                                        <textarea rows="3" value={form.description}
                                            onChange={e => setForm({...form, description: e.target.value})}
                                            placeholder="e.g. Academic excellence scholarship, Financial need bursary..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit">Create Award</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editItem && (
                    <div className="modal-overlay" onClick={() => setEditItem(null)}>
                        <div className="award-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3><Edit3 size={20} /> Edit Award</h3>
                                <button className="modal-close" onClick={() => setEditItem(null)}>×</button>
                            </div>
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Student *</label>
                                        <div className="student-search-wrapper">
                                            <div className="student-search-input" onClick={() => setShowEditDropdown(true)}>
                                                <Search size={16} />
                                                <input
                                                    type="text"
                                                    placeholder={students.find(s => s.id === editItem.student_id)?.name || 'Search students...'}
                                                    value={editStudentSearch}
                                                    onChange={e => { setEditStudentSearch(e.target.value); setShowEditDropdown(true); }}
                                                    onFocus={() => setShowEditDropdown(true)}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            {showEditDropdown && (
                                                <>
                                                    <div className="student-dropdown-overlay" onClick={() => setShowEditDropdown(false)} />
                                                    <div className="student-dropdown">
                                                        {students
                                                            .filter(s => !editStudentSearch || s.name.toLowerCase().includes(editStudentSearch.toLowerCase()) || s.admission_number.toLowerCase().includes(editStudentSearch.toLowerCase()))
                                                            .map(s => (
                                                                <div key={s.id}
                                                                    className={`student-dropdown-item ${editItem.student_id === s.id ? 'selected' : ''}`}
                                                                    onClick={() => { setEditItem({...editItem, student_id: s.id}); setEditStudentSearch(''); setShowEditDropdown(false); }}
                                                                >
                                                                    <div className="student-dropdown-info">
                                                                        <span className="student-dropdown-name">{s.name}</span>
                                                                        <span className="student-dropdown-meta">{s.class_name} · {s.admission_number}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Type *</label>
                                            <select required value={editItem.type} onChange={e => setEditItem({...editItem, type: e.target.value})}>
                                                <option value="scholarship">Scholarship</option>
                                                <option value="bursary">Bursary</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Amount (₦) *</label>
                                            <input type="number" required min="1" step="0.01"
                                                value={editItem.amount} onChange={e => setEditItem({...editItem, amount: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Session</label>
                                            <select value={editItem.session_id} onChange={e => setEditItem({...editItem, session_id: e.target.value})}>
                                                <option value="">Current Session</option>
                                                {sessions.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Term</label>
                                            <select value={editItem.term === 'All Terms' ? '' : editItem.term} onChange={e => setEditItem({...editItem, term: e.target.value})}>
                                                <option value="">All Terms</option>
                                                <option value="1st Term">1st Term</option>
                                                <option value="2nd Term">2nd Term</option>
                                                <option value="3rd Term">3rd Term</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea rows="3" value={editItem.description || ''}
                                            onChange={e => setEditItem({...editItem, description: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setEditItem(null)}>Cancel</button>
                                    <button type="submit" className="btn-submit">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Scholarships;
