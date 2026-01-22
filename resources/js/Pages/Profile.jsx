import React from 'react';
import Layout from '../Components/Layout';
import { useForm, usePage } from '@inertiajs/react';
import { User, Building2, Mail, Save } from 'lucide-react';
import './Profile.css';

const Profile = ({ user }) => {
    const { props } = usePage();
    const { institution } = user;

    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        institution_name: institution?.name || '',
        email: user.email || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put('/profile');
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
                            <div className="avatar-circle">
                                {data.name.charAt(0)}
                            </div>
                            <div className="avatar-info">
                                <h3>{data.name}</h3>
                                <p>Administrator</p>
                            </div>
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
