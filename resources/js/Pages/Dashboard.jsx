import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { Bell, Wallet, PieChart, CreditCard, Users, Settings } from 'lucide-react';
// Using LineChart for the curved lines as shown in screenshot
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = ({ stats, chartData, userName, recentTransactions }) => {
    // Custom SVG Progress Circle for 53%
    const ProgressCircle = ({ percent }) => {
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        return (
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#d1d5db" strokeWidth="10" />
                    <circle
                        cx="50" cy="50" r="35" fill="none" stroke="#f95416" strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                    />
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
                        <div className="notification-bell">
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </div>
                        <div className="user-greeting">
                            Hi, {userName || 'User'}
                        </div>
                    </div>
                </div>

                {/* Metrics Cards Row */}
                <div className="metrics-row">
                    {/* Dark Card - Term Progress */}
                    <div className="metric-card dark">
                        <div className="term-info">
                            <div className="term-title">{stats.current_term}</div>
                            <div className="term-subtitle">Current Term Progress</div>
                            <div className="term-date">Today: {new Date().toLocaleDateString('en-GB')}</div>
                        </div>
                        <ProgressCircle percent={stats.collection_progress} />
                    </div>

                    {/* Expected Revenue */}
                    <div className="metric-card white">
                        <div className="revenue-icon orange">
                            <Wallet size={24} />
                        </div>
                        <div className="revenue-details">
                            <span className="revenue-amount">
                                {stats.revenue?.currency} {(stats.revenue?.expected || 0).toLocaleString()}
                            </span>
                            <span className="revenue-label">Expected Revenue</span>
                        </div>
                    </div>

                    {/* Generated Revenue */}
                    <div className="metric-card white">
                        <div className="revenue-icon red">
                            <CreditCard size={24} />
                        </div>
                        <div className="revenue-details">
                            <span className="revenue-amount">
                                {stats.revenue?.currency} {(stats.revenue?.generated || 0).toLocaleString()}
                            </span>
                            <span className="revenue-label">Generated Revenue</span>
                        </div>
                    </div>

                    {/* Outstanding Payment - Full Card */}
                    <div className="metric-card white">
                        <div className="revenue-icon orange">
                            <PieChart size={24} />
                        </div>
                        <div className="revenue-details">
                            <span className="revenue-amount">
                                {stats.revenue?.currency} {(stats.revenue?.outstanding || 0).toLocaleString()}
                            </span>
                            <span className="revenue-label">Outstanding Payment</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid: Chart + Sidebars */}
                <div className="main-content-grid">
                    {/* Financial Report Chart */}
                    <div className="financial-chart-card">
                        <div className="chart-header">
                            <h3>Financial Report</h3>
                            <div className="chart-legend">
                                <div className="legend-item"><span className="dot blue"></span> Paid</div>
                                <div className="legend-item"><span className="dot red"></span> Outstanding</div>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={val => `${val / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)}
                                    />
                                    <Line type="monotone" dataKey="paid" name="Paid" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="outstanding" name="Outstanding" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Sidebar Columns */}
                    <div className="sidebar-column">
                        <div className="side-card student-card">
                            <h3>{(stats.total_students || 0).toLocaleString()}</h3>
                            <p>Total Students</p>
                        </div>

                        <div className="side-card config-card">
                            <h4>Fees</h4>
                            <p>setting up and customizing fees for your School</p>
                        </div>

                        <div className="side-card config-card">
                            <h4>Bank Accounts</h4>
                            <p>setting up and managing bank account information</p>
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
                                            <td>₦{parseFloat(tx.amount).toLocaleString()}</td>
                                            <td>{tx.payment_method}</td>
                                            <td>
                                                <span className={`status-badge ${tx.status.toLowerCase()}`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td>{tx.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">No recent transactions found</td>
                                    </tr>
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
