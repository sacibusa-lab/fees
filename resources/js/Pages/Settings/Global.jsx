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
                    <textarea
                        className="settings-input"
                        rows="3"
                        value={data.address}
                        onChange={e => setData('address', e.target.value)}
                    ></textarea>
                    {errors.address && <div className="text-red-500 text-sm mt-1">{errors.address}</div>}
                </div>

                <div className="flex justify-end items-center gap-4 mt-6">
                    {wasSuccessful && <span className="text-green-600 font-medium">Saved successfully!</span>}
                    <button type="submit" className="settings-submit-btn" disabled={processing}>
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </SettingsLayout>
    );
};

export default Global;
