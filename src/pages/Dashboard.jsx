import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    Users,
    CreditCard,
    UserCheck,
    Building,
    MapPin
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

import UserDashboard from './UserDashboard';

const Dashboard = () => {
    const { user, logout } = useAuth();

    // If user has 'user' or 'medic' role, show the User Dashboard
    if (user && (user.role === 'user' || user.role === 'medic')) {
        return <UserDashboard />;
    }

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/dashboard', {
                headers: { token: token }
            });
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    // Dummy Chart Data until Backend Provides Hourly Stats
    const chartData = [
        { name: '08:00', in: 4, out: 2 },
        { name: '10:00', in: 10, out: 8 },
        { name: '12:00', in: 25, out: 15 },
        { name: '14:00', in: 30, out: 20 },
        { name: '16:00', in: 45, out: 35 },
        { name: '18:00', in: 50, out: 40 },
    ];

    // Vehicle Data (Mock)
    const vehicleData = [
        { name: 'JENE', in: 0, out: 0 },
        { name: 'GUNUNG', in: 0, out: 0 },
        { name: 'KONENG', in: 0, out: 0 },
        { name: 'TEMELAT', in: 0, out: 0 },
        { name: 'LAGAN', in: 0, out: 0 },
    ];

    if (loading) return <div className="p-8 flex items-center justify-center h-screen bg-gray-50">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            {/* Header */}
            <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <h2 className="text-gray-700 font-medium">Dashboard</h2>
                {/* User Profile or Settings could go here */}
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* 1. Total Personnel (Purple) */}
                <div className="card bg-card-purple text-white p-6 relative overflow-hidden rounded-2xl shadow-lg flex flex-col justify-center" style={{ minHeight: '160px' }}>
                    <div className="z-10 relative">
                        <div className="bg-white-20 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                            <Users size={24} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-bold mb-1">{stats?.totalPersonnel}</h3>
                        <p className="text-white text-sm opacity-80">Total Personnel</p>
                    </div>
                    {/* Decorative Circle */}
                    <div className="absolute w-48 h-48 bg-white-10 rounded-full blur-2xl" style={{ right: '-3rem', top: '-3rem' }}></div>
                </div>

                {/* 2. Visitor / Spare (Orange) */}
                <div className="card bg-card-orange text-white p-6 relative overflow-hidden rounded-2xl shadow-lg flex flex-col justify-center" style={{ minHeight: '160px' }}>
                    <div className="z-10 relative">
                        <div className="bg-white-20 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                            <CreditCard size={24} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-bold mb-1">{stats?.visitorCount}</h3>
                        <p className="text-white text-sm opacity-80">Visitor / Spare Cards</p>
                    </div>
                    <div className="absolute w-48 h-48 bg-white-10 rounded-full blur-2xl" style={{ right: '-3rem', top: '-3rem' }}></div>
                </div>

                {/* 3. POB (Blue) */}
                <div className="card bg-card-blue text-white p-6 relative overflow-hidden rounded-2xl shadow-lg flex flex-col justify-center" style={{ minHeight: '160px' }}>
                    <div className="z-10 relative">
                        <div className="bg-white-20 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                            <UserCheck size={24} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-bold mb-1">{stats?.pobCount}</h3>
                        <p className="text-white text-sm opacity-80">Personnel On Board (POB)</p>
                    </div>
                    <div className="absolute w-48 h-48 bg-white-10 rounded-full blur-2xl" style={{ right: '-3rem', top: '-3rem' }}></div>
                </div>

                {/* 4. Column for Small Cards */}
                <div className="flex flex-col gap-4">
                    {/* Total Divisions (Blue Small) */}
                    <div className="bg-card-blue text-white p-4 rounded-xl shadow-md flex items-center relative overflow-hidden flex-1">
                        <div className="bg-white-20 p-2 rounded-lg mr-4">
                            <Building size={20} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold">{stats?.totalDivisions}</h4>
                            <p className="text-xs text-white opacity-80">Total Divisions</p>
                        </div>
                    </div>

                    {/* Total Locations (Yellow Small) */}
                    <div className="bg-card-yellow-light text-orange-dark p-4 rounded-xl shadow-md flex items-center relative overflow-hidden flex-1 border border-orange-200">
                        <div className="bg-orange-100 p-2 rounded-lg mr-4 text-orange-600">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold">{stats?.totalLocations}</h4>
                            <p className="text-xs text-gray-500">Total Locations</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Traffic Activity */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
                    <h3 className="font-bold text-gray-700 mb-6">Traffic Activity (Today)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ea0a5' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ea0a5' }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="in" name="Check-In" stroke="#00c853" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="out" name="Check-Out" stroke="#f44336" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vehicle Activity */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
                    <h3 className="font-bold text-gray-700 mb-6">Traffic Activity Vehicle (Today)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={vehicleData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ea0a5' }} dy={10} angle={-30} textAnchor="end" />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ea0a5' }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="in" name="Check-In" stroke="#1e88e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="out" name="Check-Out" stroke="#fb8c00" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
