import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [logo, setLogo] = useState('/pob/logo.png'); // Default fallback
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Since this is public route, we might need a public settings endpoint or just try hard.
                // Assuming /settings is public or we need to change how we fetch it.
                // Let's use the same logic as AppSidebar
                // Use proxy to avoid absolute localhost calls
                const res = await axios.get('/settings');
                if (res.data && res.data.icon_dashboard) {
                    let logoUrl = res.data.icon_dashboard;
                    // Strip origin if present (e.g. legacy data saving full URL)
                    if (logoUrl.startsWith('http://localhost:5000')) {
                        logoUrl = logoUrl.replace('http://localhost:5000', '');
                    }
                    if (logoUrl.startsWith('https://localhost:5000')) {
                        logoUrl = logoUrl.replace('https://localhost:5000', '');
                    }
                    // Ensure it starts with /pob/api if relative
                    if (logoUrl.startsWith('/') && !logoUrl.startsWith('/pob/api')) {
                        logoUrl = `/pob/api${logoUrl}`;
                    }
                    setLogo(logoUrl);
                }
            } catch (err) {
                console.error('Failed to fetch settings', err);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const success = await login(email, password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('An error occurred during login.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-secondary">
            <div className="card w-full max-w-md p-4">
                <div className="flex flex-col items-center mb-6">
                    <img src={logo} alt="Logo" style={{ height: '60px', marginBottom: '16px' }} onError={(e) => { e.target.onerror = null; e.target.src = '/pob/logo.png'; }} />
                    <h2 className="text-primary font-bold" style={{ fontSize: '24px' }}>Welcome Back</h2>
                    <p className="text-text-secondary">Sign in to continue to POB System</p>
                </div>

                {error && (
                    <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-bold mb-1 text-text-secondary">Email / Username</label>
                        <input
                            type="text"
                            className="p-4 rounded border-none bg-background focus:outline-primary"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="flex flex-col relative">
                        <label className="text-sm font-bold mb-1 text-text-secondary">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="p-4 rounded border-none bg-background focus:outline-primary w-full pr-10"
                                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', padding: 0 }}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="#" className="text-primary font-bold">Forgot Password?</a>
                    </div>

                    <button type="submit" className="btn btn-primary w-full py-3" style={{ marginTop: '10px' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
