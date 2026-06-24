import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { ChevronLeft, Plus, MoreVertical, X, Settings } from 'lucide-react';
import CustomizeSubClassModal from '../Components/CustomizeSubClassModal';
import './SubClasses.css';

const SubClasses = ({ initialSubClasses = [] }) => {
    const [showModal, setShowModal] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [subClassToEdit, setSubClassToEdit] = useState(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.action-cell')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

    const handleEditClick = (sub) => {
        setSubClassToEdit(sub);
        setActiveDropdown(null);
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        class_id: 1, // Hardcoded for now as per previous demo logic
    });

    const handleSaveSubClass = (e) => {
        e.preventDefault();
        post('/students/sub-classes', {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    return (
        <Layout>
            <Head title="Sub Classes" />
            <div className="sub-classes-management">
                <div className="sub-classes-header">
                    <div className="header-left">
                        <Link href="/students/classes" className="back-btn">
                            <ChevronLeft size={24} />
                        </Link>
                        <h1>Sub Classes</h1>
                    </div>
                    <button className="btn-add-subclass" onClick={() => setShowModal(true)}>
                        <Plus size={16} />
                        Add New Subclass
                    </button>
                </div>

                <div className="table-card card">
                    <div className="table-responsive">
                        <table className="sub-classes-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Name</th>
                                    <th>Students</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {initialSubClasses.map((sub, index) => (
                                    <tr key={sub.id}>
                                        <td>{index + 1}</td>
                                        <td>{sub.name}</td>
                                        <td>{sub.student_count} Students</td>
                                        <td className="action-cell" style={{ position: 'relative' }}>
                                            <button
                                                className="icon-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === sub.id ? null : sub.id);
                                                }}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {activeDropdown === sub.id && (
                                                <div className="dropdown-menu">
                                                    <button
                                                        className="dropdown-item"
                                                        onClick={() => handleEditClick(sub)}
                                                    >
                                                        <Settings size={14} />
                                                        Customize
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {initialSubClasses.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No sub-classes found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="table-pagination">
                        <button className="page-nav-btn disabled">« Previous</button>
                        <div className="page-numbers">
                            <button className="page-num-btn active">1</button>
                        </div>
                        <button className="page-nav-btn disabled">Next »</button>
                    </div>
                </div>

                {/* Add New Subclass Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="subclass-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-top" onClick={() => setShowModal(false)}>
                                <X size={24} color="#E91E63" />
                            </button>

                            <div className="modal-body">
                                <h2>Add New Subclass</h2>
                                <form onSubmit={handleSaveSubClass}>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="e.g Class section name (A, B, C...)"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            autoFocus
                                            className={errors.name ? 'error' : ''}
                                        />
                                        {errors.name && <span className="error-text">{errors.name}</span>}
                                    </div>
                                    <button type="submit" className="btn-save-changes" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CustomizeSubClassModal
                isOpen={!!subClassToEdit}
                onClose={() => setSubClassToEdit(null)}
                subClassData={subClassToEdit}
            />
        </Layout>
    );
};

export default SubClasses;
