import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Layout from '../Components/Layout';
import {
    ArrowUpDown, GraduationCap, CreditCard, Users,
    CheckCircle, AlertTriangle, DollarSign, BookOpen,
    Send, RefreshCw, X
} from 'lucide-react';
import './BulkOperations.css';

const BulkOperations = ({ classes = [], subClasses = [], sessions = [], fees = [], students = [], stats = {} }) => {
    const { flash, errors } = usePage().props;
    const [flashMsg, setFlashMsg] = useState(null);

    useEffect(() => {
        if (flash?.success) setFlashMsg({ type: 'success', text: flash.success });
        else if (flash?.error) setFlashMsg({ type: 'error', text: flash.error });
        else if (flash?.warning) setFlashMsg({ type: 'warning', text: flash.warning });
    }, [flash]);

    useEffect(() => {
        if (flashMsg) {
            const t = setTimeout(() => setFlashMsg(null), 5000);
            return () => clearTimeout(t);
        }
    }, [flashMsg]);
    const [activeTab, setActiveTab] = useState('promote');
    const [processing, setProcessing] = useState(false);

    // Promote state
    const [sourceClassId, setSourceClassId] = useState('');
    const [sourceSectionId, setSourceSectionId] = useState('');
    const [targetClassId, setTargetClassId] = useState('');
    const [targetSectionId, setTargetSectionId] = useState('');
    const [promoteChecked, setPromoteChecked] = useState([]);

    // Graduate state
    const [gradClassId, setGradClassId] = useState('');
    const [gradSectionId, setGradSectionId] = useState('');
    const [gradChecked, setGradChecked] = useState([]);

    // DVA state
    const [dvaClassId, setDvaClassId] = useState('');
    const [dvaSectionId, setDvaSectionId] = useState('');
    const [dvaChecked, setDvaChecked] = useState([]);

    // Payment status
    const [classId, setClassId] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('paid');

    // Fee toggle
    const [feeClassId, setFeeClassId] = useState('');
    const [feeId, setFeeId] = useState('');
    const [feeAction, setFeeAction] = useState('activate');

    const tabs = [
        { id: 'promote', label: 'Promote Students', icon: ArrowUpDown },
        { id: 'graduate', label: 'Graduate', icon: GraduationCap },
        { id: 'dva', label: 'Generate DVA', icon: CreditCard },
        { id: 'payment-status', label: 'Payment Status', icon: DollarSign },
        { id: 'fee-toggle', label: 'Toggle Fee', icon: BookOpen },
    ];

    const filterStudents = (classId, sectionId) => {
        return students.filter(s => {
            if (classId && s.class_id !== parseInt(classId)) return false;
            if (sectionId && s.sub_class_id !== parseInt(sectionId)) return false;
            return true;
        });
    };

    const getFilteredSections = (classId) => {
        // If sections have class_id set, filter by class; otherwise show all global sections
        const hasClassLinks = subClasses.some(sc => sc.class_id !== null);
        if (!classId && hasClassLinks) return [];
        if (hasClassLinks) return subClasses.filter(sc => String(sc.class_id) === String(classId));
        return subClasses; // global sections — show all
    };

    const toggleCheck = (id, setter, list) => {
        setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAll = (filtered, setter, list) => {
        const allIds = filtered.map(s => s.id);
        setter(prev => prev.length === allIds.length ? [] : allIds);
    };

    const handleSubmit = (action) => {
        setProcessing(true);
        let routeUrl = '';
        let data = {};

        switch (action) {
            case 'promote':
                routeUrl = '/bulk-operations/promote';
                data = {
                    student_ids: promoteChecked,
                    target_class_id: parseInt(targetClassId),
                    target_sub_class_id: targetSectionId ? parseInt(targetSectionId) : null,
                };
                break;
            case 'graduate':
                routeUrl = '/bulk-operations/graduate';
                data = { student_ids: gradChecked };
                break;
            case 'dva':
                routeUrl = '/bulk-operations/generate-dva';
                data = { student_ids: dvaChecked };
                break;
            case 'payment-status':
                routeUrl = '/bulk-operations/set-payment-status';
                data = { class_id: parseInt(classId), status: paymentStatus };
                break;
            case 'fee-toggle':
                routeUrl = '/bulk-operations/apply-fee';
                data = { class_id: parseInt(feeClassId), fee_id: parseInt(feeId), action: feeAction };
                break;
        }

        router.post(routeUrl, data, {
            onSuccess: () => setProcessing(false),
            onError: () => setProcessing(false),
            onFinish: () => setProcessing(false),
        });
    };

    const renderStudentChecklist = (filtered, checked, setter) => (
        <div className="student-checklist">
            <div className="checklist-header">
                <label className="check-all">
                    <input
                        type="checkbox"
                        checked={filtered.length > 0 && checked.length === filtered.length}
                        onChange={() => toggleAll(filtered, setter, checked)}
                    />
                    <span>{checked.length} of {filtered.length} selected</span>
                </label>
                <span className="checklist-count">{filtered.length} students</span>
            </div>
            <div className="checklist-scroll">
                {filtered.map(s => (
                    <label key={s.id} className={`check-item ${checked.includes(s.id) ? 'checked' : ''}`}
                        onClick={() => toggleCheck(s.id, setter, checked)}
                    >
                        <input type="checkbox" readOnly checked={checked.includes(s.id)} />
                        <div className="check-info">
                            <span className="check-name">{s.name}</span>
                            <span className="check-meta">{s.admission_number} · {s.class_name}</span>
                        </div>
                    </label>
                ))}
                {filtered.length === 0 && <div className="check-empty">No students found for this class/section.</div>}
            </div>
        </div>
    );

    return (
        <Layout>
            <Head title="Bulk Operations" />
            <div className="bulk-page">
                <div className="bulk-header">
                    <div>
                        <h1>Bulk Operations</h1>
                        <p>Perform actions on multiple students at once</p>
                    </div>
                </div>

                {/* Flash Message */}
                {flashMsg && (
                    <div className={`flash-message flash-${flashMsg.type}`}>
                        {flashMsg.type === 'success' && <CheckCircle size={18} />}
                        {flashMsg.type === 'error' && <AlertTriangle size={18} />}
                        <span>{flashMsg.text}</span>
                        <button className="flash-close" onClick={() => setFlashMsg(null)}><X size={16} /></button>
                    </div>
                )}

                {/* Stats Row */}
                <div className="bulk-stats-row">
                    <div className="bulk-stat-card">
                        <Users size={20} />
                        <div>
                            <span className="bulk-stat-value">{stats.total_students?.toLocaleString() || 0}</span>
                            <span className="bulk-stat-label">Total Students</span>
                        </div>
                    </div>
                    <div className="bulk-stat-card">
                        <CheckCircle size={20} />
                        <div>
                            <span className="bulk-stat-value">{stats.active_students?.toLocaleString() || 0}</span>
                            <span className="bulk-stat-label">Active</span>
                        </div>
                    </div>
                    <div className="bulk-stat-card">
                        <AlertTriangle size={20} />
                        <div>
                            <span className="bulk-stat-value">{stats.unpaid_students?.toLocaleString() || 0}</span>
                            <span className="bulk-stat-label">Unpaid</span>
                        </div>
                    </div>
                    <div className="bulk-stat-card">
                        <BookOpen size={20} />
                        <div>
                            <span className="bulk-stat-value">{stats.classes_count || 0}</span>
                            <span className="bulk-stat-label">Classes</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bulk-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`bulk-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bulk-content-card">
                    {/* Promote */}
                    {activeTab === 'promote' && (
                        <div className="bulk-form-section">
                            <h3><ArrowUpDown size={20} /> Promote Students</h3>
                            <p className="bulk-desc">Select students from a class, then promote them to a higher class.</p>
                            <div className="bulk-dual-panel">
                                <div className="bulk-panel">
                                    <h4>Select Students</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Class</label>
                                            <select value={sourceClassId} onChange={e => { setSourceClassId(e.target.value); setSourceSectionId(''); setPromoteChecked([]); }}>
                                                <option value="">Select class...</option>
                                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Section (optional)</label>
                                            <select value={sourceSectionId} onChange={e => setSourceSectionId(e.target.value)}>
                                                <option value="">All Sections</option>
                                                {getFilteredSections(sourceClassId).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {renderStudentChecklist(filterStudents(sourceClassId, sourceSectionId), promoteChecked, setPromoteChecked)}
                                </div>
                                <div className="bulk-panel">
                                    <h4>Target</h4>
                                    <div className="form-group">
                                        <label>Promote to Class *</label>
                                        <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                                            <option value="">Select target class...</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Promote to Section</label>
                                        <select value={targetSectionId} onChange={e => setTargetSectionId(e.target.value)}>
                                            <option value="">None</option>
                                            {getFilteredSections(targetClassId).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn-bulk-action" onClick={() => handleSubmit('promote')}
                                        disabled={processing || promoteChecked.length === 0 || !targetClassId}
                                        style={{ marginTop: 16 }}>
                                        {processing ? <RefreshCw size={16} className="spin" /> : <ArrowUpDown size={16} />}
                                        {processing ? 'Processing...' : `Promote ${promoteChecked.length} Student${promoteChecked.length !== 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Graduate */}
                    {activeTab === 'graduate' && (
                        <div className="bulk-form-section">
                            <h3><GraduationCap size={20} /> Graduate Students</h3>
                            <p className="bulk-desc">Select students to mark as graduated. They will be moved to alumni records.</p>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Class</label>
                                    <select value={gradClassId} onChange={e => { setGradClassId(e.target.value); setGradSectionId(''); setGradChecked([]); }}>
                                        <option value="">All Classes</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Section (optional)</label>
                                    <select value={gradSectionId} onChange={e => setGradSectionId(e.target.value)}>
                                        <option value="">All Sections</option>
                                        {getFilteredSections(gradClassId).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            {renderStudentChecklist(filterStudents(gradClassId, gradSectionId), gradChecked, setGradChecked)}
                            <button className="btn-bulk-action warning" onClick={() => handleSubmit('graduate')}
                                disabled={processing || gradChecked.length === 0}
                                style={{ marginTop: 16 }}>
                                {processing ? <RefreshCw size={16} className="spin" /> : <GraduationCap size={16} />}
                                {processing ? 'Processing...' : `Graduate ${gradChecked.length} Student${gradChecked.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    )}

                    {/* Generate DVA */}
                    {activeTab === 'dva' && (
                        <div className="bulk-form-section">
                            <h3><CreditCard size={20} /> Generate Virtual Accounts</h3>
                            <p className="bulk-desc">Generate Paystack dedicated virtual accounts for selected students.</p>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Class</label>
                                    <select value={dvaClassId} onChange={e => { setDvaClassId(e.target.value); setDvaSectionId(''); setDvaChecked([]); }}>
                                        <option value="">All Classes</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Section (optional)</label>
                                    <select value={dvaSectionId} onChange={e => setDvaSectionId(e.target.value)}>
                                        <option value="">All Sections</option>
                                        {getFilteredSections(dvaClassId).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            {renderStudentChecklist(filterStudents(dvaClassId, dvaSectionId), dvaChecked, setDvaChecked)}
                            <button className="btn-bulk-action" onClick={() => handleSubmit('dva')}
                                disabled={processing || dvaChecked.length === 0}
                                style={{ marginTop: 16 }}>
                                {processing ? <RefreshCw size={16} className="spin" /> : <CreditCard size={16} />}
                                {processing ? 'Processing...' : `Generate DVA for ${dvaChecked.length} Student${dvaChecked.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    )}

                    {/* Set Payment Status */}
                    {activeTab === 'payment-status' && (
                        <div className="bulk-form-section">
                            <h3><DollarSign size={20} /> Set Payment Status by Class</h3>
                            <p className="bulk-desc">Update the payment status for ALL students in a selected class at once.</p>
                            <div className="form-group">
                                <label>Class</label>
                                <select value={classId} onChange={e => setClassId(e.target.value)}>
                                    <option value="">Select class...</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>New Payment Status</label>
                                <div className="status-options">
                                    {['paid', 'pending', 'partial'].map(s => (
                                        <label key={s} className={`status-option ${paymentStatus === s ? 'selected' : ''}`}>
                                            <input type="radio" name="pstatus" value={s}
                                                checked={paymentStatus === s}
                                                onChange={e => setPaymentStatus(e.target.value)}
                                            />
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button className="btn-bulk-action" onClick={() => handleSubmit('payment-status')} disabled={processing || !classId}>
                                {processing ? <RefreshCw size={16} className="spin" /> : <DollarSign size={16} />}
                                {processing ? 'Processing...' : 'Update Payment Status'}
                            </button>
                        </div>
                    )}

                    {/* Toggle Fee */}
                    {activeTab === 'fee-toggle' && (
                        <div className="bulk-form-section">
                            <h3><BookOpen size={20} /> Activate/Deactivate Fee for Class</h3>
                            <p className="bulk-desc">Enable or disable a fee across a specific class.</p>
                            <div className="form-group">
                                <label>Class</label>
                                <select value={feeClassId} onChange={e => setFeeClassId(e.target.value)}>
                                    <option value="">Select class...</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Fee</label>
                                <select value={feeId} onChange={e => setFeeId(e.target.value)}>
                                    <option value="">Select fee...</option>
                                    {fees.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Action</label>
                                <div className="status-options">
                                    <label className={`status-option ${feeAction === 'activate' ? 'selected' : ''}`}>
                                        <input type="radio" name="faction" value="activate"
                                            checked={feeAction === 'activate'}
                                            onChange={e => setFeeAction(e.target.value)}
                                        />
                                        Activate
                                    </label>
                                    <label className={`status-option ${feeAction === 'deactivate' ? 'selected danger' : ''}`}>
                                        <input type="radio" name="faction" value="deactivate"
                                            checked={feeAction === 'deactivate'}
                                            onChange={e => setFeeAction(e.target.value)}
                                        />
                                        Deactivate
                                    </label>
                                </div>
                            </div>
                            <button className="btn-bulk-action" onClick={() => handleSubmit('fee-toggle')} disabled={processing || !feeClassId || !feeId}>
                                {processing ? <RefreshCw size={16} className="spin" /> : <BookOpen size={16} />}
                                {processing ? 'Processing...' : 'Apply'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default BulkOperations;
