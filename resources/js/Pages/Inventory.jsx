import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../Components/Layout';
import {
    Package, Plus, Search, AlertTriangle, Download, Upload,
    ShoppingCart, User, ChevronDown, ChevronUp, X, Edit3,
    Layers, DollarSign, Archive
} from 'lucide-react';
import './Inventory.css';

const Inventory = ({ items = [], categories = [], students = [], recentTransactions = [], stats = {} }) => {
    const [activeTab, setActiveTab] = useState('items');
    const [searchTerm, setSearchTerm] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [showAddItem, setShowAddItem] = useState(false);
    const [showAddStock, setShowAddStock] = useState(null);
    const [showIssueItem, setShowIssueItem] = useState(null);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showEditItem, setShowEditItem] = useState(null);

    const [form, setForm] = useState({
        name: '', category_id: '', sku: '', description: '',
        quantity_in_stock: 0, reorder_level: 5, unit_price: 0, unit: 'pcs'
    });
    const [stockForm, setStockForm] = useState({ quantity: 1, unit_price: '', notes: '' });
    const [issueForm, setIssueForm] = useState({ student_id: '', issued_to_name: '', quantity: 1, notes: '' });
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

    const tabs = [
        { id: 'items', label: 'Inventory Items', icon: Package },
        { id: 'issue', label: 'Issue to Student', icon: User },
        { id: 'history', label: 'Transaction History', icon: Archive },
    ];

    const filteredItems = items.filter(i => {
        const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.sku && i.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchCat = catFilter === 'all' || i.category_id === parseInt(catFilter);
        return matchSearch && matchCat;
    });

    const handleAddItem = (e) => {
        e.preventDefault();
        router.post('/inventory/items', form, {
            onSuccess: () => { setShowAddItem(false); resetForm(); }
        });
    };

    const handleEditItem = (e) => {
        e.preventDefault();
        router.post(`/inventory/items/${showEditItem.id}`, showEditItem, {
            onSuccess: () => setShowEditItem(null)
        });
    };

    const handleAddStock = (e) => {
        e.preventDefault();
        router.post('/inventory/stock/add', { ...stockForm, item_id: showAddStock }, {
            onSuccess: () => { setShowAddStock(null); setStockForm({ quantity: 1, unit_price: '', notes: '' }); }
        });
    };

    const handleIssueItem = (e) => {
        e.preventDefault();
        router.post('/inventory/stock/issue', { ...issueForm, item_id: showIssueItem }, {
            onSuccess: () => { setShowIssueItem(null); setIssueForm({ student_id: '', issued_to_name: '', quantity: 1, notes: '' }); }
        });
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        router.post('/inventory/categories', categoryForm, {
            onSuccess: () => { setShowAddCategory(false); setCategoryForm({ name: '', description: '' }); }
        });
    };

    const resetForm = () => setForm({ name: '', category_id: '', sku: '', description: '', quantity_in_stock: 0, reorder_level: 5, unit_price: 0, unit: 'pcs' });

    const formatCurrency = (v) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(v || 0);

    return (
        <Layout>
            <Head title="Inventory Management" />
            <div className="inventory-container">
                <div className="inventory-header">
                    <div>
                        <h1><Package size={24} /> Inventory Management</h1>
                        <p>Track school supplies, uniforms, and stationery — manage stock and issue to students</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="inv-stats-row">
                    <div className="inv-stat-card"><Package size={20} /><div><span className="inv-stat-num">{stats.total_items}</span><span className="inv-stat-lbl">Total Items</span></div></div>
                    <div className="inv-stat-card"><AlertTriangle size={20} color="#dc2626" /><div><span className="inv-stat-num">{stats.low_stock_count}</span><span className="inv-stat-lbl">Low Stock Items</span></div></div>
                    <div className="inv-stat-card"><DollarSign size={20} /><div><span className="inv-stat-num">{formatCurrency(stats.total_value)}</span><span className="inv-stat-lbl">Stock Value</span></div></div>
                    <div className="inv-stat-card"><Archive size={20} /><div><span className="inv-stat-num">{stats.active_items}</span><span className="inv-stat-lbl">Active Items</span></div></div>
                </div>

                {/* Tabs */}
                <div className="inv-tabs">
                    {tabs.map(t => (
                        <button key={t.id} className={`inv-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* TAB: Items */}
                {activeTab === 'items' && (
                    <div className="inv-items-section">
                        <div className="inv-toolbar">
                            <div className="inv-search">
                                <Search size={16} />
                                <input placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                                <option value="all">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button className="btn-primary" onClick={() => setShowAddItem(true)}><Plus size={16} /> Add Item</button>
                            <button className="btn-secondary" onClick={() => setShowAddCategory(true)}><Layers size={16} /> Category</button>
                        </div>

                        <div className="inv-items-grid">
                            {filteredItems.length === 0 ? (
                                <div className="empty-state"><Package size={48} /><h3>No items found</h3><p>Add your first inventory item to get started.</p></div>
                            ) : filteredItems.map(item => (
                                <div key={item.id} className={`inv-item-card ${item.is_low_stock ? 'low-stock' : ''} ${!item.is_active ? 'inactive' : ''}`}>
                                    <div className="inv-item-header">
                                        <span className="inv-item-name">{item.name}</span>
                                        <button className="btn-icon" onClick={() => setShowEditItem(item)}><Edit3 size={14} /></button>
                                    </div>
                                    <div className="inv-item-cat">{item.category_name}</div>
                                    {item.sku && <div className="inv-item-sku">SKU: {item.sku}</div>}
                                    <div className="inv-item-qty">
                                        <span className={`qty-badge ${item.is_low_stock ? 'low' : 'ok'}`}>
                                            {item.quantity_in_stock} {item.unit}
                                        </span>
                                        {item.is_low_stock && <span className="low-warning"><AlertTriangle size={12} /> Low</span>}
                                    </div>
                                    <div className="inv-item-price">{formatCurrency(item.unit_price)} / {item.unit}</div>
                                    <div className="inv-item-actions">
                                        <button className="btn-sm btn-green" onClick={() => { setShowAddStock(item.id); setStockForm({ ...stockForm, unit_price: item.unit_price }); }}>
                                            <Upload size={14} /> Add Stock
                                        </button>
                                        <button className="btn-sm btn-blue" onClick={() => setShowIssueItem(item.id)}>
                                            <Download size={14} /> Issue
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: Issue to Student */}
                {activeTab === 'issue' && (
                    <div className="inv-issue-section">
                        {showIssueItem ? (
                            <div className="issue-form-card">
                                <div className="issue-form-header">
                                    <h3>Issue Item</h3>
                                    <button onClick={() => setShowIssueItem(null)}><X size={18} /></button>
                                </div>
                                <p className="issue-item-name">
                                    Item: <strong>{items.find(i => i.id === showIssueItem)?.name}</strong>
                                    <span className="qty-badge ok" style={{ marginLeft: 8 }}>{items.find(i => i.id === showIssueItem)?.quantity_in_stock} available</span>
                                </p>
                                <form onSubmit={handleIssueItem} className="issue-form">
                                    <div className="form-group">
                                        <label>Student (search by name)</label>
                                        <select value={issueForm.student_id} onChange={e => setIssueForm({ ...issueForm, student_id: e.target.value, issued_to_name: '' })}>
                                            <option value="">Select student...</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.class_name} ({s.admission_number})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Or enter name manually</label>
                                        <input type="text" placeholder="Student name (if not in list)" value={issueForm.issued_to_name}
                                            onChange={e => setIssueForm({ ...issueForm, issued_to_name: e.target.value, student_id: '' })} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Quantity</label>
                                            <input type="number" min="1" value={issueForm.quantity}
                                                onChange={e => setIssueForm({ ...issueForm, quantity: parseInt(e.target.value) || 1 })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Notes (optional)</label>
                                        <input type="text" placeholder="e.g., School uniform for new term" value={issueForm.notes}
                                            onChange={e => setIssueForm({ ...issueForm, notes: e.target.value })} />
                                    </div>
                                    <button type="submit" className="btn-primary"><Download size={16} /> Issue Item</button>
                                </form>
                            </div>
                        ) : (
                            <div className="inv-items-grid">
                                {items.filter(i => i.is_active).map(item => (
                                    <div key={item.id} className={`inv-item-card ${item.is_low_stock ? 'low-stock' : ''}`}>
                                        <div className="inv-item-header">
                                            <span className="inv-item-name">{item.name}</span>
                                        </div>
                                        <div className="inv-item-cat">{item.category_name}</div>
                                        <div className="inv-item-qty">
                                            <span className={`qty-badge ${item.is_low_stock ? 'low' : 'ok'}`}>
                                                {item.quantity_in_stock} {item.unit}
                                            </span>
                                        </div>
                                        <button className="btn-sm btn-blue" style={{ width: '100%', marginTop: 8 }} onClick={() => setShowIssueItem(item.id)}>
                                            <Download size={14} /> Issue to Student
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: Transaction History */}
                {activeTab === 'history' && (
                    <div className="inv-history-section">
                        <div className="table-container">
                            <table className="transactions-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Item</th>
                                        <th>Type</th>
                                        <th>Qty</th>
                                        <th>Amount</th>
                                        <th>Issued To</th>
                                        <th>Notes</th>
                                        <th>By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTransactions.length === 0 ? (
                                        <tr><td colSpan="8" className="no-data">No transactions yet</td></tr>
                                    ) : recentTransactions.map(t => (
                                        <tr key={t.id}>
                                            <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{t.created_at}</td>
                                            <td style={{ fontWeight: 600 }}>{t.item_name}</td>
                                            <td><span className={`tx-type ${t.type}`}>{t.type === 'in' ? 'Stock In' : 'Issued'}</span></td>
                                            <td style={{ fontWeight: 700 }}>{t.quantity}</td>
                                            <td>{formatCurrency(t.total_amount)}</td>
                                            <td>{t.student_name}</td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>{t.notes}</td>
                                            <td style={{ fontSize: 12 }}>{t.created_by}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODALS */}

                {/* Add Item Modal */}
                {showAddItem && (
                    <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h3>Add Inventory Item</h3><button onClick={() => setShowAddItem(false)}><X size={18} /></button></div>
                            <form onSubmit={handleAddItem}>
                                <div className="form-group"><label>Item Name *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Category</label><select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                    <div className="form-group"><label>SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label>Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Initial Stock</label><input type="number" min="0" value={form.quantity_in_stock} onChange={e => setForm({ ...form, quantity_in_stock: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label>Reorder Level</label><input type="number" min="0" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Unit Price (₦)</label><input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label>Unit</label><select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}><option value="pcs">Pieces (pcs)</option><option value="pack">Pack</option><option value="pair">Pair</option><option value="book">Book</option><option value="set">Set</option></select></div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}><Plus size={16} /> Add Item</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Item Modal */}
                {showEditItem && (
                    <div className="modal-overlay" onClick={() => setShowEditItem(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h3>Edit Item</h3><button onClick={() => setShowEditItem(null)}><X size={18} /></button></div>
                            <form onSubmit={handleEditItem}>
                                <div className="form-group"><label>Item Name *</label><input required value={showEditItem.name} onChange={e => setShowEditItem({ ...showEditItem, name: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Category</label><select value={showEditItem.category_id} onChange={e => setShowEditItem({ ...showEditItem, category_id: e.target.value })}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                    <div className="form-group"><label>SKU</label><input value={showEditItem.sku || ''} onChange={e => setShowEditItem({ ...showEditItem, sku: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Reorder Level</label><input type="number" min="0" value={showEditItem.reorder_level} onChange={e => setShowEditItem({ ...showEditItem, reorder_level: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label>Unit Price (₦)</label><input type="number" min="0" step="0.01" value={showEditItem.unit_price} onChange={e => setShowEditItem({ ...showEditItem, unit_price: parseFloat(e.target.value) || 0 })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Unit</label><select value={showEditItem.unit} onChange={e => setShowEditItem({ ...showEditItem, unit: e.target.value })}><option value="pcs">Pieces</option><option value="pack">Pack</option><option value="pair">Pair</option><option value="book">Book</option><option value="set">Set</option></select></div>
                                    <div className="form-group"><label>Active</label><select value={showEditItem.is_active ? '1' : '0'} onChange={e => setShowEditItem({ ...showEditItem, is_active: e.target.value === '1' })}><option value="1">Yes</option><option value="0">No</option></select></div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>Save Changes</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Stock Modal */}
                {showAddStock && (
                    <div className="modal-overlay" onClick={() => setShowAddStock(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h3>Add Stock</h3><button onClick={() => setShowAddStock(null)}><X size={18} /></button></div>
                            <p>Item: <strong>{items.find(i => i.id === showAddStock)?.name}</strong></p>
                            <form onSubmit={handleAddStock}>
                                <div className="form-row">
                                    <div className="form-group"><label>Quantity *</label><input type="number" min="1" required value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 1 })} /></div>
                                    <div className="form-group"><label>Unit Price (₦)</label><input type="number" min="0" step="0.01" value={stockForm.unit_price} onChange={e => setStockForm({ ...stockForm, unit_price: parseFloat(e.target.value) || 0 })} /></div>
                                </div>
                                <div className="form-group"><label>Notes</label><input placeholder="e.g., Purchased from supplier" value={stockForm.notes} onChange={e => setStockForm({ ...stockForm, notes: e.target.value })} /></div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}><Upload size={16} /> Add to Stock</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Category Modal */}
                {showAddCategory && (
                    <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
                        <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h3>New Category</h3><button onClick={() => setShowAddCategory(false)}><X size={18} /></button></div>
                            <form onSubmit={handleAddCategory}>
                                <div className="form-group"><label>Category Name *</label><input required value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} /></div>
                                <div className="form-group"><label>Description</label><input value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} /></div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>Create Category</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Inventory;
