import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import SettingsLayout from './SettingsLayout';
import { Eye, EyeOff, Save } from 'lucide-react';

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
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                <strong>Parameters for:</strong> Paystack
                <p className="mt-1">Enter your API keys below to enable payments.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="settings-form-group">
                    <label className="settings-label">Paystack Public Key</label>
                    <input
                        type="text"
                        className="settings-input font-mono"
                        placeholder="pk_test_..."
                        value={data.paystack_public_key}
                        onChange={e => setData('paystack_public_key', e.target.value)}
                    />
                    {errors.paystack_public_key && <div className="text-red-500 text-sm mt-1">{errors.paystack_public_key}</div>}
                </div>

                <div className="settings-form-group">
                    <label className="settings-label">Paystack Secret Key</label>
                    <div className="relative">
                        <input
                            type={showSecret ? "text" : "password"}
                            className="settings-input font-mono pr-10"
                            placeholder="sk_test_..."
                            value={data.paystack_secret_key}
                            onChange={e => setData('paystack_secret_key', e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowSecret(!showSecret)}
                        >
                            {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.paystack_secret_key && <div className="text-red-500 text-sm mt-1">{errors.paystack_secret_key}</div>}
                    <p className="text-xs text-gray-500 mt-1">Key is masked for security. Overwrite to update.</p>
                </div>

                <div className="flex justify-end items-center gap-4">
                    {wasSuccessful && <span className="text-green-600 font-medium">Keys saved successfully!</span>}
                    <button type="submit" className="settings-submit-btn" disabled={processing}>
                        {processing ? 'Saving...' : 'Save Keys'}
                    </button>
                </div>
            </form>
        </SettingsLayout>
    );
};

export default Api;
