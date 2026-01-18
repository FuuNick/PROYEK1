import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
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
    CFormSelect,
    CInputGroup,
    CInputGroupText,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CForm,
    CFormLabel,
    CSpinner,
    CBadge,
    CTooltip,
    CToast,
    CToastBody,
    CToastClose,
    CToaster,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilCalendar,
    cilPlus,
    cilSearch,
    cilLocationPin,
    cilPeople,
    cilCloudDownload,
    cilPrint,
    cilCloudUpload,
    cilX,
    cilTrash,
    cilQrCode,
    cilDescription,
    cilPowerStandby,
    cilPencil,
    cilCheckCircle,
} from '@coreui/icons'
import Swal from 'sweetalert2'

const Events = () => {
    const navigate = useNavigate()
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [locations, setLocations] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', location_id: '', target_pob_count: 0 })
    const [search, setSearch] = useState('')

    // Toasts
    const [toast, addToast] = useState(0)
    const toaster = useRef()

    useEffect(() => {
        fetchEvents()
        fetchHelpers()
    }, [])

    const createToast = (message, color = 'success') => (
        <CToast autohide={true} delay={3000} color={color} className="text-white align-items-center">
            <div className="d-flex">
                <CToastBody>{message}</CToastBody>
                <CToastClose className="me-2 m-auto" white />
            </div>
        </CToast>
    )

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get('/events', { headers: { token } })
            setEvents(res.data)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
            addToast(createToast('Failed to fetch events', 'danger'))
        }
    }

    const fetchHelpers = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get('/personnel/helpers', { headers: { token } })
            setLocations(res.data.locations)
        } catch (err) {
            console.error(err)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            await axios.post('/events', formData, { headers: { token } })
            setShowModal(false)
            fetchEvents()
            setFormData({ name: '', location_id: '', target_pob_count: 0 })
            addToast(createToast('Event created successfully'))
        } catch (err) {
            console.error(err)
            addToast(createToast(err.response?.data || 'Failed to create event', 'danger'))
        }
    }

    const handleCloseEvent = async (id, name) => {
        Swal.fire({
            title: 'Close Event?',
            text: `Are you sure you want to CLOSE "${name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f9b115', // Warning color
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Close Event',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.patch(`/events/${id}/close`, {}, { headers: { token } })
                    fetchEvents()
                    addToast(createToast('Event closed successfully'))
                } catch (err) {
                    console.error(err)
                    addToast(createToast('Failed to close event', 'danger'))
                }
            }
        })
    }

    const handleDelete = async (id, name) => {
        Swal.fire({
            title: 'Delete Event?',
            text: `Are you sure you want to delete "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Delete',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.delete(`/events/${id}`, { headers: { token } })
                    fetchEvents()
                    addToast(createToast('Event deleted successfully'))
                } catch (err) {
                    console.error(err)
                    addToast(createToast('Failed to delete event', 'danger'))
                }
            }
        })
    }

    // Filter events based on search
    const filteredEvents = events.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.location_name && e.location_name.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <strong>Event Management</strong> <small>List of all events</small>
                    </CCardHeader>
                    <CCardBody>
                        <div className="d-flex flex-wrap justify-content-between mb-4 gap-2">
                            <div className="d-flex gap-2">
                                <CButton color="light" className="border">
                                    <CIcon icon={cilCloudDownload} className="me-2" /> Export
                                </CButton>
                                <CButton color="light" className="border">
                                    <CIcon icon={cilPrint} className="me-2" /> Print
                                </CButton>
                                <CButton color="success" className="text-white">
                                    <CIcon icon={cilCloudUpload} className="me-2" /> Import
                                </CButton>
                                <CButton color="primary" onClick={() => setShowModal(true)}>
                                    <CIcon icon={cilPlus} className="me-2" /> New Event
                                </CButton>
                            </div>

                            <CInputGroup style={{ maxWidth: '300px' }}>
                                <CInputGroupText>
                                    <CIcon icon={cilSearch} />
                                </CInputGroupText>
                                <CFormInput
                                    placeholder="Search events..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <CButton color="light" variant="outline" className="border-start-0 border-gray-300" onClick={() => setSearch('')}>
                                        <CIcon icon={cilX} />
                                    </CButton>
                                )}
                            </CInputGroup>
                        </div>

                        <CTable hover responsive bordered striped className="mb-0">
                            <CTableHead color="light">
                                <CTableRow>
                                    <CTableHeaderCell className="text-center" style={{ width: '60px' }}>#</CTableHeaderCell>
                                    <CTableHeaderCell>Event Name</CTableHeaderCell>
                                    <CTableHeaderCell>Location</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">Status</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">POB</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">Start Time</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">Created By</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center" style={{ width: '180px' }}>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="8" className="text-center p-5">
                                            <CSpinner color="primary" />
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : filteredEvents.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="8" className="text-center p-5 text-medium-emphasis">
                                            No events found matching "{search}".
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    filteredEvents.map((e, index) => (
                                        <CTableRow key={e.id}>
                                            <CTableDataCell className="text-center">
                                                {index + 1}
                                            </CTableDataCell>
                                            <CTableDataCell className="fw-bold text-primary">
                                                {e.name}
                                            </CTableDataCell>
                                            <CTableDataCell>
                                                <div className="d-flex align-items-center">
                                                    <CIcon icon={cilLocationPin} className="me-2 text-secondary" size="sm" />
                                                    {e.location_name}
                                                </div>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CBadge
                                                    color={e.status === 'OPEN' ? 'success' : 'danger'}
                                                    shape="rounded-pill"
                                                >
                                                    {e.status}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                    <CIcon icon={cilPeople} className="text-secondary" size="sm" />
                                                    <strong>{e.current_pob}</strong>
                                                    <span className="text-muted">/</span>
                                                    <span>{e.target_pob_count}</span>
                                                </div>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center text-secondary small">
                                                {new Date(e.created_at).toLocaleString()}
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center text-secondary small">
                                                {e.created_by}
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <CTooltip content={e.status === 'OPEN' ? 'Scan Attendance' : 'View Details'}>
                                                        <CButton
                                                            color={e.status === 'OPEN' ? 'info' : 'secondary'}
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/events/${e.id}`)}
                                                        >
                                                            <CIcon icon={e.status === 'OPEN' ? cilQrCode : cilDescription} />
                                                        </CButton>
                                                    </CTooltip>

                                                    <CTooltip content="Edit Event">
                                                        <CButton
                                                            color="warning"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/events/${e.id}/edit`)}
                                                        >
                                                            <CIcon icon={cilPencil} />
                                                        </CButton>
                                                    </CTooltip>

                                                    {e.status === 'OPEN' && (
                                                        <CTooltip content="Close Event">
                                                            <CButton
                                                                color="warning"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleCloseEvent(e.id, e.name)}
                                                            >
                                                                <CIcon icon={cilPowerStandby} />
                                                            </CButton>
                                                        </CTooltip>
                                                    )}

                                                    <CTooltip content="Delete Event">
                                                        <CButton
                                                            color="danger"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(e.id, e.name)}
                                                        >
                                                            <CIcon icon={cilTrash} />
                                                        </CButton>
                                                    </CTooltip>
                                                </div>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))
                                )}
                            </CTableBody>
                        </CTable>
                    </CCardBody>
                </CCard>
            </CCol>

            {/* Modal */}
            <CModal visible={showModal} onClose={() => setShowModal(false)} alignment="center">
                <CModalHeader onClose={() => setShowModal(false)}>
                    <CModalTitle>Create New Event</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleCreate}>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>Event Name</CFormLabel>
                            <CFormInput
                                placeholder="Enter Event Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <CFormLabel>Location</CFormLabel>
                            <CInputGroup>
                                <CFormSelect
                                    value={formData.location_id}
                                    onChange={e => setFormData({ ...formData, location_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Location</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </CFormSelect>
                                <CInputGroupText>
                                    <CIcon icon={cilLocationPin} />
                                </CInputGroupText>
                            </CInputGroup>
                        </div>

                        <div className="mb-3">
                            <CFormLabel>Target POB</CFormLabel>
                            <CFormInput
                                type="number"
                                placeholder="0"
                                value={formData.target_pob_count}
                                onChange={e => setFormData({ ...formData, target_pob_count: e.target.value })}
                                required
                            />
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
                        <CButton color="primary" type="submit">
                            <CIcon icon={cilCheckCircle} className="me-2" />
                            Create Event
                        </CButton>
                    </CModalFooter>
                </CForm>
            </CModal>

            <CToaster ref={toaster} push={toast} placement="top-end" />
        </CRow>
    )
}

export default Events
