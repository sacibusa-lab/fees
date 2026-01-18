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
            <form onSubmit={handleSubmit}>
                {/* Logo Section */}
                <div className="settings-form-group">
                    <label className="settings-label">Institution Logo</label>
                    <div className="flex items-center gap-6 mt-2">
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                            {institution?.logo ? (
                                <img src={institution.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : data.logo ? (
                                <img src={URL.createObjectURL(data.logo)} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-gray-400" size={32} />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="secondary-btn cursor-pointer inline-flex items-center gap-2">
                                <Upload size={16} />
                                <span>Upload New Logo</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={e => setData('logo', e.target.files[0])}
                                />
                            </label>
                            <span className="text-xs text-gray-500">Recommended: 400x400px, PNG or JPG.</span>
                            {errors.logo && <div className="text-red-500 text-sm">{errors.logo}</div>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="settings-form-group">
                        <label className="settings-label">Institution Name</label>
                        <input
                            type="text"
                            className="settings-input"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div className="settings-form-group">
                        <label className="settings-label">Email Address</label>
                        <input
                            type="email"
                            className="settings-input"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                        />
                        {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="settings-form-group">
                        <label className="settings-label">Phone Number</label>
                        <input
                            type="text"
                            className="settings-input"
                            value={data.phone}
                            onChange={e => setData('phone', e.target.value)}
                        />
                        {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
                    </div>

                    <div className="settings-form-group">
                        <label className="settings-label">Address</label>
                        <input
                            className="settings-input"
                            value={data.address}
                            onChange={e => setData('address', e.target.value)}
                        />
                        {errors.address && <div className="text-red-500 text-sm mt-1">{errors.address}</div>}
                    </div>
                </div>

                <hr className="my-8 border-gray-100" />

                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Theme & Appearance</h3>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="settings-form-group">
                            <label className="settings-label">Primary Color</label>
                            <div className="flex items-center gap-3 mt-1">
                                <input
                                    type="color"
                                    className="w-10 h-10 rounded cursor-pointer border-none"
                                    value={data.primary_color}
                                    onChange={e => setData('primary_color', e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="settings-input font-mono"
                                    style={{ fontSize: '13px' }}
                                    value={data.primary_color}
                                    onChange={e => setData('primary_color', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">Sidebar Background</label>
                            <div className="flex items-center gap-3 mt-1">
                                <input
                                    type="color"
                                    className="w-10 h-10 rounded cursor-pointer border-none"
                                    value={data.sidebar_color}
                                    onChange={e => setData('sidebar_color', e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="settings-input font-mono"
                                    style={{ fontSize: '13px' }}
                                    value={data.sidebar_color}
                                    onChange={e => setData('sidebar_color', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="settings-form-group">
                            <label className="settings-label">Secondary Color</label>
                            <div className="flex items-center gap-3 mt-1">
                                <input
                                    type="color"
                                    className="w-10 h-10 rounded cursor-pointer border-none"
                                    value={data.secondary_color}
                                    onChange={e => setData('secondary_color', e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="settings-input font-mono"
                                    style={{ fontSize: '13px' }}
                                    value={data.secondary_color}
                                    onChange={e => setData('secondary_color', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4 mt-6">
                    {wasSuccessful && <span className="text-green-600 font-medium">Saved successfully!</span>}
                    <button type="submit" className="settings-submit-btn" disabled={processing}>
                        <Save size={18} />
                        <span>{processing ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </form>
        </SettingsLayout>
    );
};

export default Global;
