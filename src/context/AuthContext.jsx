import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configure axios base URL - Use Reverse Proxy Path
    // This allows HTTPS frontend to talk to HTTP backend via Apache
    axios.defaults.baseURL = '/pob/api';

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await axios.get('/auth/verify', {
                    headers: { token: token }
                });
                if (res.data === true) {
                    // If verified, we decode the token or fetch user profile. 
                    // For now, let's just assume valid and decode manually or store user info in localStorage too.
                    // Ideally we should have a /profile endpoint.
                    // But the login return returns user info. We can store that.
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            }
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post('/auth/login', { email, password });
        if (res.data.token) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateProfile = async (formData) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('/auth/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'token': token
                }
            });

            if (res.data) {
                const updatedUser = { ...user, ...res.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                return true;
            }
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
