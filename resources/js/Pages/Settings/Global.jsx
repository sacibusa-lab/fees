import React from 'react';
import { useForm, router } from '@inertiajs/react'; // Import router if needed, though useForm is sufficient
import SettingsLayout from './SettingsLayout';
import { Save, Upload, Image as ImageIcon } from 'lucide-react';

const Global = ({ institution }) => {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        name: institution?.name || '',
        email: institution?.email || '',
        phone: institution?.phone || '',
        address: institution?.address || '',
        logo: null,
        favicon: null,
        primary_color: institution?.primary_color || '#E91E63',
        sidebar_color: institution?.sidebar_color || '#FFFFFF',
        secondary_color: institution?.secondary_color || '#3B82F6',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/global', {
            forceFormData: true,
        });
    };

    return (
        <SettingsLayout title="Global Settings">
            <div className="settings-max-width">
                <form onSubmit={handleSubmit}>
                    {/* Brand Identity Card */}
                    <div className="settings-section-card">
                        <div className="settings-section-header">
                            <h3>Brand Identity</h3>
                        </div>
                        <div className="settings-section-content">
                            <div className="identity-setup">
                                {/* Logo Section */}
                                <div className="upload-group">
                                    <label className="upload-label">Institution Logo</label>
                                    <div className="preview-container">
                                        <div className="logo-preview-box">
                                            {data.logo ? (
                                                <img src={URL.createObjectURL(data.logo)} alt="Preview" className="w-full h-full object-cover" />
                                            ) : institution?.logo ? (
                                                <img src={institution.logo} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-gray-300" size={28} />
                                            )}
                                        </div>
                                        <div className="upload-actions">
                                            <label className="upload-btn-trigger">
                                                <Upload size={14} />
                                                <span>Change Logo</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={e => setData('logo', e.target.files[0])} />
                                            </label>
                                            <p className="upload-hint">PNG or JPG, max 2MB.</p>
                                        </div>
                                    </div>
                                    {errors.logo && <p className="error-text">{errors.logo}</p>}
                                </div>

                                {/* Favicon Section */}
                                <div className="upload-group">
                                    <label className="upload-label">Site Favicon</label>
                                    <div className="preview-container">
                                        <div className="favicon-preview-box">
                                            {data.favicon ? (
                                                <img src={URL.createObjectURL(data.favicon)} alt="Preview" className="w-full h-full object-contain" />
                                            ) : institution?.favicon ? (
                                                <img src={institution.favicon} alt="Favicon" className="w-full h-full object-contain" />
                                            ) : (
                                                <div style={{ width: '20px', height: '20px', background: '#cbd5e1', borderRadius: '4px' }} />
                                            )}
                                        </div>
                                        <div className="upload-actions">
                                            <label className="upload-btn-trigger">
                                                <Upload size={14} />
                                                <span>Update Favicon</span>
                                                <input type="file" className="hidden" accept="image/*,.ico" onChange={e => setData('favicon', e.target.files[0])} />
                                            </label>
                                            <p className="upload-hint">ICO or PNG, max 1MB.</p>
                                        </div>
                                    </div>
                                    {errors.favicon && <p className="error-text">{errors.favicon}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Institution Details Card */}
                    <div className="settings-section-card">
                        <div className="settings-section-header">
                            <h3>Institution Details</h3>
                        </div>
                        <div className="settings-section-content">
                            <div className="settings-grid-2">
                                <div className="settings-form-group">
                                    <label className="settings-label">Institution Name</label>
                                    <input type="text" className="settings-input" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Full Name of School" />
                                    {errors.name && <p className="error-text">{errors.name}</p>}
                                </div>
                                <div className="settings-form-group">
                                    <label className="settings-label">Official Email</label>
                                    <input type="email" className="settings-input" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="admin@school.com" />
                                    {errors.email && <p className="error-text">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="settings-grid-2">
                                <div className="settings-form-group">
                                    <label className="settings-label">Phone Number</label>
                                    <input type="text" className="settings-input" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="+234 ..." />
                                    {errors.phone && <p className="error-text">{errors.phone}</p>}
                                </div>
                                <div className="settings-form-group">
                                    <label className="settings-label">Contact Address</label>
                                    <input type="text" className="settings-input" value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Street Address, City" />
                                    {errors.address && <p className="error-text">{errors.address}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Customization Card */}
                    <div className="settings-section-card">
                        <div className="settings-section-header">
                            <h3>Visual Expression</h3>
                        </div>
                        <div className="settings-section-content">
                            <div className="settings-grid-3">
                                <div className="color-picker-item">
                                    <label className="settings-label">Primary Color</label>
                                    <div className="color-input-group">
                                        <input type="color" className="color-swatch-input" value={data.primary_color} onChange={e => setData('primary_color', e.target.value)} />
                                        <input type="text" className="color-text-input" value={data.primary_color} onChange={e => setData('primary_color', e.target.value)} />
                                    </div>
                                </div>

                                <div className="color-picker-item">
                                    <label className="settings-label">Sidebar Background</label>
                                    <div className="color-input-group">
                                        <input type="color" className="color-swatch-input" value={data.sidebar_color} onChange={e => setData('sidebar_color', e.target.value)} />
                                        <input type="text" className="color-text-input" value={data.sidebar_color} onChange={e => setData('sidebar_color', e.target.value)} />
                                    </div>
                                </div>

                                <div className="color-picker-item">
                                    <label className="settings-label">Secondary Color</label>
                                    <div className="color-input-group">
                                        <input type="color" className="color-swatch-input" value={data.secondary_color} onChange={e => setData('secondary_color', e.target.value)} />
                                        <input type="text" className="color-text-input" value={data.secondary_color} onChange={e => setData('secondary_color', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div className="settings-footer">
                        <div className="status-indicator">
                            {wasSuccessful && (
                                <div className="success-badge">
                                    <div className="success-dot" />
                                    <span>Settings updated successfully</span>
                                </div>
                            )}
                        </div>
                        <button type="submit" disabled={processing} className="premium-save-btn">
                            {processing ? (
                                <div className="spinner" />
                            ) : (
                                <Save size={18} />
                            )}
                            <span>{processing ? 'Saving...' : 'Save All Changes'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </SettingsLayout>
    );
};

export default Global;
