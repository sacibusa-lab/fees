import React, { useState } from 'react';
import SettingsLayout from './SettingsLayout';
import { RefreshCcw, CheckCircle, XCircle, Clock, Info, Eye } from 'lucide-react';
import { Head } from '@inertiajs/react';

const Webhooks = ({ webhooks = [] }) => {
    const [selectedWebhook, setSelectedWebhook] = useState(null);

    return (
        <SettingsLayout title="Webhook Monitoring">
            <Head title="Webhook Monitoring - Settings" />

            <div className="content-card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3>Incoming Events</h3>
                        <p>Track and debug automated messages from Paystack.</p>
                    </div>
                </div>

                <div className="table-container" style={{ marginTop: '20px' }}>
                    <table className="modern-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Event Type</th>
                                <th>Reference</th>
                                <th>Status</th>
                                <th>Processed At</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {webhooks.length > 0 ? (
                                webhooks.map((hook) => (
                                    <tr key={hook.id}>
                                        <td><strong>{hook.event_type}</strong></td>
                                        <td>{hook.reference || 'N/A'}</td>
                                        <td>
                                            <span className={`status-pill ${hook.status}`}>
                                                {hook.status === 'processed' ? <CheckCircle size={14} style={{ marginRight: '4px' }} /> : (hook.status === 'failed' ? <XCircle size={14} style={{ marginRight: '4px' }} /> : <Clock size={14} style={{ marginRight: '4px' }} />)}
                                                {hook.status}
                                            </span>
                                        </td>
                                        <td>{hook.date}</td>
                                        <td>
                                            <button
                                                className="btn-icon"
                                                onClick={() => setSelectedWebhook(hook)}
                                                title="View Payload"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No webhook events logged yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* simple details modal/overlay */}
            {selectedWebhook && (
                <div className="override-modal-overlay" onClick={() => setSelectedWebhook(null)}>
                    <div className="override-modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="override-modal-header">
                            <div>
                                <h3>Event Payload</h3>
                                <p className="subtitle">{selectedWebhook.event_type} • {selectedWebhook.reference}</p>
                            </div>
                        </div>
                        <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                            <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                {JSON.stringify(selectedWebhook.payload, null, 2)}
                            </pre>
                            {selectedWebhook.error_message && (
                                <div style={{ marginTop: '15px', padding: '10px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#b91c1c' }}>
                                    <strong>Error:</strong> {selectedWebhook.error_message}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-btn" onClick={() => setSelectedWebhook(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
};

export default Webhooks;
