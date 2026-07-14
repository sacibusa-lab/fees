import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import SettingsLayout from './SettingsLayout';
import { Eye, EyeOff, Save, Settings, MessageSquare, Globe, ToggleLeft } from 'lucide-react';

const Api = ({ paystack_public_key, paystack_secret_key, sms_provider, sms_enabled, termii_api_key, termii_sender_id }) => {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        paystack_public_key: paystack_public_key || '',
        paystack_secret_key: paystack_secret_key || '',
        sms_provider: sms_provider || 'termii',
        sms_enabled: sms_enabled || false,
        termii_api_key: termii_api_key || '',
        termii_sender_id: termii_sender_id || '',
    });

    const [showPaystackSecret, setShowPaystackSecret] = useState(false);
    const [showTermiiKey, setShowTermiiKey] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/api');
    };

    return (
        <SettingsLayout title="API Integration">
            <div className="settings-max-width">
                <form onSubmit={handleSubmit}>
                    {/* Paystack Section */}
                    <div className="settings-section-card">
                        <div className="settings-section-header">
                            <h3>Paystack API Configuration</h3>
                        </div>
                        <div className="settings-section-content">
                            <div className="settings-info-box">
                                <Settings size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong>Setup Note:</strong> Enter your live or test keys from your Paystack Dashboard to enable automated payments and sub-account management within the portal.
                                </div>
                            </div>

                            <div className="settings-grid-2">
                                <div className="settings-form-group">
                                    <label className="settings-label">Paystack Public Key</label>
                                    <input
                                        type="text"
                                        className="settings-input font-mono"
                                        placeholder="pk_test_..."
                                        value={data.paystack_public_key}
                                        onChange={e => setData('paystack_public_key', e.target.value)}
                                    />
                                    {errors.paystack_public_key && <p className="error-text">{errors.paystack_public_key}</p>}
                                </div>

                                <div className="settings-form-group">
                                    <label className="settings-label">Paystack Secret Key</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPaystackSecret ? "text" : "password"}
                                            className="settings-input font-mono"
                                            style={{ paddingRight: '40px' }}
                                            placeholder="sk_test_..."
                                            value={data.paystack_secret_key}
                                            onChange={e => setData('paystack_secret_key', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                                            onClick={() => setShowPaystackSecret(!showPaystackSecret)}
                                        >
                                            {showPaystackSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.paystack_secret_key && <p className="error-text">{errors.paystack_secret_key}</p>}
                                    <p className="upload-hint" style={{ marginTop: '8px' }}>Security: Key is masked after saving. Overwrite to update.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SMS Provider Section */}
                    <div className="settings-section-card" style={{ marginTop: '24px' }}>
                        <div className="settings-section-header">
                            <h3><MessageSquare size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> SMS Provider Configuration</h3>
                        </div>
                        <div className="settings-section-content">
                            <div className="settings-info-box">
                                <Globe size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong>SMS Notifications:</strong> Configure your SMS provider to send payment receipts and reminders to parents/guardians.
                                </div>
                            </div>

                            <div className="settings-grid-2">
                                <div className="settings-form-group">
                                    <label className="settings-label">SMS Provider</label>
                                    <select
                                        className="settings-input"
                                        value={data.sms_provider}
                                        onChange={e => setData('sms_provider', e.target.value)}
                                    >
                                        <option value="termii">Termii</option>
                                    </select>
                                    <p className="upload-hint">Termii is the active SMS provider.</p>
                                </div>

                                <div className="settings-form-group">
                                    <label className="settings-label">SMS Enabled</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
                                        <label className="toggle-switch" style={{ position: 'relative', width: 44, height: 24, flexShrink: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={data.sms_enabled}
                                                onChange={e => setData('sms_enabled', e.target.checked)}
                                            />
                                            <span className="toggle-slider" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: data.sms_enabled ? 'var(--primary)' : '#d1d5db', borderRadius: 24, transition: '0.3s' }}></span>
                                        </label>
                                        <span style={{ fontSize: 13, color: data.sms_enabled ? '#059669' : '#6b7280' }}>
                                            {data.sms_enabled ? 'Active — SMS will be sent' : 'Disabled — no SMS will be sent'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Termii Fields */}
                            {data.sms_provider === 'termii' && (
                                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 16, paddingTop: 16 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#374151' }}>Termii</h4>
                                    <div className="settings-grid-2">
                                        <div className="settings-form-group">
                                            <label className="settings-label">Termii API Key</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showTermiiKey ? "text" : "password"}
                                                    className="settings-input font-mono"
                                                    style={{ paddingRight: '40px' }}
                                                    placeholder="Enter your Termii API key"
                                                    value={data.termii_api_key}
                                                    onChange={e => setData('termii_api_key', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                                                    onClick={() => setShowTermiiKey(!showTermiiKey)}
                                                >
                                                    {showTermiiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {errors.termii_api_key && <p className="error-text">{errors.termii_api_key}</p>}
                                            <p className="upload-hint">Found in your Termii dashboard under API Settings.</p>
                                        </div>

                                        <div className="settings-form-group">
                                            <label className="settings-label">Sender ID</label>
                                            <input
                                                type="text"
                                                className="settings-input"
                                                placeholder="e.g., SchoolAlert"
                                                value={data.termii_sender_id}
                                                onChange={e => setData('termii_sender_id', e.target.value)}
                                            />
                                            <p className="upload-hint">Max 11 characters. This is the name recipients will see.</p>
                                        </div>
                                    </div>
                                </div>
                            )}


                        </div>
                    </div>

                    <div className="settings-footer">
                        <div className="status-indicator">
                            {wasSuccessful && (
                                <div className="success-badge">
                                    <div className="success-dot" />
                                    <span>API settings saved successfully</span>
                                </div>
                            )}
                        </div>
                        <button type="submit" disabled={processing} className="premium-save-btn">
                            {processing ? <div className="spinner" /> : <Save size={18} />}
                            <span>{processing ? 'Saving...' : 'Securely Save Keys'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </SettingsLayout>
    );
};

export default Api;
