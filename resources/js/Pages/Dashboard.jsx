import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { Bell, Wallet, CreditCard, TrendingUp, Users, AlertTriangle, PieChart as PieIcon, Calendar, DollarSign } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const formatCurrency = (amt) => {
    const value = typeof amt === 'string' ? parseFloat(amt.replace(/,/g, '')) : amt;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value || 0);
};

const Dashboard = ({ stats, chartData, classProgressData, monthlyTrendData, topDefaulters, feeBreakdown, userName, recentTransactions }) => {
    const ProgressCircle = ({ percent }) => {
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        return (
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#d1d5db" strokeWidth="10" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#f95416" strokeWidth="10"
                        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
                    {percent}%
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <Head title="Dashboard" />
            <div className="dashboard">
                {/* Header Row */}
                <div className="dashboard-header-row">
                    <div className="session-title">
                        {stats.session ? `Session ${stats.session}` : 'Session 2022/2023'}
                        <span className="session-subtitle">Academic Session</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="notification-bell"><Bell size={20} /><span className="notification-dot"></span></div>
                        <div className="user-greeting">Hi, {userName || 'User'}</div>
                    </div>
                </div>

                {/* Metrics Cards Row */}
                <div className="metrics-row">
                    <div className="metric-card dark">
                        <div className="term-info">
                            <div className="term-title">{stats.current_term}</div>
                            <div className="term-subtitle">Current Term Progress</div>
                            <div className="term-date">Today: {new Date().toLocaleDateString('en-GB')}</div>
                        </div>
                        <ProgressCircle percent={stats.collection_progress} />
                    </div>

                    <div className="metric-card white">
                        <div className="revenue-icon blue"><Wallet size={24} /></div>
                        <div className="revenue-details">
                            <span className="revenue-amount">{formatCurrency(stats.revenue?.expected)}</span>
                            <span className="revenue-label">Expected Revenue</span>
                        </div>
                    </div>

                    <div className="metric-card white">
                        <div className="revenue-icon green"><TrendingUp size={24} /></div>
                        <div className="revenue-details">
                            <span className="revenue-amount">{formatCurrency(stats.revenue?.generated)}</span>
                            <span className="revenue-label">Generated Revenue</span>
                        </div>
                    </div>

                    <div className="metric-card white">
                        <div className="revenue-icon red"><CreditCard size={24} /></div>
                        <div className="revenue-details">
                            <span className="revenue-amount">{formatCurrency(stats.revenue?.outstanding)}</span>
                            <span className="revenue-label">Outstanding Payment</span>
                        </div>
                    </div>
                </div>

                {/* Today / Week Mini Stats */}
                <div className="mini-stats-row">
                    <div className="mini-stat-card">
                        <Calendar size={18} />
                        <div>
                            <span className="mini-stat-value">{formatCurrency(stats.today_collection)}</span>
                            <span className="mini-stat-label">Today ({stats.today_count} txns)</span>
                        </div>
                    </div>
                    <div className="mini-stat-card">
                        <DollarSign size={18} />
                        <div>
                            <span className="mini-stat-value">{formatCurrency(stats.week_collection)}</span>
                            <span className="mini-stat-label">This Week</span>
                        </div>
                    </div>
                    <div className="mini-stat-card">
                        <Users size={18} />
                        <div>
                            <span className="mini-stat-value">{(stats.active_students || 0).toLocaleString()}</span>
                            <span className="mini-stat-label">Active Students</span>
                        </div>
                    </div>
                    <div className="mini-stat-card">
                        <Users size={18} />
                        <div>
                            <span className="mini-stat-value">{(stats.total_students || 0).toLocaleString()}</span>
                            <span className="mini-stat-label">Total Students</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="main-content-grid">
                    {/* Left Column: Charts */}
                    <div className="dashboard-left-col">
                        {/* Financial Report Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Financial Report by Class</h3>
                                <div className="chart-legend">
                                    <span className="legend-item"><span className="dot blue"></span> Paid</span>
                                    <span className="legend-item"><span className="dot red"></span> Outstanding</span>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={val => `${(val / 1000).toFixed(0)}k`} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => formatCurrency(v)} />
                                        <Line type="monotone" dataKey="paid" name="Paid" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="outstanding" name="Outstanding" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Monthly Collection Trends */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Monthly Collection Trends</h3>
                                <span className="chart-subtitle">Last 12 months</span>
                            </div>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={monthlyTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={val => `${(val / 1000).toFixed(0)}k`} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => formatCurrency(v)} />
                                        <Area type="monotone" dataKey="total" name="Collected" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.1} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Class Progress Bars */}
                        {classProgressData && classProgressData.length > 0 && (
                            <div className="chart-card">
                                <div className="chart-header"><h3>Collection Progress by Class</h3></div>
                                <div className="class-progress-list">
                                    {classProgressData.map((c, i) => (
                                        <div key={i} className="class-progress-item">
                                            <div className="class-progress-header">
                                                <span className="class-progress-name">{c.name}</span>
                                                <span className="class-progress-pct">{c.percentage}%</span>
                                            </div>
                                            <div className="class-progress-bar-track">
                                                <div className="class-progress-bar-fill" style={{ width: `${c.percentage}%` }} />
                                            </div>
                                            <div className="class-progress-detail">
                                                <span>{formatCurrency(c.collected)}</span>
                                                <span>of {formatCurrency(c.expected)}</span>
                                                <span>{c.student_count} students</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Side Panels */}
                    <div className="dashboard-right-col">
                        {/* Student Count */}
                        <div className="side-card highlight-card">
                            <Users size={28} />
                            <div>
                                <h3>{(stats.total_students || 0).toLocaleString()}</h3>
                                <p>Total Students</p>
                            </div>
                        </div>

                        {/* Fee Type Breakdown Pie */}
                        {feeBreakdown && feeBreakdown.length > 0 && (
                            <div className="side-card">
                                <h4 className="side-card-title"><PieIcon size={16} /> Fee Breakdown</h4>
                                <div style={{ width: '100%', height: 200 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={feeBreakdown} dataKey="collected" nameKey="title" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                                                {feeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} formatter={(v) => formatCurrency(v)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="fee-breakdown-legend">
                                    {feeBreakdown.slice(0, 5).map((f, i) => (
                                        <div key={i} className="fee-legend-item">
                                            <span className="fee-dot" style={{ background: COLORS[i % COLORS.length] }} />
                                            <span className="fee-name">{f.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Defaulters */}
                        {topDefaulters && topDefaulters.length > 0 && (
                            <div className="side-card">
                                <h4 className="side-card-title"><AlertTriangle size={16} color="#ef4444" /> Top Defaulters</h4>
                                <div className="defaulters-list">
                                    {topDefaulters.slice(0, 6).map((d, i) => (
                                        <div key={i} className="defaulter-item">
                                            <span className="defaulter-rank">#{i + 1}</span>
                                            <div className="defaulter-info">
                                                <span className="defaulter-name">{d.name}</span>
                                                <span className="defaulter-class">{d.class} · {d.admission_no}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Config Links */}
                        <div className="side-card config-card">
                            <h4>Fee Configuration</h4>
                            <p>Manage fee structures, beneficiaries, and class overrides</p>
                        </div>
                        <div className="side-card config-card">
                            <h4>Bank Accounts</h4>
                            <p>Set up and manage settlement bank accounts</p>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="recent-transactions-section">
                    <h3>Recent Transactions</h3>
                    <div className="table-container">
                        <table className="transactions-table">
                            <thead>
                                <tr>
                                    <th>Payer</th>
                                    <th>Fee Type</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions && recentTransactions.length > 0 ? (
                                    recentTransactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td>{tx.payer}</td>
                                            <td>{tx.fee}</td>
                                            <td>{formatCurrency(tx.amount)}</td>
                                            <td>{tx.payment_method}</td>
                                            <td><span className={`status-badge ${tx.status.toLowerCase()}`}>{tx.status}</span></td>
                                            <td>{tx.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="no-data">No recent transactions found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
