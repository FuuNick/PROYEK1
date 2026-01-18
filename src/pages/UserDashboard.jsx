import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Swal from 'sweetalert2';
import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CButton,
    CFormSelect,
    CBadge,
    CContainer
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
    cilLocationPin,
    cilCamera,
    cilX,
    cilCheckCircle,
    cilSettings
} from '@coreui/icons';

const UserDashboard = () => {
    const { user } = useAuth();
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Scanner Ref
    const scannerRef = useRef(null);

    useEffect(() => {
        fetchLocations();
    }, []);

    // Effect for handling camera scanner
    useEffect(() => {
        if (showCamera && !scannerRef.current) {
            // Create scanner instance
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scannerRef.current = scanner;

            scanner.render(onScanSuccess, onScanFailure);
        }

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
                scannerRef.current = null;
            }
        }
    }, [showCamera]);


    const fetchLocations = async () => {
        try {
            const res = await axios.get('/locations/public'); // Using public endpoint or standard locations
            setLocations(res.data);
            if (res.data.length > 0) {
                // Try to recover from local storage or default to first
                const savedLoc = localStorage.getItem('user_dash_location');
                if (savedLoc && res.data.find(l => l.id == savedLoc)) {
                    setSelectedLocation(savedLoc);
                } else {
                    setSelectedLocation(res.data[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch locations", err);
        }
    };

    const handleLocationChange = (e) => {
        const val = e.target.value;
        setSelectedLocation(val);
        localStorage.setItem('user_dash_location', val);
    };

    const onScanSuccess = (decodedText) => {
        if (isProcessing) return;

        // Stop scanning immediately on success to prevent multiple reads
        setShowCamera(false);
        handleScanSubmit(decodedText);
    };

    const onScanFailure = (error) => {
        // console.warn(error);
    };

    const handleScanSubmit = async (uid) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            // Beep sound
            new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3').play().catch(e => { });

            const token = localStorage.getItem('token');
            const res = await axios.post('/scan',
                { uid: uid, location_id: selectedLocation },
                { headers: { token: token } }
            );

            const data = res.data;

            if (data.status === 'success') {
                let color = data.action === 'IN' ? '#10B981' : '#EF4444';
                let actionText = data.action === 'IN' ? 'Welcome!' : 'See You!';

                // Avatar Logic
                let avatarHtml = '';
                if (data.personnel && data.personnel.photo) {
                    const photoUrl = data.personnel.photo.startsWith('http')
                        ? data.personnel.photo
                        : `/pob/api/uploads/${data.personnel.photo}`;
                    avatarHtml = `<img src="${photoUrl}" class="rounded-circle mb-3 border border-3 border-white shadow" style="width: 80px; height: 80px; object-fit: cover;">`;
                } else {
                    avatarHtml = `<div class="mx-auto mb-3 rounded-circle bg-light d-flex align-items-center justify-content-center border" style="width: 80px; height: 80px;"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`;
                }

                Swal.fire({
                    title: actionText,
                    html: `
                        ${avatarHtml}
                        <h3 class="fw-bold fs-3 text-dark">${data.personnel.name || 'User'}</h3>
                        <p class="text-muted mb-0">${data.message}</p>
                        <small class="text-muted opacity-75">${data.location || ''}</small>
                    `,
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 2500
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: data.message,
                    icon: 'error'
                });
            }

        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: err.response?.data?.message || 'Scan Failed',
                icon: 'error'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <CContainer fluid className="p-4">
            <h2 className="mb-4 text-gray-800 font-semibold">My Dashboard</h2>

            <CRow>
                {/* Welcome Card */}
                <CCol xs={12} className="mb-4">
                    <CCard className="bg-primary text-white border-0 shadow overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)' }}>
                        <CCardBody>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h2 className="text-white mb-2">Welcome back, {user?.name}</h2>
                                    <div className="d-flex align-items-center gap-3">
                                        <CBadge color="light" className="text-primary rounded-pill">{user?.role}</CBadge>
                                        <span className="text-white opacity-75">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                                <div className="d-none d-md-block">
                                    <CButton color="light" variant="outline" className="fw-bold text-white border-white" href="/profile">
                                        <CIcon icon={cilSettings} className="me-2" /> Update Profile
                                    </CButton>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>

                {/* Scanner Section */}
                <CCol lg={8} md={12} className="mb-4">
                    <CCard className="shadow-sm">
                        <CCardHeader>
                            <h5>Attendance Scanner</h5>
                        </CCardHeader>
                        <CCardBody className="text-center">



                            {/* Camera Container */}
                            <div className="mx-auto position-relative rounded overflow-hidden bg-dark mb-4 border border-secondary" style={{ maxWidth: '100%', aspectRatio: '1/1' }}>

                                {!showCamera && (
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4">
                                        <div className="bg-secondary rounded-circle p-4 mb-3" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CIcon icon={cilCamera} className="text-white" size="xxl" style={{ width: '40px', height: '40px' }} />
                                        </div>
                                        <h5 className="text-white-50">Camera is offline</h5>
                                    </div>
                                )}

                                <div id="reader" style={{ width: '100%', height: '100%', display: showCamera ? 'block' : 'none' }}></div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mx-auto" style={{ maxWidth: '100%' }}>
                                {!showCamera ? (
                                    <CButton color="primary" className="w-100 py-3 rounded-3 fw-bold" onClick={() => setShowCamera(true)}>
                                        <CIcon icon={cilCamera} className="me-2" /> Start Camera
                                    </CButton>
                                ) : (
                                    <CButton color="danger" className="w-100 py-3 rounded-3 fw-bold" onClick={() => setShowCamera(false)}>
                                        <CIcon icon={cilX} className="me-2" /> Stop Camera
                                    </CButton>
                                )}
                            </div>

                        </CCardBody>
                    </CCard>
                </CCol>

                {/* Right Sidebar */}
                <CCol lg={4} md={12}>
                    {/* System Status */}
                    <CCard className="mb-4 shadow-sm">
                        <CCardHeader>
                            <h5>System Status</h5>
                        </CCardHeader>
                        <CCardBody>
                            <div className="d-flex align-items-center gap-3">
                                <span className="position-relative d-flex" style={{ width: '12px', height: '12px' }}>
                                    <span className="position-absolute d-inline-flex h-100 w-100 rounded-circle bg-success opacity-75" style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                                    <span className="position-relative d-inline-flex rounded-circle h-100 w-100 bg-success"></span>
                                </span>
                                <div className="flex-grow-1 ms-2">
                                    <h5 className="mb-0 text-success">Online & Ready</h5>
                                    <small className="text-muted">System is operational</small>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>

                    {/* Instructions */}
                    <CCard className="shadow-sm">
                        <CCardHeader>
                            <h5>Instructions</h5>
                        </CCardHeader>
                        <CCardBody className="p-0">
                            <ul className="list-group list-group-flush">

                                <li className="list-group-item d-flex gap-3 px-4 py-3">
                                    <div className="bg-light-primary text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '24px', height: '24px', backgroundColor: '#ebf5ff' }}>1</div>
                                    <div className="my-auto text-muted">Grant browser camera permissions when prompted.</div>
                                </li>
                                <li className="list-group-item d-flex gap-3 px-4 py-3">
                                    <div className="bg-light-primary text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '24px', height: '24px', backgroundColor: '#ebf5ff' }}>2</div>
                                    <div className="my-auto text-muted">Keep the QR code within the frame to scan.</div>
                                </li>
                            </ul>
                        </CCardBody>
                    </CCard>
                </CCol>

            </CRow>
            <style jsx>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
        </CContainer>
    );
};

export default UserDashboard;
