import React from 'react';
import Layout from '../Components/Layout';
import { useForm, usePage, router } from '@inertiajs/react';
import { User, Building2, Mail, Save, Camera, Building } from 'lucide-react';
import './Profile.css';

const Profile = ({ user }) => {
    const { props } = usePage();
    const { institution } = user;

    const { data, setData, post, processing, errors } = useForm({
        name: user.name || '',
        institution_name: institution?.name || '',
        email: user.email || '',
        logo: null,
        avatar: null,
    });

    const [logoPreview, setLogoPreview] = React.useState(institution?.logo ? `/storage/${institution.logo}` : null);
    const [avatarPreview, setAvatarPreview] = React.useState(user.avatar ? `/storage/${user.avatar}` : null);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Use router.post with _method: 'PUT' for multipart data
        router.post('/profile', {
            ...data,
            _method: 'PUT'
        });
    };

    return (
        <Layout title="My Profile">
            <div className="profile-page-container">
                <div className="profile-page-header">
                    <h1 className="profile-page-title">My Profile</h1>
                    <p className="profile-page-subtitle">Manage your account and institution details</p>
                </div>

                {props.flash.success && (
                    <div className="alert-success">
                        {props.flash.success}
                    </div>
                )}

                <div className="profile-card">
                    <form onSubmit={handleSubmit}>
                        {/* Avatar Section */}
                        <div className="avatar-section">
                            <div className="avatar-upload-container">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="avatar-preview-img" />
                                ) : (
                                    <div className="avatar-letter-placeholder">
                                        {data.name.charAt(0)}
                                    </div>
                                )}
                                <label className="avatar-upload-overlay" htmlFor="avatar-input">
                                    <Camera size={20} />
                                </label>
                                <input
                                    type="file"
                                    id="avatar-input"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <div className="avatar-info">
                                <h3>{data.name}</h3>
                                <p>Admin Account • {user.role === 'admin' ? 'Super Admin' : 'Staff'}</p>
                            </div>
                        </div>

                        {/* Institution Logo Section */}
                        <div className="institution-logo-section">
                            <h4 className="section-title">Institution Branding</h4>
                            <div className="logo-upload-box">
                                <div className="logo-preview-area">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Institution Logo" className="logo-preview-img" />
                                    ) : (
                                        <div className="logo-placeholder">
                                            <Building size={32} />
                                            <span>No Logo Uploaded</span>
                                        </div>
                                    )}
                                </div>
                                <div className="logo-upload-controls">
                                    <label className="btn-upload" htmlFor="logo-input">
                                        Change Institution Logo
                                    </label>
                                    <input
                                        type="file"
                                        id="logo-input"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        style={{ display: 'none' }}
                                    />
                                    <p className="upload-hint">Recommended format: SVG, PNG or JPG (Max 2MB)</p>
                                </div>
                            </div>
                            {errors.logo && <p className="error-message">{errors.logo}</p>}
                        </div>

                        {/* Full Name */}
                        <div className="form-field">
                            <label className="form-label">
                                Full Name
                            </label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className={`form-input ${errors.name ? 'error' : ''}`}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            {errors.name && (
                                <p className="error-message">{errors.name}</p>
                            )}
                        </div>

                        {/* Display Name / Institution Name */}
                        <div className="form-field">
                            <label className="form-label">
                                Display Name (Institution Name)
                            </label>
                            <div className="input-wrapper">
                                <Building2 className="input-icon" size={20} />
                                <input
                                    type="text"
                                    value={data.institution_name}
                                    onChange={e => setData('institution_name', e.target.value)}
                                    className={`form-input ${errors.institution_name ? 'error' : ''}`}
                                    placeholder="Enter your institution name"
                                />
                            </div>
                            {errors.institution_name && (
                                <p className="error-message">{errors.institution_name}</p>
                            )}
                        </div>

                        {/* Email Address */}
                        <div className="form-field">
                            <label className="form-label">
                                Email Address
                            </label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={20} />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className={`form-input ${errors.email ? 'error' : ''}`}
                                    placeholder="your@email.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="error-message">{errors.email}</p>
                            )}
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-submit"
                            >
                                <Save size={20} />
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
