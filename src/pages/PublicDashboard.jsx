import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Wifi } from 'lucide-react';
import Swal from 'sweetalert2';
import './PublicDashboard.css';

const PublicDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConnected, setIsConnected] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // Force Re-render Key
    const [errorMsg, setErrorMsg] = useState(null);

    // Filtering State
    const [locations, setLocations] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedLocationId, setSelectedLocationId] = useState(searchParams.get('location_id') || '');

    const [systemConfig, setSystemConfig] = useState(null);

    // Refs for accessing latest state in socket callbacks/intervals
    const selectedLocationIdRef = useRef(selectedLocationId);
    const systemConfigRef = useRef(systemConfig);
    const dashboardInfoRef = useRef(null);
    const statsRef = useRef(null); // Track stats for comparison

    useEffect(() => {
        statsRef.current = stats;
    }, [stats]);

    useEffect(() => {
        selectedLocationIdRef.current = selectedLocationId;
    }, [selectedLocationId]);

    useEffect(() => {
        systemConfigRef.current = systemConfig;
    }, [systemConfig]);

    useEffect(() => {
        // Socket Connection - Connect to properly namespaced path
        // Apache Proxy handles /pob/socket.io -> localhost:5000/socket.io
        const socket = io({
            path: '/pob/socket.io',
            transports: ['polling', 'websocket'], // Force polling first for better proxy compatibility
            reconnectionAttempts: 5
        });

        // Listen for Real-time Connection
        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        // NEW: Real-time Scan Alert
        socket.on('new_log', (data) => {
            console.log("New Scan Log:", data);

            // Filter Logic:
            // 1. Get Current Dashboard Context
            // The `stats` state might be stale in closure. Use Ref if available or check logic.
            // But we don't have statsRef. 
            // However, we know `selectedLocationIdRef.current` (The ID being viewed).
            // We need to know the TYPE of the viewed location.
            // Ideally we fetched system settings or location list.
            // Let's rely on `locations` state if available.

            // 1. Get Current Dashboard Context properly (avoiding stale closure)
            // Priority: Explicit ID (Ref) -> Active Dashboard Info (Ref) -> System Config Default (Ref)
            const currentLocId = selectedLocationIdRef.current || dashboardInfoRef.current?.id || systemConfigRef.current?.site_parent_location_id;

            // Should we show this alert?
            let shouldShow = true;

            if (currentLocId) {
                // We are viewing a specific location.
                // Find its details in `locations` array (fetched on mount)
                // Note: locations array might be needed in a Ref too? No, it's static mostly.
                // Assuming `locations` state is accessible. Wait, `useEffect` closure trap.
                // We need to access `locations` inside this callback.
                // Since this effect has [] deps, `locations` will be empty/initial.
                // SOLUTION: Move socket setup to a separate effect dependent on `locations`? 
                // OR better: Just use logic based on `data` vs `currentLocId`.

                // If we don't know our own type, we can't implement "Site shows all".
                // But wait, User said "SOKA (Site) shows all".
                // If I am SOKA, my ID is SOKA_ID.
                // If data.location_id is POS 2 (Child of SOKA).
                // I need to know if I am the Parent.
                // `data.location_parent_id` tells us the Parent of the scanner.

                // Logic Table:
                // 1. If `currentLocId` matches `data.location_id` -> SHOW (Direct Match).
                // 2. If `currentLocId` matches `data.location_parent_id` -> 
                //    User said: "Alert TIDAK perlu tampil di POS 1 (Parent) jika scan di POS 2".
                //    So: Parent should NOT show Child scans.
                //    UNLESS it is "SOKA" (The Main Site Dashboard).
                //    How do we distinguish "POS 1 (Gate)" from "SOKA (Site)"? 
                //    BY TYPE.
                //    We need to know OUR Type.

                // Since closure prevents accessing `stats` or `locations` easily without recreating socket freq,
                // Let's assume global/site view if `currentLocId` is undefined.

                // TRICK: We can just fetch the dashboard Type on mount/update and store in Ref?
                // Let's assume we implement a strict "Exact Match Only" unless "GLOBAL".
            }

            // Strict Filter Implementation without complex state deps:
            // Use a Ref to hold "Current Location Info" updated by `fetchDashboardData`.
            // (I will add `dashboardInfoRef` below).

            const dashInfo = dashboardInfoRef.current; // { id, type }

            if (dashInfo && dashInfo.id) {
                // Specific Dashboard Active
                if (dashInfo.type === 'SITE') {
                    // Site shows EVERYTHING (All descendants)
                    // We assume anything hitting backend belongs to this site tree if filtered.
                    // But simpler: YES, Show All for SITE.
                    shouldShow = true;
                } else {
                    // Gate / Main Gate / Room
                    // Strict Match Only.
                    if (parseInt(data.location_id) !== parseInt(dashInfo.id)) {
                        shouldShow = false;
                    }
                }
            } else {
                // Global view -> Show All
                shouldShow = true;
            }

            // ALWAYS Refresh Dashboard Data when a relevant log comes in
            // Implement Aggressive Polling to ensure DB consistency and defeat cache



            console.log(`[Socket] Received Log. Triggering Dashboard Update Sequence for Loc ${currentLocId}...`);

            // 1. Quick Update (500ms)
            setTimeout(() => {
                console.log("[Socket] Fetch Attempt 1 (500ms)");
                fetchDashboardData(currentLocId);
            }, 500);

            // 2. Standard Update (2000ms)
            setTimeout(() => {
                console.log("[Socket] Fetch Attempt 2 (2000ms)");
                fetchDashboardData(currentLocId);
            }, 2000);

            // 3. Late Check (5000ms)
            setTimeout(() => {
                console.log("[Socket] Final Consistency Check (5000ms)");
                fetchDashboardData(currentLocId);
            }, 5000);

            if (!shouldShow) return;

            // Determine Alert Styling
            let title = 'UNKNOWN';
            let bg = '#1f2937'; // Default Gray
            let displayMessage = '';

            if (data.status === 'IN') {
                title = 'WELCOME';
                bg = '#064e3b'; // Green 900
                displayMessage = data.message_in ? data.message_in : `Welcome ${data.name}`;
            } else if (data.status === 'OUT') {
                title = 'SAMPAI JUMPA';
                bg = '#7f1d1d'; // Red 900
                displayMessage = data.message_out ? data.message_out : `Goodbye ${data.name}`;
            } else if (data.status === 'RETURN') {
                title = 'WELCOME BACK'; // Returned to Base
                bg = '#1e3a8a'; // Blue 900
                displayMessage = `Welcome Back ${data.name} to Base`;
            } else {
                title = 'INFORMATION';
                displayMessage = data.name;
            }

            // MCU Warning Check
            let mcuHtml = '';
            let timerSettings = 5000;

            if (data.mcu_warning) {
                mcuHtml = `
                    <div style="margin-top: 1rem; padding: 1rem; background-color: #dc2626; color: white; border-radius: 8px; border: 2px solid white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; animation: pulse 1s infinite;">
                        <span style="font-weight: bold; font-size: 1.2rem;">${data.mcu_warning}</span>
                    </div>
                `;
                timerSettings = 10000;
            }

            // Fire SweetAlert
            Swal.fire({
                title: title,
                html: `
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        ${data.avatar_url
                        ? `<img src="${data.avatar_url}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid white; margin-bottom: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">`
                        : `<div style="width: 150px; height: 150px; border-radius: 50%; background-color: white; color: #333; display: flex; align-items: center; justify-content: center; border: 3px solid white; margin-bottom: 1rem;">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                               </div>`
                    }
                        <h3 style="font-size: 1.8rem; font-weight: bold; color: white; margin-bottom: 0.5rem;">${displayMessage}</h3>
                        ${mcuHtml}
                        <p style="color: #d1d5db; margin-top: 0.5rem; font-size: 1.1rem;">${data.location}</p>
                    </div>
                `,
                background: bg,
                color: '#ffffff',
                width: 600,
                padding: '2em',
                showConfirmButton: false,
                timer: timerSettings,
                backdrop: `rgba(0,0,0,0.8)`,
                customClass: {
                    popup: 'swal2-dark-popup' // Optional custom class if needed
                }
            });
        });

        // Also listen for general updates
        socket.on('dashboard_update', () => {
            const currentLocId = selectedLocationIdRef.current || systemConfigRef.current?.site_parent_location_id;
            fetchDashboardData(currentLocId);
        });

        fetchLocations();
        fetchSystemSettings(); // Fetch settings first
        // Initial fetch handled by another effect watching selectedLocationId

        const interval = setInterval(() => {
            const currentLocId = selectedLocationIdRef.current || systemConfigRef.current?.site_parent_location_id;
            fetchDashboardData(currentLocId);
        }, 60000); // 60s Refresh

        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(clockInterval);
            socket.disconnect();
        };
    }, []); // Empty dependency: Connect ONCE and stay connected


    useEffect(() => {
        // Priority: 1. URL Param, 2. System Setting Filter, 3. Null (Global)
        const targetLocationId = selectedLocationId || systemConfig?.site_parent_location_id;

        setLoading(true);
        fetchDashboardData(targetLocationId);
    }, [selectedLocationId, systemConfig]);

    const fetchSystemSettings = async () => {
        try {
            const res = await axios.get(`${window.location.origin}/pob/api/settings`);
            setSystemConfig(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchLocations = async () => {
        try {
            const res = await axios.get(`${window.location.origin}/pob/api/locations/public`);
            setLocations(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchDashboardData = async (locId) => {
        try {
            const params = locId ? { location_id: locId } : {};
            // Add cache buster
            params._t = Date.now();

            const res = await axios.get(`${window.location.origin}/pob/api/dashboard/public`, { params });
            setStats(res.data);

            // HYBRID FIX: Direct DOM Manipulation to guarantee visual update
            // This mimics the Laravel app's behavior and bypasses any React re-render blocking
            const pobEl = document.getElementById('pob-digital-display');
            if (pobEl && res.data.pobCount !== undefined) {
                let s = res.data.pobCount + "";
                while (s.length < 3) s = "0" + s;
                pobEl.innerText = s;
            }

            // UPDATE REF
            if (res.data.locationInfo) {
                dashboardInfoRef.current = res.data.locationInfo;
            }

            setLoading(false);
        } catch (err) {
            console.error("Error fetching public dashboard data", err);
            setErrorMsg(err.message);
            setLoading(false);
        }
    };

    /* Dropdown Removed - Location set via System Settings or defaulting to SSBW/All */


    if (loading && !stats) return <div className="dashboard-container flex items-center justify-center text-2xl">Loading System...</div>;
    if (errorMsg && !stats) return (
        <div className="dashboard-container flex flex-col items-center justify-center text-white">
            <div className="text-2xl text-red-500 mb-4">System Error</div>
            <div className="text-lg">{errorMsg}</div>
            <button className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700" onClick={() => window.location.reload()}>Retry</button>
        </div>
    );

    // Logic for Header Title (POB [Title]) -> Global Name Preference or Dynamic Location
    let headerTitle = "SSBW";
    if (systemConfig?.dashboard_global_name) {
        headerTitle = systemConfig.dashboard_global_name;
    }

    // Logic for Card below Clock -> Shows the actual Filter Name (e.g. SOKA, POS 1)
    let filterName = "SSBW"; // Default
    const effectiveLocId = selectedLocationId || systemConfig?.site_parent_location_id;

    if (effectiveLocId) {
        const loc = locations.find(l => l.id == effectiveLocId);
        if (loc) {
            filterName = loc.name;

            // DYNAMIC HEADER LOGIC requested by User
            // "POB [Current Location] [Site/Root Name]"
            // Example: "POB POS 2 SOKA" (even if POS 2 -> POS 1 -> SOKA)

            let rootName = "";
            let current = loc;

            // Traverse UP to find the Root Site
            while (current.parent_id) {
                const parent = locations.find(p => p.id == current.parent_id);
                if (parent) {
                    current = parent;
                } else {
                    break;
                }
            }
            // 'current' is now the top-most parent (Site)
            if (current && current.id !== loc.id) {
                rootName = current.name;
            }

            let titleParts = [loc.name];
            if (rootName) {
                titleParts.push(rootName);
            }
            headerTitle = titleParts.join(' ');
        }
    } else if (systemConfig?.dashboard_global_name) {
        filterName = systemConfig.dashboard_global_name;
    }

    // Formatting Time
    const timeString = currentTime.toLocaleTimeString('en-US', { hour12: false });
    const dateString = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Helper for Padding Numbers
    const pad = (num, size = 3) => {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="header-logo-container">
                    <img src="/pob/logo.png" alt="Logo" className="header-logo" />
                </div>
                <div className="header-title-container">
                    <div className="header-title-main">POB {headerTitle}</div>
                    <div className="header-subtitle">PERSONNEL ON BOARD</div>
                </div>
                <div className="flex items-center gap-6">
                    {/* System Connection Status */}
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[0.65rem]" style={{ letterSpacing: '1px', color: isConnected ? '#4ade80' : '#ef4444' }}>
                        <Wifi className="w-3 h-3" />
                        <span>{isConnected ? 'SYSTEM READY' : 'OFFLINE'}</span>
                    </div>

                    {/* LIVE Indicator */}
                    <div className="live-container">
                        <span className="pulse-dot"></span>
                        LIVE
                    </div>
                </div>
            </div>

            {/* MAIN GRID 3 COLUMNS */}
            <div className="dashboard-grid">

                {/* LEFT COLUMN */}
                <div className="col-left">
                    {/* Clock */}
                    <div className="card-base clock-card">
                        <div className="digital-time">{timeString}</div>
                        <div className="digital-date">{dateString}</div>
                    </div>

                    {/* Location Name Big (Filter Name) */}
                    <div className="card-base location-card">
                        <div className="location-name-display">{filterName}</div>
                    </div>

                    {/* Department Counts */}
                    <div className="card-base dept-list-card">
                        <div className="dept-header">DEPARTMENT COUNTS</div>
                        <div className="dept-grid">
                            {/* Real Data from stats.departmentCounts */}
                            {stats?.departmentCounts?.map((div, idx) => (
                                <div key={idx} className="dept-item">
                                    <span className="dept-name-text">
                                        <span className="bullet">•</span> {div.name}
                                    </span>
                                    <span className="dept-count-text">{div.active_count}</span>
                                </div>
                            )) || <div className="text-gray-500 text-center col-span-2">No Division Data</div>}
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN */}
                <div className="col-center">
                    <div className="pob-main-card">
                        <div className="pob-header-band">TOTAL PERSONNEL ON BOARD</div>
                        <div className="pob-number-container">
                            <span id="pob-digital-display" className="pob-number-digital" key={stats?.pobCount}>
                                {pad(stats?.pobCount || 0, 3)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-right">
                    {/* 1. Tap In Today */}
                    <div className="stat-card-right card-tap-in">
                        <div className="stat-card-title">TAP IN HARI INI</div>
                        <div className="stat-card-value">{pad(stats?.todayTapIn || 0)}</div>
                        <div className="stat-card-sub">TOTAL MASUK</div>
                    </div>

                    {/* 2. Vehicle On Board */}
                    <div className="stat-card-right card-vehicle">
                        <div className="stat-card-title">VEHICLE ON BOARD</div>
                        <div className="vehicle-sub-grid">
                            <span>LV {pad(stats?.vehicles?.light || 0)}</span>
                            <span>HV {pad(stats?.vehicles?.heavy || 0)}</span>
                        </div>
                        <div className="stat-card-value">{pad(stats?.vehicles?.onBoard || 0)}</div>
                        <div className="stat-card-sub">TOTAL INSIDE</div>
                    </div>

                    {/* 3. Field Work */}
                    <div className="stat-card-right card-field">
                        <div className="stat-card-title">DINAS LUAR / FIELD</div>
                        <div className="stat-card-value">{pad(stats?.fieldCount || 0)}</div>
                        <div className="stat-card-sub">ON FIELD WORK</div>
                    </div>

                    {/* 4. Off Duty */}
                    <div className="stat-card-right card-off-duty">
                        <div className="stat-card-title">OFF DUTY</div>
                        <div className="stat-card-value">{pad(stats?.visitorCount || 0)}</div>
                        <div className="stat-card-sub">REST / OFF</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PublicDashboard;
