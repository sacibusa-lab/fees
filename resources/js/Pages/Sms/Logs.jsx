import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { MessageSquare, CheckCircle, AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import './Sms.css';

const SmsLogs = ({ logs }) => {
    const [search, setSearch] = React.useState('');

    const filtered = logs.data.filter(log =>
        log.phone.includes(search) ||
        (log.message && log.message.toLowerCase().includes(search.toLowerCase())) ||
        (log.student?.name && log.student.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Layout>
            <Head title="SMS Logs" />
            <div className="sms-page">
                <div className="sms-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                            <Link href="/sms" style={{ color: '#6b7280', display: 'flex' }}>
                                <ArrowLeft size={20} />
                            </Link>
                            <h1 style={{ margin: 0 }}><MessageSquare size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />SMS Logs</h1>
                        </div>
                        <p>View all sent SMS messages and their delivery status</p>
                    </div>
                </div>

                {/* Search */}
                <div style={{ marginBottom: 16, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search by phone, message, or student name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div className="sms-card">
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <MessageSquare size={40} />
                            <h3>No SMS logs found</h3>
                            <p>Try a different search term or send some messages first.</p>
                        </div>
                    ) : (
                        <table className="sms-logs-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Phone</th>
                                    <th>Template</th>
                                    <th>Message</th>
                                    <th>Status</th>
                                    <th>Provider</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.student?.name || 'N/A'}</td>
                                        <td>{log.phone}</td>
                                        <td>{log.template?.label || 'Custom'}</td>
                                        <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.message}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${log.status}`}>
                                                {log.status === 'sent' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                                {log.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#6b7280' }}>{log.provider}</td>
                                        <td style={{ fontSize: 12, color: '#6b7280' }}>{new Date(log.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination */}
                    {logs.links && logs.links.length > 3 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16 }}>
                            {logs.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        fontSize: 13,
                                        background: link.active ? 'var(--primary)' : '#f3f4f6',
                                        color: link.active ? 'white' : '#374151',
                                        textDecoration: 'none',
                                        pointerEvents: link.url ? 'auto' : 'none',
                                        opacity: link.url ? 1 : 0.5,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SmsLogs;
