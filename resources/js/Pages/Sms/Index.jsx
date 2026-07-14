import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import {
    MessageSquare,
    MessageCircle,
    Settings2,
    FileText,
    Send,
    Plus,
    Edit3,
    Trash2,
    CheckCircle,
    AlertTriangle,
    X,
    Bell,
    Users,
    ChevronDown,
    ChevronRight,
    Search
} from 'lucide-react';
import './Sms.css';

const SmsIndex = ({ templates, classes, subClasses, classSmsSettings, recentLogs, fees, smsEnabled, smsProvider }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [flashMsg, setFlashMsg] = useState(null);
    const [expandedClasses, setExpandedClasses] = useState({});

    // Template editor state
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showTemplateForm, setShowTemplateForm] = useState(false);

    const { data: templateData, setData: setTemplateData, post: postTemplate, processing: templateProcessing, reset: resetTemplate } = useForm({
        id: null,
        name: '',
        label: '',
        message: '',
        is_active: true,
    });

    // Bulk SMS state
    const { data: bulkData, setData: setBulkData, post: postBulk, processing: bulkProcessing } = useForm({
        class_id: '',
        sub_class_id: '',
        student_ids: [],
        message: '',
        send_to_guardian: false,
    });

    const bulkSelectedClass = classes.find(c => c.id === Number(bulkData.class_id));
    const bulkSubClasses = bulkSelectedClass?.sub_classes || [];
    const [bulkStudents, setBulkStudents] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    // Fetch students when class/section changes (none selected by default)
    React.useEffect(() => {
        if (!bulkData.class_id) { setBulkStudents([]); setBulkData('student_ids', []); return; }
        setBulkLoading(true);
        const params = new URLSearchParams({
            class_id: bulkData.class_id,
            sub_class_id: bulkData.sub_class_id || '',
        });
        fetch(`/sms/students?${params}`)
            .then(r => r.json())
            .then(data => {
                setBulkStudents(data);
                setBulkData('student_ids', []);
                setBulkLoading(false);
            })
            .catch(() => { setBulkStudents([]); setBulkLoading(false); });
    }, [bulkData.class_id, bulkData.sub_class_id]);

    const toggleBulkStudent = (id) => {
        const updated = bulkData.student_ids.includes(id)
            ? bulkData.student_ids.filter(s => s !== id)
            : [...bulkData.student_ids, id];
        setBulkData('student_ids', updated);
    };

    const toggleAllBulkStudents = () => {
        if (bulkData.student_ids.length === bulkStudents.length) {
            setBulkData('student_ids', []);
        } else {
            setBulkData('student_ids', bulkStudents.map(s => s.id));
        }
    };

    // Payment reminders state
    const { data: reminderData, setData: setReminderData, post: postReminder, processing: reminderProcessing } = useForm({
        class_id: '',
        sub_class_id: '',
        fee_id: '',
    });

    // Flash message handling
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        if (success) setFlashMsg({ type: 'success', text: success });
    }, []);

    const toggleClass = (classId) => {
        setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }));
    };

    const handleSendBulk = (e) => {
        e.preventDefault();
        postBulk('/sms/send-bulk', {
            onSuccess: () => {
                setBulkData('message', '');
                setFlashMsg({ type: 'success', text: 'Bulk SMS sent!' });
            },
            onError: (err) => setFlashMsg({ type: 'error', text: err?.message || 'Failed to send SMS.' }),
        });
    };

    // Search for students by name
    const [studentSearch, setStudentSearch] = useState('');

    // Client-side filter for visible students (by search term)
    const visibleStudents = studentSearch
        ? bulkStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
        : bulkStudents;

    const handleSaveTemplate = (e) => {
        e.preventDefault();
        postTemplate('/sms/templates/save', {
            onSuccess: () => {
                setShowTemplateForm(false);
                setEditingTemplate(null);
                resetTemplate();
                setFlashMsg({ type: 'success', text: 'Template saved!' });
            },
        });
    };

    const startEditTemplate = (tpl) => {
        setEditingTemplate(tpl);
        setTemplateData('id', tpl.id);
        setTemplateData('name', tpl.name);
        setTemplateData('label', tpl.label);
        setTemplateData('message', tpl.message);
        setTemplateData('is_active', tpl.is_active);
        setShowTemplateForm(true);
    };

    const startNewTemplate = () => {
        setEditingTemplate(null);
        resetTemplate();
        setTemplateData('is_active', true);
        setShowTemplateForm(true);
    };

    const deleteTemplate = (id) => {
        if (!confirm('Delete this template?')) return;
        router.delete(`/sms/templates/${id}`, {
            onSuccess: () => setFlashMsg({ type: 'success', text: 'Template deleted.' }),
        });
    };

    const getClassSetting = (classId, subClassId = null) => {
        const setting = classSmsSettings.find(s =>
            s.class_id === classId &&
            (subClassId ? s.sub_class_id === subClassId : s.sub_class_id === null)
        );
        return setting ? setting.sms_enabled : true;
    };

    return (
        <Layout>
            <Head title="SMS Notifications" />
            <div className="sms-page">
                {/* Flash Messages */}
                {flashMsg && (
                    <div className={`flash-message flash-${flashMsg.type}`} style={{ marginBottom: 16 }}>
                        {flashMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                        <span>{flashMsg.text}</span>
                        <button className="flash-close" onClick={() => setFlashMsg(null)}><X size={16} /></button>
                    </div>
                )}

                <div className="sms-header">
                    <div>
                        <h1><MessageSquare size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />SMS Notifications</h1>
                        <p>Manage SMS templates, class settings, and send bulk messages</p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="sms-info-box">
                    <Bell size={18} />
                    <span>
                        SMS is currently <strong>{smsEnabled ? 'ENABLED' : 'DISABLED'}</strong>.
                        Provider: <strong>{smsProvider}</strong>.
                        When enabled, payment receipts will be sent automatically via webhook.
                        Configure your <strong>TERMII_API_KEY</strong> and <strong>TERMII_SENDER_ID</strong> in the .env file.
                    </span>
                </div>

                {/* Tabs */}
                <div className="sms-tabs">
                    <button className={`sms-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <MessageCircle size={16} /> Overview
                    </button>
                    <button className={`sms-tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
                        <FileText size={16} /> Templates
                    </button>
                    <button className={`sms-tab ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
                        <Users size={16} /> Class Settings
                    </button>
                    <button className={`sms-tab ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>
                        <Send size={16} /> Bulk SMS
                    </button>
                </div>

                {/* Tab: Overview */}
                {activeTab === 'overview' && (
                    <>
                        <div className="sms-card">
                            <h3><MessageCircle size={18} /> Recent SMS Logs</h3>
                            {recentLogs.length === 0 ? (
                                <div className="empty-state">
                                    <MessageSquare size={40} />
                                    <h3>No SMS sent yet</h3>
                                    <p>SMS logs will appear here after sending messages.</p>
                                </div>
                            ) : (
                                <table className="sms-logs-table">
                                    <thead>
                                        <tr>
                                            <th>Phone</th>
                                            <th>Message</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentLogs.map(log => (
                                            <tr key={log.id}>
                                                <td>{log.phone}</td>
                                                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {log.message}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${log.status}`}>
                                                        {log.status === 'sent' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(log.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* Tab: Templates */}
                {activeTab === 'templates' && (
                    <div className="sms-card">
                        <h3 style={{ justifyContent: 'space-between' }}>
                            <span><FileText size={18} /> SMS Templates</span>
                            <button className="btn-promote" onClick={startNewTemplate} style={{ fontSize: 12, padding: '6px 12px' }}>
                                <Plus size={14} /> New Template
                            </button>
                        </h3>

                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                            Use variables like {'{name}'}, {'{amount}'}, {'{balance}'}, {'{fee}'}, {'{term}'}, {'{guardian}'} in your messages.
                        </p>

                        {showTemplateForm && (
                            <div className="template-form">
                                <form onSubmit={handleSaveTemplate}>
                                    <div className="form-row">
                                        <label>Template Name (system identifier)</label>
                                        <input
                                            type="text"
                                            value={templateData.name}
                                            onChange={e => setTemplateData('name', e.target.value.replace(/[^a-z0-9_]/g, '_'))}
                                            placeholder="e.g., payment_receipt"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>Label (display name)</label>
                                        <input
                                            type="text"
                                            value={templateData.label}
                                            onChange={e => setTemplateData('label', e.target.value)}
                                            placeholder="e.g., Payment Receipt"
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>Message Body</label>
                                        <textarea
                                            value={templateData.message}
                                            onChange={e => setTemplateData('message', e.target.value)}
                                            placeholder="Dear {name}, your payment of {amount} for {fee} has been received..."
                                            required
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn-cancel" onClick={() => { setShowTemplateForm(false); resetTemplate(); }}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-promote" disabled={templateProcessing}>
                                            {templateProcessing ? 'Saving...' : 'Save Template'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {templates.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={40} />
                                <h3>No templates yet</h3>
                                <p>Create your first SMS template to get started.</p>
                            </div>
                        ) : (
                            templates.map(tpl => (
                                <div key={tpl.id} className="template-item">
                                    <div className="template-header">
                                        <div>
                                            <div className="template-name">{tpl.label}</div>
                                            <div className="template-label">{tpl.name}</div>
                                        </div>
                                        <span className={`status-badge ${tpl.is_active ? 'sent' : 'failed'}`}>
                                            {tpl.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="template-message">{tpl.message}</div>
                                    <div className="template-actions">
                                        <button className="btn-edit-template" onClick={() => startEditTemplate(tpl)}>
                                            <Edit3 size={12} /> Edit
                                        </button>
                                        <button className="btn-delete-template" onClick={() => deleteTemplate(tpl.id)}>
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Tab: Class Settings */}
                {activeTab === 'classes' && (
                    <div className="sms-card">
                        <h3><Users size={18} /> Class SMS Settings</h3>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                            Enable or disable SMS notifications for specific classes and sections.
                        </p>

                        <div className="class-sms-list">
                            {classes.map(cls => {
                                const classEnabled = getClassSetting(cls.id);
                                const hasSubClasses = cls.sub_classes && cls.sub_classes.length > 0;
                                const isExpanded = expandedClasses[cls.id];

                                return (
                                    <div key={cls.id}>
                                        <div className="class-sms-item">
                                            <div>
                                                <div className="class-name">{cls.name}</div>
                                                {hasSubClasses && (
                                                    <div className="class-meta">{cls.sub_classes.length} section(s)</div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {hasSubClasses && (
                                                    <button
                                                        onClick={() => toggleClass(cls.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                                                    >
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </button>
                                                )}
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={classEnabled}
                                                        onChange={() => {
                                                            router.post('/sms/class-settings', {
                                                                settings: [{
                                                                    class_id: cls.id,
                                                                    sub_class_id: null,
                                                                    sms_enabled: !classEnabled,
                                                                }]
                                                            }, {
                                                                onSuccess: () => setFlashMsg({ type: 'success', text: 'Settings updated!' }),
                                                            });
                                                        }}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </div>
                                        </div>

                                        {isExpanded && hasSubClasses && (
                                            <div className="sub-class-sms">
                                                {cls.sub_classes.map(sub => {
                                                    const subEnabled = getClassSetting(cls.id, sub.id);
                                                    return (
                                                        <div key={sub.id} className="class-sms-item">
                                                            <div className="class-name" style={{ fontSize: 13 }}>{sub.name}</div>
                                                            <label className="toggle-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={subEnabled}
                                                                    onChange={() => {
                                                                        router.post('/sms/class-settings', {
                                                                            settings: [{
                                                                                class_id: cls.id,
                                                                                sub_class_id: sub.id,
                                                                                sms_enabled: !subEnabled,
                                                                            }]
                                                                        }, {
                                                                            onSuccess: () => setFlashMsg({ type: 'success', text: 'Settings updated!' }),
                                                                        });
                                                                    }}
                                                                />
                                                                <span className="toggle-slider"></span>
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab: Bulk SMS */}
                {activeTab === 'bulk' && (
                    <>
                        <div className="sms-card">
                            <h3><Send size={18} /> Send Bulk SMS</h3>
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                                Select a class, choose individual students, then compose your message.
                            </p>

                            <form onSubmit={handleSendBulk}>
                                <div className="form-row">
                                    <label>Class</label>
                                    <select
                                        value={bulkData.class_id}
                                        onChange={e => { setBulkData('class_id', e.target.value); setBulkData('sub_class_id', ''); }}
                                        required
                                    >
                                        <option value="">Select class...</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {bulkSubClasses.length > 0 && (
                                    <div className="form-row">
                                        <label>Section (optional)</label>
                                        <select
                                            value={bulkData.sub_class_id}
                                            onChange={e => setBulkData('sub_class_id', e.target.value)}
                                        >
                                            <option value="">All sections</option>
                                            {bulkSubClasses.map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Student Checklist */}
                                {bulkData.class_id && (
                                    <div style={{ marginTop: 16, marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                Select Students
                                                {bulkLoading && <span style={{ fontSize: 11, color: '#9ca3af' }}>(loading...)</span>}
                                            </label>
                                            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: 'var(--primary)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={bulkStudents.length > 0 && bulkData.student_ids.length === bulkStudents.length}
                                                    onChange={toggleAllBulkStudents}
                                                    style={{ accentColor: 'var(--primary)' }}
                                                />
                                                {bulkData.student_ids.length === bulkStudents.length ? 'Deselect All' : 'Select All'}
                                            </label>
                                        </div>

                                        {/* Search */}
                                        <div style={{ position: 'relative', marginBottom: 8 }}>
                                            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#9ca3af' }} />
                                            <input
                                                type="text"
                                                placeholder="Search by name..."
                                                value={studentSearch}
                                                onChange={e => setStudentSearch(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 10px 6px 32px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: 6,
                                                    fontSize: 13,
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                }}
                                            />
                                        </div>

                                        <div className="student-selector">
                                            {bulkStudents.length === 0 && !bulkLoading && (
                                                <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                                                    No active students found in this class/section.
                                                </div>
                                            )}
                                            {visibleStudents.length === 0 && bulkStudents.length > 0 && (
                                                <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                                                    No students match "{studentSearch}".
                                                </div>
                                            )}
                                            {visibleStudents.map(s => (
                                                <label key={s.id} className={`student-select-item ${bulkData.student_ids.includes(s.id) ? 'checked' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={bulkData.student_ids.includes(s.id)}
                                                        onChange={() => toggleBulkStudent(s.id)}
                                                    />
                                                    <div>
                                                        <div className="student-name">{s.name}</div>
                                                        <div className="student-meta">
                                                            {s.admission_number} · {s.phone || 'No phone'}
                                                            {s.guardian_name ? ` · G: ${s.guardian_name}` : ''}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                                            {bulkData.student_ids.length} of {bulkStudents.length} selected
                                            {studentSearch && visibleStudents.length !== bulkStudents.length && (
                                                <span> ({visibleStudents.length} shown)</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="bulk-sms-area">
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                                        Message
                                    </label>
                                    <div className="sms-variables-hint">
                                        Available variables: <code>{'{name}'}</code> <code>{'{admission}'}</code> <code>{'{class}'}</code> <code>{'{guardian}'}</code>
                                    </div>
                                    <textarea
                                        value={bulkData.message}
                                        onChange={e => setBulkData('message', e.target.value)}
                                        placeholder="Dear {guardian}, this is to inform you that {name}..."
                                        required
                                        maxLength={1600}
                                    />
                                    <div className="char-count">{bulkData.message.length} / 1600</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                                    <input
                                        type="checkbox"
                                        id="send_to_guardian"
                                        checked={bulkData.send_to_guardian}
                                        onChange={e => setBulkData('send_to_guardian', e.target.checked)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    <label htmlFor="send_to_guardian" style={{ fontSize: 13 }}>Send to guardian phone instead</label>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn-promote"
                                        disabled={bulkProcessing || !bulkData.class_id || bulkData.student_ids.length === 0 || !bulkData.message.trim()}
                                    >
                                        {bulkProcessing ? 'Sending...' : `Send SMS to ${bulkData.student_ids.length} student(s)`}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Payment Reminders */}
                        <div className="sms-card">
                            <h3><Bell size={18} /> Send Payment Reminders</h3>
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                                Send payment reminder SMS to all students with pending payments in a class.
                            </p>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                postReminder('/sms/send-reminders', {
                                    onSuccess: () => setFlashMsg({ type: 'success', text: 'Reminders sent!' }),
                                    onError: () => setFlashMsg({ type: 'error', text: 'Failed to send reminders.' }),
                                });
                            }}>
                                <div className="form-row">
                                    <label>Fee (for amount reference)</label>
                                    <select
                                        value={reminderData.fee_id}
                                        onChange={e => setReminderData('fee_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select fee...</option>
                                        {fees?.map(fee => (
                                            <option key={fee.id} value={fee.id}>
                                                {fee.title} {fee.school_class ? `(${fee.school_class.name})` : ''} — ₦{Number(fee.amount).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn-promote" disabled={reminderProcessing || !reminderData.fee_id}>
                                        {reminderProcessing ? 'Sending...' : 'Send Payment Reminders'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default SmsIndex;
