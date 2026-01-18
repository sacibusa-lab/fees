import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '../Components/Layout';
import { TrendingUp, Users, School, CreditCard, ArrowUpRight, Search, Filter, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = ({ stats = {}, chartData = [] }) => {
    // Statistically, we can use usePage or pass titles down, 
    // but for now we'll stick to a simple Head component.

    const recentTransactions = []; // Will be passed from controller in next step

    if (!stats) return <Layout><div style={{ padding: '2rem' }}>Loading dashboard data...</div></Layout>;

    return (
        <Layout>
            <Head title="Dashboard" />
            <div className="dashboard">
                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">TOTAL STUDENTS</span>
                            <Users size={20} className="stat-icon green" />
                        </div>
                        <div className="stat-value">{(stats?.totalStudents || 0).toLocaleString()}</div>
                        <div className="stat-change positive">
                            <span>Active</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">TOTAL FEES RECEIVED</span>
                            <CreditCard size={20} className="stat-icon pink" />
                        </div>
                        <div className="stat-value">₦{(stats?.totalReceived || 0).toLocaleString()}</div>
                        <div className="stat-change positive">
                            <span>12%</span>
                            <ArrowUpRight size={14} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">EXPECTED REVENUE</span>
                            <Users size={20} className="stat-icon blue" />
                        </div>
                        <div className="stat-value">₦{(stats?.expected || 0).toLocaleString()}</div>
                        <div className="stat-change positive">
                            <span>5%</span>
                            <ArrowUpRight size={14} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">DEFAULTERS</span>
                            <School size={20} className="stat-icon purple" />
                        </div>
                        <div className="stat-value">{(stats?.defaulters || 0).toLocaleString()}</div>
                        <div className="stat-change">
                            <span>Stable</span>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="charts-section">
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Payment Chart (Current Session)</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                                <XAxis dataKey="name" stroke="#757575" />
                                <YAxis stroke="#757575" tickFormatter={(value) => `₦${value / 1000}k`} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="income-card">
                        <h3>Income (Current Session)</h3>

                        <div className="gross-transaction-section">
                            <span className="gross-label">Gross Transaction</span>
                            <div className="gross-value-row">
                                <span className="gross-amount">₦{(stats?.gross_transaction?.amount || 0).toLocaleString()}</span>
                                <span className="gross-count">({stats?.gross_transaction?.count || 0})</span>
                            </div>
                        </div>

                        <div className="breakdown-section">
                            <h4 className="breakdown-title">Breakdown</h4>
                            <div className="breakdown-list">
                                <div className="breakdown-item">
                                    <span className="term-label">First Term</span>
                                    <div className="term-values">
                                        <span className="term-amount">₦{(stats?.term_breakdown?.first?.amount || 0).toLocaleString()}</span>
                                        <span className="term-count">({stats?.term_breakdown?.first?.count || 0})</span>
                                    </div>
                                </div>
                                <div className="breakdown-item">
                                    <span className="term-label">Second Term</span>
                                    <div className="term-values">
                                        <span className="term-amount green">₦{(stats?.term_breakdown?.second?.amount || 0).toLocaleString()}</span>
                                        <span className="term-count">({stats?.term_breakdown?.second?.count || 0})</span>
                                    </div>
                                </div>
                                <div className="breakdown-item">
                                    <span className="term-label">Third Term</span>
                                    <div className="term-values">
                                        <span className="term-amount green">₦{(stats?.term_breakdown?.third?.amount || 0).toLocaleString()}</span>
                                        <span className="term-count">({stats?.term_breakdown?.third?.count || 0})</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Completed Transactions (Mock for now) */}
                <div className="transactions-section">
                    <div className="section-header">
                        <h3>Completed Transactions</h3>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Payer</th>
                                    <th>Fee</th>
                                    <th>Payment Mode</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No recent transactions found.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
