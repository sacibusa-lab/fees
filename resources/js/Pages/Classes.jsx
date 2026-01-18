import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { MoreVertical, Settings } from 'lucide-react';
import CustomizeClassModal from '../Components/CustomizeClassModal';
import './Classes.css';

const Classes = ({ initialClasses = [] }) => {
    const [activeDropdown, setActiveDropdown] = React.useState(null);
    const [classToEdit, setClassToEdit] = React.useState(null);

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

    const handleEditClick = (cls) => {
        setClassToEdit(cls);
        setActiveDropdown(null);
    };

    return (
        <Layout>
            <Head title="Classes" />
            <div className="classes-management">
                <div className="classes-header">
                    <Link href="/students/sub-classes" className="btn-subclass">
                        <Settings size={16} />
                        Sub Class
                    </Link>
                </div>

                <div className="table-card card">
                    <div className="table-responsive">
                        <table className="classes-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Name</th>
                                    <th>Class Category</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {initialClasses.map((cls, index) => (
                                    <tr key={cls.id}>
                                        <td>{index + 1}</td>
                                        <td className="class-name">{cls.name}</td>
                                        <td>{cls.category_name}</td>
                                        <td className="action-cell" style={{ position: 'relative' }}>
                                            <button
                                                className="icon-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === cls.id ? null : cls.id);
                                                }}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {activeDropdown === cls.id && (
                                                <div className="dropdown-menu">
                                                    <button
                                                        className="dropdown-item"
                                                        onClick={() => handleEditClick(cls)}
                                                    >
                                                        <Settings size={14} />
                                                        Customize
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {initialClasses.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No classes found.</td>
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
            </div>

            <CustomizeClassModal
                isOpen={!!classToEdit}
                onClose={() => setClassToEdit(null)}
                classData={classToEdit}
            />
        </Layout>
    );
};

export default Classes;
