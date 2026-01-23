import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { Search, Download, Upload, MoreVertical, Filter, UserPlus, Edit, ExternalLink, Trash2, CreditCard, Wallet } from 'lucide-react';
import PromotionModal from '../Components/PromotionModal';
import AddStudentModal from '../Components/AddStudentModal';
import ExportModal from '../Components/ExportModal';
import EditStudentModal from '../Components/EditStudentModal';
import StudentDetailsModal from '../Components/StudentDetailsModal';
import './StudentsHub.css';

const StudentsHub = ({ initialStudents = [], initialClasses = [], initialSubClasses = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [subClassFilter, setSubClassFilter] = useState('');

    const [students] = useState(initialStudents);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown &&
                !event.target.closest('.student-action-menu') &&
                !event.target.closest('.actions-cell')
            ) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    // Derived State for Sub-class filter (dependent on class filter)
    const availableSubClasses = initialSubClasses.filter(sc =>
        !classFilter || sc.class_id == classFilter || !sc.class_id
    );

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClass = classFilter ? student.class_id == classFilter : true;

        // If subclass filter is set, check it. If not, only respect class filter. 
        // Note: clearing class filter should typically clear subclass filter too, handled in UI
        const matchesSubClass = subClassFilter ? student.sub_class_id == subClassFilter : true;

        return matchesSearch && matchesClass && matchesSubClass;
    });

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'active';
            case 'partial': return 'partial';
            case 'pending': return 'inactive';
            default: return 'inactive';
        }
    };

    // Checkbox Handling
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (id) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
        } else {
            setSelectedStudentIds([...selectedStudentIds, id]);
        }
    };

    const handleClassFilterChange = (e) => {
        setClassFilter(e.target.value);
        setSubClassFilter(''); // Reset subclass when class changes
    };

    const handleExport = (type) => {
        let url = '/students/export';
        if (type === 'filtered') {
            const params = new URLSearchParams();
            if (classFilter) params.append('class_id', classFilter);
            if (subClassFilter) params.append('sub_class_id', subClassFilter);
            url += `?${params.toString()}`;
        }
        window.location.href = url;
    };

    return (
        <>
            <Layout>
                <Head title={`Students - ${students.length}`} />
                <div className="students-page-container">
                    <div className="students-top-bar">
                        <h1 className="page-heading">Students - <span className="count">{students.length.toLocaleString()}</span></h1>
                        <div className="header-actions">
                            {selectedStudentIds.length > 0 ? (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className="btn-promote-action"
                                        onClick={() => {
                                            if (confirm(`Are you sure you want to delete ${selectedStudentIds.length} students? This action cannot be undone.`)) {
                                                import('@inertiajs/react').then(({ router }) => {
                                                    router.delete('/students/bulk-delete', {
                                                        data: { student_ids: selectedStudentIds },
                                                        onSuccess: () => setSelectedStudentIds([])
                                                    });
                                                });
                                            }
                                        }}
                                        style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}
                                    >
                                        <Trash2 size={18} />
                                        Delete ({selectedStudentIds.length})
                                    </button>
                                    <button className="btn-promote-action" onClick={() => setShowPromotionModal(true)}>
                                        <UserPlus size={18} />
                                        Promote ({selectedStudentIds.length})
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button className="import-btn-outline" onClick={() => setShowAddStudentModal(true)}>
                                        <UserPlus size={18} />
                                        + Add Student
                                    </button>
                                    <button className="export-btn-primary" onClick={() => setShowExportModal(true)}>
                                        <Download size={18} />
                                        Export
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="students-table-card card">
                        <div className="table-filters-row">
                            <div className="filter-group">
                                <select
                                    value={classFilter}
                                    onChange={handleClassFilterChange}
                                    className="filter-select"
                                >
                                    <option value="">Filter by class</option>
                                    {initialClasses.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <select
                                    value={subClassFilter}
                                    onChange={(e) => setSubClassFilter(e.target.value)}
                                    className="filter-select"
                                    disabled={!classFilter && availableSubClasses.length > 10} // Optional UX choice
                                >
                                    <option value="">Filter by subclass</option>
                                    {availableSubClasses.map(sc => (
                                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="search-wrapper">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by name or reg number"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="table-scroll-area">
                            <table className="students-data-table">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                            />
                                        </th>
                                        <th>S/N</th>
                                        <th>Payer</th>
                                        <th>Reg Number</th>
                                        <th>Class</th>
                                        <th>Phone</th>
                                        <th className="status-col">Status</th>
                                        <th className="actions-col"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student, index) => (
                                        <tr key={student.id} className={selectedStudentIds.includes(student.id) ? 'selected-row' : ''}>
                                            <td className="checkbox-col">
                                                <input
                                                    type="checkbox"
                                                    onChange={() => handleSelectStudent(student.id)}
                                                    checked={selectedStudentIds.includes(student.id)}
                                                />
                                            </td>
                                            <td>{index + 1}</td>
                                            <td className="payer-cell">
                                                <div className="payer-info">
                                                    <div className="avatar-placeholder">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <Link href={`/students/${student.id}`} className="payer-name hover:text-pink-600 hover:underline">
                                                        {student.name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td>{student.admission_number}</td>
                                            <td>{student.class_name} ({student.sub_class_name})</td>
                                            <td>{student.phone}</td>
                                            <td>
                                                <span className={`status-pill ${getStatusClass(student.payment_status)}`}>
                                                    <span className="pill-dot"></span>
                                                    {student.payment_status}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="row-toggle-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Calculate position
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        // Toggle off if clicking same
                                                        if (activeDropdown?.id === student.id) {
                                                            setActiveDropdown(null);
                                                        } else {
                                                            setActiveDropdown({
                                                                id: student.id,
                                                                top: rect.bottom + window.scrollY + 5,
                                                                left: rect.left + window.scrollX - 140 // Shift left to align
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="no-records">No students found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="table-footer-pagination">
                            {/* Pagination controls */}
                            <button className="nav-page-btn disabled">« Previous</button>
                            <div className="center-page-num">
                                <span className="page-box active">1</span>
                            </div>
                            <button className="nav-page-btn disabled">Next »</button>
                        </div>
                    </div>
                </div>

                {/* Promotion Modal */}
                <PromotionModal
                    show={showPromotionModal}
                    onClose={() => setShowPromotionModal(false)}
                    selectedStudentIds={selectedStudentIds}
                    classes={initialClasses}
                />

                {/* Add Student Modal */}
                <AddStudentModal
                    show={showAddStudentModal}
                    onClose={() => setShowAddStudentModal(false)}
                    classes={initialClasses}
                    subClasses={initialSubClasses}
                />

                {/* Export Modal */}
                <ExportModal
                    show={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    onExport={handleExport}
                    hasActiveFilters={!!classFilter || !!subClassFilter}
                />

                {/* Edit Student Modal */}
                <EditStudentModal
                    show={!!editingStudent}
                    onClose={() => setEditingStudent(null)}
                    student={editingStudent}
                    classes={initialClasses}
                    subClasses={initialSubClasses}
                />

                {/* Student Details Modal */}
                <StudentDetailsModal
                    show={!!viewingStudent}
                    onClose={() => setViewingStudent(null)}
                    student={viewingStudent}
                />
            </Layout>
            {
                activeDropdown && createPortal(
                    <div
                        className="student-action-menu fixed-menu"
                        style={{
                            top: `${activeDropdown.top}px`,
                            left: `${activeDropdown.left}px`,
                            position: 'fixed', // Force fixed
                            margin: 0,
                            zIndex: 9999 // Ensure it's on top
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="action-item" onClick={() => {
                            const student = filteredStudents.find(s => s.id === activeDropdown.id);
                            setEditingStudent(student);
                            setActiveDropdown(null);
                        }}>
                            <Edit size={14} />
                            Edit
                        </button>
                        <button className="action-item" onClick={() => {
                            const student = filteredStudents.find(s => s.id === activeDropdown.id);
                            setViewingStudent(student);
                            setActiveDropdown(null);
                        }}>
                            <ExternalLink size={14} />
                            View Details
                        </button>
                        <button className="action-item delete" onClick={() => {
                            if (confirm('Are you sure you want to delete this student profile?')) {
                                import('@inertiajs/react').then(({ router }) => {
                                    router.delete(`/students/${activeDropdown.id}`, {
                                        onSuccess: () => setActiveDropdown(null)
                                    });
                                });
                            }
                        }}>
                            <Trash2 size={14} />
                            Delete
                        </button>
                        <button className="action-item" onClick={() => { console.log('Payment', activeDropdown.id); setActiveDropdown(null); }}>
                            <CreditCard size={14} />
                            Payment Activity
                        </button>
                        <button className="action-item" onClick={() => { console.log('Wallet', activeDropdown.id); setActiveDropdown(null); }}>
                            <Wallet size={14} />
                            Wallet
                        </button>
                    </div>,
                    document.body
                )
            }
        </>
    );
};

export default StudentsHub;
