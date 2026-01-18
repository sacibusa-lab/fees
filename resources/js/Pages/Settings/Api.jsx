import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import SettingsLayout from './SettingsLayout';
import { Eye, EyeOff, Save, Settings } from 'lucide-react';

const Api = ({ paystack_public_key, paystack_secret_key }) => {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        paystack_public_key: paystack_public_key || '',
        paystack_secret_key: paystack_secret_key || '',
    });

    const [showSecret, setShowSecret] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/settings/api');
    };

    return (
        <SettingsLayout title="API Integration">
            <div className="settings-max-width">
                <form onSubmit={handleSubmit}>
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
                                            type={showSecret ? "text" : "password"}
                                            className="settings-input font-mono"
                                            style={{ paddingRight: '40px' }}
                                            placeholder="sk_test_..."
                                            value={data.paystack_secret_key}
                                            onChange={e => setData('paystack_secret_key', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                                            onClick={() => setShowSecret(!showSecret)}
                                        >
                                            {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.paystack_secret_key && <p className="error-text">{errors.paystack_secret_key}</p>}
                                    <p className="upload-hint" style={{ marginTop: '8px' }}>Security: Key is masked after saving. Overwrite to update.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="settings-footer">
                        <div className="status-indicator">
                            {wasSuccessful && (
                                <div className="success-badge">
                                    <div className="success-dot" />
                                    <span>API keys saved successfully</span>
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
