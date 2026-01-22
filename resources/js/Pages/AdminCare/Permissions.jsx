import React, { useState } from 'react';
import Layout from '../../Components/Layout';
import { Head, router } from '@inertiajs/react';
import { Save } from 'lucide-react';
import './Permissions.css';

const Permissions = ({ roles = [], permissions = [] }) => {
    // Transform permissions into grouped object
    const groupedPermissions = permissions.reduce((acc, permission) => {
        if (!acc[permission.group_name]) {
            acc[permission.group_name] = [];
        }
        acc[permission.group_name].push(permission);
        return acc;
    }, {});

    // State to track changes: { roleId_permissionId: boolean }
    const [permissionMatrix, setPermissionMatrix] = useState(() => {
        const matrix = {};
        roles.forEach(role => {
            role.permissions.forEach(p => {
                matrix[`${role.id}_${p.id}`] = true;
            });
        });
        return matrix;
    });

    const [hasChanges, setHasChanges] = useState(false);

    const handleToggle = (roleId, permissionId) => {
        setPermissionMatrix(prev => ({
            ...prev,
            [`${roleId}_${permissionId}`]: !prev[`${roleId}_${permissionId}`]
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        router.post('/admin-care/permissions', { matrix: permissionMatrix }, {
            onSuccess: () => setHasChanges(false)
        });
    };

    return (
        <Layout>
            <Head title="Role Permissions" />
            <div className="permissions-container">
                <div className="permissions-header">
                    <h2 className="permissions-title">Role Permissions</h2>
                    <button
                        className="btn-save"
                        disabled={!hasChanges}
                        onClick={handleSave}
                        style={{ opacity: hasChanges ? 1 : 0.5, cursor: hasChanges ? 'pointer' : 'default' }}
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>

                <div className="permissions-card">
                    <table className="permissions-table">
                        <thead>
                            <tr>
                                <th className="module-header">Module / Permission</th>
                                {roles.map(role => (
                                    <th key={role.id} className="role-header">{role.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
                                <React.Fragment key={group}>
                                    <tr className="group-header-row">
                                        <td colSpan={roles.length + 1}>{group}</td>
                                    </tr>
                                    {groupPermissions.map(permission => (
                                        <tr key={permission.id} className="permission-row">
                                            <td className="permission-name">{permission.name}</td>
                                            {roles.map(role => (
                                                <td key={role.id} className="checkbox-cell">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!permissionMatrix[`${role.id}_${permission.id}`]}
                                                            onChange={() => handleToggle(role.id, permission.id)}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Permissions;
