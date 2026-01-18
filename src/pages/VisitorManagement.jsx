import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
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
    cilUserFollow,
    cilBuilding,
    cilLocationPin,
    cilMedicalCross,
    cilCheckCircle,
    cilBan,
    cilX,
    cilSearch,
    cilPeople,
    cilPencil,
    cilExitToApp,
    cilCreditCard,
    cilTrash,
    cilCloudDownload,
    cilPrint,
    cilCloudUpload,
} from '@coreui/icons'
import Swal from 'sweetalert2'

const VisitorManagement = () => {
    // Data State
    const [availableCards, setAvailableCards] = useState([])
    const [activeVisitors, setActiveVisitors] = useState([])
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)

    // Form State (Check-In)
    const [formData, setFormData] = useState({
        personnel_id: '',
        name: '',
        company: '',
        location_id: '',
        mcu_status: 'Fit'
    })

    // Search State (Active Visitors)
    const [search, setSearch] = useState('')

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({
        id: '',
        name: '',
        company: '',
        location_id: '',
        mcu_status: ''
    })

    // Toasts
    const [toast, addToast] = useState(0)
    const toaster = useRef()

    // Refs
    const nameInputRef = useRef(null)
    const scanInputRef = useRef(null)

    useEffect(() => {
        fetchData()
    }, [search])

    const createToast = (message, color = 'success') => (
        <CToast autohide={true} delay={3000} color={color} className="text-white align-items-center">
            <div className="d-flex">
                <CToastBody>{message}</CToastBody>
                <CToastClose className="me-2 m-auto" white />
            </div>
        </CToast>
    )

    const fetchData = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await axios.get('/visitors', {
                headers: { token },
                params: { search }
            })

            setAvailableCards(res.data.available)
            setActiveVisitors(res.data.active)
            setLocations(res.data.locations)
        } catch (err) {
            console.error(err)
            addToast(createToast('Failed to fetch visitor data', 'danger'))
        } finally {
            setLoading(false)
        }
    }

    const handleCheckIn = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            await axios.post('/visitors/check-in', formData, { headers: { token } })

            addToast(createToast('Visitor Check-In Successful'))

            // Reset form and reload data
            setFormData({ personnel_id: '', name: '', company: '', location_id: '', mcu_status: 'Fit' })
            fetchData()
        } catch (err) {
            console.error(err)
            addToast(createToast(err.response?.data || 'An error occurred during check-in', 'danger'))
        }
    }

    const handleCheckOut = async (id, name) => {
        Swal.fire({
            title: `Check-Out ${name}?`,
            text: "Visitor will be signed out and the card returned to the Spare Pool.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Check-Out',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.post(`/visitors/check-out/${id}`, {}, { headers: { token } })

                    addToast(createToast('Visitor checked out successfully'))
                    fetchData()
                } catch (err) {
                    addToast(createToast(err.response?.data || 'Failed to check-out visitor', 'danger'))
                }
            }
        })
    }

    const handleDelete = async (id, name) => {
        Swal.fire({
            title: 'Delete Visitor?',
            text: `Delete record for ${name}? Card will be reset to spare.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Delete',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.post(`/visitors/check-out/${id}`, {}, { headers: { token } }) // Reuse check-out logic

                    addToast(createToast('Visitor record has been deleted'))
                    fetchData()
                } catch (err) {
                    addToast(createToast('Failed to delete visitor', 'danger'))
                }
            }
        })
    }

    const handleEditClick = (visitor) => {
        setEditFormData({
            id: visitor.id,
            name: visitor.name,
            company: visitor.info || '',
            location_id: visitor.location_id,
            mcu_status: visitor.mcu_status
        })
        setIsEditModalOpen(true)
    }

    const handleUpdateVisitor = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            await axios.put(`/visitors/${editFormData.id}`, editFormData, { headers: { token } })

            addToast(createToast('Visitor details updated successfully'))
            setIsEditModalOpen(false)
            fetchData()
        } catch (err) {
            console.error(err)
            addToast(createToast('Failed to update visitor', 'danger'))
        }
    }

    // Scan Logic
    const handleScan = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const scannedUid = e.target.value.trim()
            if (!scannedUid) return

            const foundCard = availableCards.find(card =>
                card.uid && card.uid.toLowerCase() === scannedUid.toLowerCase()
            )

            if (foundCard) {
                setFormData(prev => ({ ...prev, personnel_id: foundCard.id }))
                addToast(createToast('Card Scanned Successfully'))

                e.target.value = ''
                nameInputRef.current?.focus()
            } else {
                addToast(createToast(`UID ${scannedUid} is not available in Spare Pool`, 'warning'))
                e.target.value = ''
            }
        }
    }

    return (
        <CRow>
            {/* LEFT COLUMN: Check-In Form */}
            <CCol xs={12} md={4} className="mb-4">
                <CCard>
                    <CCardHeader>
                        <strong>Visitor Check-In</strong>
                    </CCardHeader>
                    <CCardBody>
                        {availableCards.length > 0 ? (
                            <CForm onSubmit={handleCheckIn}>
                                {/* Scan Input */}
                                <div className="mb-3">
                                    <CFormLabel className="small text-uppercase fw-bold text-muted">Scan / Tap Card (Optional)</CFormLabel>
                                    <CInputGroup>
                                        <CInputGroupText>
                                            <CIcon icon={cilCreditCard} />
                                        </CInputGroupText>
                                        <CFormInput
                                            type="text"
                                            ref={scanInputRef}
                                            onKeyDown={handleScan}
                                            placeholder="Tap Card Here..."
                                            autoComplete="off"
                                            autoFocus
                                        />
                                    </CInputGroup>
                                    <div className="form-text">Cursor must be here to scan.</div>
                                </div>

                                {/* Spare Card Select */}
                                <div className="mb-3">
                                    <CFormLabel className="small text-uppercase fw-bold text-muted">Select Spare Card (UID)</CFormLabel>
                                    <CFormSelect
                                        value={formData.personnel_id}
                                        onChange={e => setFormData({ ...formData, personnel_id: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Choose a card...</option>
                                        {availableCards.map(card => (
                                            <option key={card.id} value={card.id}>
                                                {card.uid} - {card.name}
                                            </option>
                                        ))}
                                    </CFormSelect>
                                </div>

                                {/* Visitor Name */}
                                <div className="mb-3">
                                    <CFormLabel className="small text-uppercase fw-bold text-muted">Visitor Name</CFormLabel>
                                    <CInputGroup>
                                        <CInputGroupText>
                                            <CIcon icon={cilUserFollow} />
                                        </CInputGroupText>
                                        <CFormInput
                                            type="text"
                                            ref={nameInputRef}
                                            placeholder="Enter Full Name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </CInputGroup>
                                </div>

                                {/* Company */}
                                <div className="mb-3">
                                    <CFormLabel className="small text-uppercase fw-bold text-muted">Company / Agency</CFormLabel>
                                    <CInputGroup>
                                        <CInputGroupText>
                                            <CIcon icon={cilBuilding} />
                                        </CInputGroupText>
                                        <CFormInput
                                            type="text"
                                            placeholder="e.g. Vendor PT ABC"
                                            value={formData.company}
                                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </CInputGroup>
                                </div>

                                {/* Location */}
                                <div className="mb-3">
                                    <CFormLabel className="small text-uppercase fw-bold text-muted">Assigned Site</CFormLabel>
                                    <CInputGroup>
                                        <CInputGroupText>
                                            <CIcon icon={cilLocationPin} />
                                        </CInputGroupText>
                                        <CFormSelect
                                            value={formData.location_id}
                                            onChange={e => setFormData({ ...formData, location_id: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Select Site...</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                            ))}
                                        </CFormSelect>
                                    </CInputGroup>
                                </div>

                                {/* MCU Status */}
                                <div className="mb-3">
                                    <CFormLabel className="small text-uppercase fw-bold text-muted">Medical Status</CFormLabel>
                                    <CInputGroup>
                                        <CInputGroupText>
                                            <CIcon icon={cilMedicalCross} />
                                        </CInputGroupText>
                                        <CFormSelect
                                            value={formData.mcu_status}
                                            onChange={e => setFormData({ ...formData, mcu_status: e.target.value })}
                                        >
                                            <option value="Fit">Fit</option>
                                            <option value="Unfit">Unfit</option>
                                            <option value="Temporary Fit">Temporary Fit</option>
                                        </CFormSelect>
                                    </CInputGroup>
                                </div>

                                <div className="d-grid mt-4">
                                    <CButton type="submit" color="primary" className="py-2">
                                        <CIcon icon={cilCheckCircle} className="me-2" />
                                        Assign Check-In
                                    </CButton>
                                </div>
                            </CForm>
                        ) : (
                            <div className="text-center p-4 bg-light rounded border">
                                <div className="text-warning mb-2">
                                    <CIcon icon={cilBan} size="xl" />
                                </div>
                                <h5 className="text-muted">No Spare Cards</h5>
                                <p className="small text-muted mb-0">Please check-out visitors or add more TBN cards to the pool.</p>
                            </div>
                        )}
                    </CCardBody>
                </CCard>
            </CCol>

            {/* RIGHT COLUMN: Active Visitors List */}
            <CCol xs={12} md={8}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Active Visitors</strong>
                                <CBadge color="success" shape="rounded-pill" className="ms-2">
                                    {activeVisitors.length} On Site
                                </CBadge>
                            </div>
                        </div>
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
                            </div>

                            <CInputGroup style={{ maxWidth: '300px' }}>
                                <CInputGroupText>
                                    <CIcon icon={cilSearch} />
                                </CInputGroupText>
                                <CFormInput
                                    placeholder="Search visitors..."
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
                                    <CTableHeaderCell>UID Card</CTableHeaderCell>
                                    <CTableHeaderCell>Visitor Name</CTableHeaderCell>
                                    <CTableHeaderCell>Company</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">Site</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">MCU Status</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="6" className="text-center p-5">
                                            <CSpinner color="primary" />
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : activeVisitors.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="6" className="text-center p-5 text-medium-emphasis">
                                            No active visitors found.
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    activeVisitors.map((visitor) => (
                                        <CTableRow key={visitor.id}>
                                            <CTableDataCell className="font-monospace text-center">{visitor.uid}</CTableDataCell>
                                            <CTableDataCell className="fw-bold">{visitor.name}</CTableDataCell>
                                            <CTableDataCell>{visitor.info || '-'}</CTableDataCell>
                                            <CTableDataCell className="text-center">{visitor.location_name || '-'}</CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CBadge
                                                    color={
                                                        visitor.mcu_status === 'Fit' ? 'success' :
                                                            visitor.mcu_status === 'Unfit' ? 'danger' : 'warning'
                                                    }
                                                    shape="rounded-pill"
                                                >
                                                    {visitor.mcu_status}
                                                </CBadge>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CTooltip content="Edit Visitor">
                                                    <CButton color="warning" variant="ghost" size="sm" onClick={() => handleEditClick(visitor)}>
                                                        <CIcon icon={cilPencil} />
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Check-Out">
                                                    <CButton color="danger" variant="ghost" size="sm" onClick={() => handleCheckOut(visitor.id, visitor.name)}>
                                                        <CIcon icon={cilExitToApp} />
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Delete">
                                                    <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDelete(visitor.id, visitor.name)}>
                                                        <CIcon icon={cilTrash} />
                                                    </CButton>
                                                </CTooltip>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))
                                )}
                            </CTableBody>
                        </CTable>
                    </CCardBody>
                </CCard>
            </CCol>

            {/* Edit Modal */}
            <CModal visible={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} alignment="center">
                <CModalHeader onClose={() => setIsEditModalOpen(false)}>
                    <CModalTitle>Edit Visitor</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleUpdateVisitor}>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>Visitor Name</CFormLabel>
                            <CFormInput
                                value={editFormData.name}
                                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Company</CFormLabel>
                            <CFormInput
                                value={editFormData.company}
                                onChange={e => setEditFormData({ ...editFormData, company: e.target.value })}
                            />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Assigned Site</CFormLabel>
                            <CFormSelect
                                value={editFormData.location_id}
                                onChange={e => setEditFormData({ ...editFormData, location_id: e.target.value })}
                                required
                            >
                                <option value="" disabled>Select Site...</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </CFormSelect>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Medical Status</CFormLabel>
                            <CFormSelect
                                value={editFormData.mcu_status}
                                onChange={e => setEditFormData({ ...editFormData, mcu_status: e.target.value })}
                            >
                                <option value="Fit">Fit</option>
                                <option value="Unfit">Unfit</option>
                                <option value="Temporary Fit">Temporary Fit</option>
                            </CFormSelect>
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</CButton>
                        <CButton color="primary" type="submit">Save Changes</CButton>
                    </CModalFooter>
                </CForm>
            </CModal>

            <CToaster ref={toaster} push={toast} placement="top-end" />
        </CRow>
    )
}

export default VisitorManagement
