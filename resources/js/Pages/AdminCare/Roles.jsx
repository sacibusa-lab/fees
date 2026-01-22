import React, { useState } from 'react';
import Layout from '../../Components/Layout';
import { Head, router } from '@inertiajs/react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import RoleModal from '../../Components/RoleModal';
import './Roles.css';

const Roles = ({ roles = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    const handleAdd = () => {
        setEditingRole(null);
        setIsModalOpen(true);
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleDelete = (role) => {
        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            router.delete(`/admin-care/roles/${role.id}`);
        }
    };

    return (
        <Layout>
            <Head title="Admin Roles" />
            <div className="admin-roles-container">
                <div className="roles-page-header">
                    <h2 className="roles-page-title">All Admin Roles</h2>
                    <button className="btn-add-new" onClick={handleAdd}>
                        <Plus size={18} />
                        Add New
                    </button>
                </div>

                <div className="roles-table-card">
                    {roles.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                            No roles found. Click "Add New" to create one.
                        </div>
                    ) : (
                        <table className="roles-table">
                            <thead>
                                <tr>
                                    <th>SL NO</th>
                                    <th>ROLE NAME</th>
                                    <th>ASSIGN ADMIN</th>
                                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((role, index) => (
                                    <tr key={role.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {role.name}
                                            {role.description && (
                                                <div style={{ fontSize: '0.8em', color: '#94a3b8', marginTop: '4px' }}>
                                                    {role.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>{role.admin_count}</td>
                                        <td>
                                            <div className="actions-cell">
                                                <button
                                                    className="action-btn btn-edit"
                                                    onClick={() => handleEdit(role)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-btn btn-delete"
                                                    onClick={() => handleDelete(role)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <RoleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                role={editingRole}
            />
        </Layout>
    );
};

export default Roles;
