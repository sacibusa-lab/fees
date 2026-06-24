import React, { useState } from 'react';
import Layout from '../../Components/Layout';
import { Head } from '@inertiajs/react';
import { Plus, Search, Info } from 'lucide-react';
import AdminModal from '../../Components/AdminModal';
import './AllAdmins.css';
import './Roles.css'; // Reusing table styles

const AllAdmins = ({ admins = [], roles = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <Head title="All Admins" />
            <div className="all-admins-container">
                <div className="all-admins-header">
                    <h2 className="all-admins-title">All Admins</h2>
                    <div className="header-actions">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-add-new" onClick={() => setIsModalOpen(true)}>
                            <Plus size={18} />
                            Add Admin
                        </button>
                    </div>
                </div>

                <div className="roles-table-card">
                    <table className="roles-table">
                        <thead>
                            <tr>
                                <th>FULL NAME</th>
                                <th>PHONE</th>
                                <th>ROLE</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        No admins found. Click "Add Admin" to create one.
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id}>
                                        <td>
                                            <div className="table-avatar-cell">
                                                <div className="table-avatar-circle">
                                                    {admin.avatar}
                                                </div>
                                                {admin.name}
                                            </div>
                                        </td>
                                        <td style={{ color: '#94a3b8' }}>{admin.phone || '-'}</td>
                                        <td>
                                            <span className="admin-role-text">{admin.role}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${admin.status === 'active' ? 'active' : 'inactive'}`}>
                                                {admin.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <button className="action-btn" style={{ background: '#475569' }}>
                                                    <Info size={16} color="white" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roles={roles}
            />
        </Layout>
    );
};

export default AllAdmins;
