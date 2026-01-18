import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
    CButton,
    CFormInput,
    CBadge,
    CToast,
    CToastBody,
    CToastClose,
    CToaster,
    CForm,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilArrowLeft,
    cilLocationPin,
    cilClock,
    cilWarning,
    cilPeople,
    cilCamera,
    cilX,
    cilCheckCircle,
    cilQrCode,
} from '@coreui/icons'
import Swal from 'sweetalert2'

const EventDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [event, setEvent] = useState(null)
    const [attendances, setAttendances] = useState([])
    const [scanUid, setScanUid] = useState('')
    const [timer, setTimer] = useState(0)
    const [showCamera, setShowCamera] = useState(false)
    const inputRef = useRef(null)

    // Toasts
    const [toast, addToast] = useState(0)
    const toaster = useRef()

    useEffect(() => {
        let interval
        if (event?.status === 'OPEN') {
            interval = setInterval(() => {
                setTimer(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [event?.status])

    useEffect(() => {
        fetchDetails()
    }, [])

    // Effect for handling camera scanner
    useEffect(() => {
        if (showCamera) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            )

            scanner.render(onScanSuccess, onScanFailure)

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner. ", error))
            }
        }
    }, [showCamera])

    const createToast = (message, color = 'success') => (
        <CToast autohide={true} delay={3000} color={color} className="text-white align-items-center">
            <div className="d-flex">
                <CToastBody>{message}</CToastBody>
                <CToastClose className="me-2 m-auto" white />
            </div>
        </CToast>
    )

    const onScanSuccess = (decodedText) => {
        setScanUid(decodedText)
        handleScanSubmit(decodedText)
        setShowCamera(false)
    }

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${ error } `)
    }

    const fetchDetails = async () => {
        const token = localStorage.getItem('token')
        try {
            const res = await axios.get(`/events/${id}`, { headers: { token } })
            setEvent(res.data.event)
            setAttendances(res.data.attendances)
            setTimeout(() => inputRef.current?.focus(), 100)
        } catch (err) {
            addToast(createToast('Event not found', 'danger'))
            navigate('/events')
        }
    }

    const handleScanSubmit = async (uidToScan) => {
        const uid = uidToScan || scanUid
        if (!uid.trim()) return

        const token = localStorage.getItem('token')
        try {
            const res = await axios.post(`/events/${id}/scan`, { uid }, { headers: { token } })
            addToast(createToast(res.data.message, 'success'))
            setScanUid('')
            fetchDetails()
        } catch (err) {
            addToast(createToast(err.response?.data?.message || 'Scan Failed', 'danger'))
            setScanUid('')
        }
    }

    const handleScan = async (e) => {
        e.preventDefault()
        handleScanSubmit()
    }

    const handleClose = async () => {
        Swal.fire({
            title: 'Close Event?',
            text: 'Are you sure you want to CLOSE this event? No further scanning will be allowed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f9b115',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Close Event',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.patch(`/events/${id}/close`, {}, { headers: { token } })
                    fetchDetails()
                    addToast(createToast('Event closed successfully'))
                } catch (err) {
                    addToast(createToast('Failed to close event', 'danger'))
                }
            }
        })
    }

    if (!event) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 80px)' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    )

    return (
        <div className="p-4">
            <CButton color="link" className="text-decoration-none text-muted mb-3 p-0" onClick={() => navigate('/events')}>
                <CIcon icon={cilArrowLeft} className="me-2" />
                Back to Events
            </CButton>

            <CRow>
                {/* Left Column: Event Card & Scanner */}
                <CCol xs={12} md={4} className="mb-4">
                    <CCard className="mb-4 shadow-sm border-0 bg-white">
                        <CCardBody className="position-relative overflow-hidden">
                            {/* Decorative Background Element */}
                            <div className="position-absolute top-0 end-0 bg-primary opacity-10 rounded-circle" style={{ width: '150px', height: '150px', transform: 'translate(30%, -30%)' }}></div>

                            <h2 className="fw-bold mb-2">{event.name}</h2>
                            <div className="d-flex align-items-center text-muted mb-1">
                                <CIcon icon={cilLocationPin} className="text-primary me-2" />
                                {event.location_name}
                            </div>
                            <div className="d-flex align-items-center text-muted small">
                                <CIcon icon={cilClock} className="text-warning me-2" />
                                <span>Open Start Scan: {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div className="bg-light p-3 rounded mt-3 d-flex justify-content-between align-items-center border">
                                <div>
                                    <div className="small text-uppercase fw-bold text-muted">Status</div>
                                    <div className={`fw-bold d-flex align-items-center ${event.status === 'OPEN' ? 'text-success' : 'text-danger'}`}>
                                        <div className={`rounded-circle me-2 ${event.status === 'OPEN' ? 'bg-success' : 'bg-danger'}`} style={{ width: '8px', height: '8px' }}></div>
                                        {event.status}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className="small text-uppercase fw-bold text-muted">POB</div>
                                    <div className="fw-bold h5 mb-0">
                                        {attendances.length} <span className="text-muted small">/ {event.target_pob_count}</span>
                                    </div>
                                </div>
                            </div>

                            {event.status === 'OPEN' && (
                                <>
                                    <div className="d-grid mt-3">
                                        <CButton color="danger" variant="outline" onClick={handleClose}>
                                            <CIcon icon={cilWarning} className="me-2" />
                                            Close Event
                                        </CButton>
                                    </div>

                                    <div className="text-center mt-3">
                                        <div className="small text-uppercase fw-bold text-muted">Duration</div>
                                        <div className="h4 fw-bold font-monospace text-dark">
                                            {new Date(timer * 1000).toISOString().substr(11, 8)}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CCardBody>
                    </CCard>

                    {event.status === 'OPEN' ? (
                        <CCard className="shadow-sm border-0">
                            <CCardBody>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="p-2 bg-light rounded me-3">
                                        <CIcon icon={cilQrCode} size="xl" className="text-primary" />
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-0">Live Scanner</h5>
                                        <small className="text-muted">Tap card to register</small>
                                    </div>
                                </div>

                                <CForm onSubmit={handleScan} className="mb-3">
                                    <CFormInput
                                        ref={inputRef}
                                        className="text-center fw-bold fs-4 py-3"
                                        placeholder="Ready to Scan..."
                                        value={scanUid}
                                        onChange={e => setScanUid(e.target.value)}
                                        autoFocus
                                        onBlur={(e) => {
                                            if (!showCamera) {
                                                setTimeout(() => e.target.focus(), 2000)
                                            }
                                        }}
                                    />
                                </CForm>

                                <div className="border bg-light rounded mt-3 p-3">
                                    <div className="text-center small text-uppercase fw-bold text-muted mb-2">Scan QR Code</div>
                                    {showCamera ? (
                                        <div className="animate-fade-in">
                                            <div id="reader" className="rounded overflow-hidden border mb-2"></div>
                                            <CButton color="secondary" variant="ghost" className="w-100" onClick={() => setShowCamera(false)}>
                                                <CIcon icon={cilX} className="me-2" /> Close Camera
                                            </CButton>
                                        </div>
                                    ) : (
                                        <CButton color="info" variant="outline" className="w-100" onClick={() => setShowCamera(true)}>
                                            <CIcon icon={cilCamera} className="me-2" /> Use Camera
                                        </CButton>
                                    )}
                                </div>
                            </CCardBody>
                        </CCard>
                    ) : (
                        <div className="bg-light border border-dashed rounded p-5 text-center text-muted">
                            <CIcon icon={cilCheckCircle} size="4xl" className="text-muted mb-3" />
                            <h5>Event Closed</h5>
                            <p className="mb-0">Attendance recording is finished.</p>
                        </div>
                    )}
                </CCol>

                {/* Right Column: Attendance List */}
                <CCol xs={12} md={8}>
                    <CCard className="shadow-sm border-0 h-100">
                        <CCardHeader className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <CIcon icon={cilPeople} className="me-2 text-primary" size="lg" />
                                <strong>Attendance Log</strong>
                            </div>
                            <CBadge color="light" className="text-dark border">
                                Total: {attendances.length}
                            </CBadge>
                        </CCardHeader>
                        <CCardBody className="p-0 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                            <CTable hover responsive striped className="mb-0">
                                <CTableHead color="light" className="sticky-top">
                                    <CTableRow>
                                        <CTableHeaderCell className="ps-4">Name</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">UID</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center">Time</CTableHeaderCell>
                                        <CTableHeaderCell className="text-center pe-4">Status</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {attendances.length > 0 ? (
                                        attendances.map((a, i) => (
                                            <CTableRow key={i}>
                                                <CTableDataCell className="ps-4 fw-bold">{a.personnel_name}</CTableDataCell>
                                                <CTableDataCell className="text-center font-monospace small text-muted">{a.uid}</CTableDataCell>
                                                <CTableDataCell className="text-center">
                                                    <CIcon icon={cilClock} size="sm" className="me-1 text-muted" />
                                                    {new Date(a.scanned_at).toLocaleTimeString()}
                                                </CTableDataCell>
                                                <CTableDataCell className="text-center pe-4">
                                                    <CBadge color="success" shape="rounded-pill">
                                                        <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
                                                        PRESENT
                                                    </CBadge>
                                                </CTableDataCell>
                                            </CTableRow>
                                        ))
                                    ) : (
                                        <CTableRow>
                                            <CTableDataCell colSpan="4" className="text-center p-5 text-muted">
                                                <div className="mb-2"><CIcon icon={cilPeople} size="xl" className="text-light-emphasis" /></div>
                                                No attendance recorded yet.
                                            </CTableDataCell>
                                        </CTableRow>
                                    )}
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </CCol>

                <CToaster ref={toaster} push={toast} placement="top-end" />
            </CRow>
        </div>
    )
}

export default EventDetail
