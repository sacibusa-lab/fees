import React from 'react';
import SettingsLayout from './SettingsLayout';
import { ShieldAlert } from 'lucide-react';

const Roles = () => {
    return (
        <SettingsLayout title="Roles & Permissions">
            <div className="settings-max-width">
                <div className="settings-section-card">
                    <div className="settings-section-header">
                        <h3>Access Control</h3>
                    </div>
                    <div className="settings-section-content">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', marginBottom: '16px' }}>
                                <ShieldAlert size={32} style={{ color: '#ccc', margin: 'auto' }} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#333', margin: '0 0 8px 0' }}>Advanced Permissions Coming Soon</h3>
                            <p style={{ color: '#666', fontSize: '0.9rem', maxWidth: '400px', lineHeight: '1.6' }}>
                                We are developing a robust role-based access control system to help you delegate tasks to your staff while maintaining absolute control over sensitive data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
};

export default Roles;
