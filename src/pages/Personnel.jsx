import React, { useState, useEffect } from 'react'
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
    CPagination,
    CPaginationItem,
    CTooltip,
    CFormSwitch,
    CToast,
    CToastBody,
    CToastClose,
    CToaster,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilPencil,
    cilTrash,
    cilPlus,
    cilSearch,
    cilX,
    cilCloudDownload,
    cilPrint,
    cilCloudUpload,
    cilUser,
    cilLockLocked,
    cilQrCode,
    cilChevronLeft,
    cilChevronRight
} from '@coreui/icons'
import { QRCodeCanvas } from 'qrcode.react'
import Swal from 'sweetalert2'

const Personnel = () => {
    const [personnel, setPersonnel] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [helpers, setHelpers] = useState({ divisions: [], positions: [], locations: [] })
    const [formData, setFormData] = useState({
        name: '', gender: '', division_id: '', position_id: '', location_id: '', phone: ''
    })
    const [editId, setEditId] = useState(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [showQrModal, setShowQrModal] = useState(false)
    const [selectedQrPersonnel, setSelectedQrPersonnel] = useState(null)
    const [toast, addToast] = useState(0)
    const toaster = React.useRef()

    useEffect(() => {
        fetchPersonnel()
        fetchHelpers()
    }, [search, page])

    const fetchPersonnel = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await axios.get(`/personnel?search=${search}&page=${page}&limit=${limit}`, { headers: { token } })
            setPersonnel(res.data.data)
            setTotalCount(res.data.total)
            setTotalPages(Math.ceil(res.data.total / res.data.limit))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchHelpers = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get('/personnel/helpers', { headers: { token } })
            setHelpers(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const createToast = (message, color = 'success') => (
        <CToast autohide={true} delay={3000} color={color} className="text-white align-items-center">
            <div className="d-flex">
                <CToastBody>{message}</CToastBody>
                <CToastClose className="me-2 m-auto" white />
            </div>
        </CToast>
    )

    const handleDelete = async (id, name) => {
        Swal.fire({
            title: 'Are you sure?',
            html: `You are about to delete <b>${name}</b>.<br>You won't be able to revert this!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.delete(`/personnel/${id}`, { headers: { token } })
                    addToast(createToast(`${name} has been deleted successfully`))
                    fetchPersonnel()
                } catch (err) {
                    addToast(createToast('Failed to delete personnel', 'danger'))
                }
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            if (editId) {
                await axios.put(`/personnel/${editId}`, formData, { headers: { token } })
                addToast(createToast('Personnel updated successfully'))
            } else {
                await axios.post('/personnel', formData, { headers: { token } })
                addToast(createToast('Personnel created successfully'))
            }
            setShowModal(false)
            setEditId(null)
            setFormData({ name: '', gender: '', division_id: '', position_id: '', location_id: '', phone: '' })
            fetchPersonnel()
        } catch (err) {
            addToast(createToast(err.response?.data || 'An error occurred while saving', 'danger'))
        }
    }

    const openEdit = (p) => {
        setEditId(p.id)
        setFormData({
            name: p.name,
            gender: p.gender,
            division_id: p.division_id,
            position_id: p.position_id,
            location_id: p.location_id,
            phone: p.phone || ''
        })
        setShowModal(true)
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <strong>Personnel Management</strong>
                    </CCardHeader>
                    <CCardBody>
                        <div className="d-flex flex-wrap justify-content-between mb-4 gap-2">
                            <div className="d-flex gap-2">
                                <CButton color="light" className="border">
                                    <CIcon icon={cilCloudDownload} className="me-2" /> Export CSV
                                </CButton>
                                <CButton color="light" className="border">
                                    <CIcon icon={cilPrint} className="me-2" /> Print
                                </CButton>
                                <CButton color="success" className="text-white">
                                    <CIcon icon={cilCloudUpload} className="me-2" /> Import
                                </CButton>
                                <CButton color="primary" onClick={() => {
                                    setEditId(null)
                                    setFormData({ name: '', gender: '', division_id: '', position_id: '', location_id: '', phone: '' })
                                    setShowModal(true)
                                }}>
                                    <CIcon icon={cilPlus} className="me-2" /> Add New
                                </CButton>
                            </div>

                            <CInputGroup style={{ maxWidth: '300px' }}>
                                <CInputGroupText>
                                    <CIcon icon={cilSearch} />
                                </CInputGroupText>
                                <CFormInput
                                    placeholder="Search personnel..."
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

                        <CTable hover responsive bordered striped className="mb-4">
                            <CTableHead color="light">
                                <CTableRow>
                                    <CTableHeaderCell className="text-center" style={{ width: '60px' }}>#</CTableHeaderCell>
                                    <CTableHeaderCell>Name</CTableHeaderCell>
                                    <CTableHeaderCell>Gender</CTableHeaderCell>
                                    <CTableHeaderCell>Homebase</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">User Account</CTableHeaderCell>
                                    <CTableHeaderCell>Division</CTableHeaderCell>
                                    <CTableHeaderCell>Position</CTableHeaderCell>
                                    <CTableHeaderCell>Phone</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center" style={{ width: '150px' }}>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="9" className="text-center p-5">
                                            <CSpinner color="primary" />
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : personnel.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="9" className="text-center p-5 text-medium-emphasis">
                                            No personnel found.
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    personnel.map((p, index) => (
                                        <CTableRow key={p.id}>
                                            <CTableDataCell className="text-center">
                                                {(page - 1) * limit + index + 1}
                                            </CTableDataCell>
                                            <CTableDataCell>
                                                <div className="fw-bold">{p.name}</div>
                                                <small className="text-medium-emphasis text-uppercase">{p.uid || 'No UID'}</small>
                                            </CTableDataCell>
                                            <CTableDataCell>{p.gender}</CTableDataCell>
                                            <CTableDataCell>{p.location_name || '-'}</CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                {p.user_id ? (
                                                    <div className="d-flex flex-column align-items-center">
                                                        <div className="d-flex align-items-center mb-1">
                                                            <CIcon icon={cilUser} size="sm" className="me-1 text-secondary" />
                                                            <span className="fw-semibold small">{p.user_name}</span>
                                                        </div>
                                                        <small className="text-muted d-block mb-1">{p.user_email}</small>
                                                        <div className="d-flex gap-1 align-items-center">
                                                            <CBadge color="info" shape="rounded-pill" className="text-white small">
                                                                {p.user_role}
                                                            </CBadge>
                                                            <CTooltip content="Reset Password">
                                                                <CButton color="warning" variant="ghost" size="sm" className="p-0 ms-1 text-warning">
                                                                    <CIcon icon={cilLockLocked} size="sm" />
                                                                </CButton>
                                                            </CTooltip>
                                                            {/* Toggle Placeholder */}
                                                            <CFormSwitch size="sm" id={`toggle-${p.id}`} defaultChecked />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <CButton color="light" size="sm" variant="ghost" className="text-secondary">
                                                        <div className="d-flex flex-column align-items-center">
                                                            <div className="position-relative">
                                                                <CIcon icon={cilUser} size="lg" />
                                                                <CIcon icon={cilPlus} size="sm" className="position-absolute bottom-0 end-0 bg-white rounded-circle text-success" />
                                                            </div>
                                                            <small>No Account</small>
                                                        </div>
                                                    </CButton>
                                                )}
                                            </CTableDataCell>
                                            <CTableDataCell>{p.division_name}</CTableDataCell>
                                            <CTableDataCell>{p.position_name}</CTableDataCell>
                                            <CTableDataCell className="font-monospace">{p.phone || '-'}</CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CTooltip content="Show QR">
                                                    <CButton color="info" variant="ghost" size="sm" onClick={() => {
                                                        setSelectedQrPersonnel(p)
                                                        setShowQrModal(true)
                                                    }}>
                                                        <CIcon icon={cilQrCode} />
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Edit">
                                                    <CButton color="warning" variant="ghost" size="sm" onClick={() => openEdit(p)}>
                                                        <CIcon icon={cilPencil} />
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Delete">
                                                    <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.name)}>
                                                        <CIcon icon={cilTrash} />
                                                    </CButton>
                                                </CTooltip>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))
                                )}
                            </CTableBody>
                        </CTable>

                        <CPagination align="end" aria-label="Page navigation">
                            <CPaginationItem disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <CIcon icon={cilChevronLeft} />
                            </CPaginationItem>
                            {/* Simple Logic for now, can be enhanced */}
                            {[...Array(totalPages)].map((_, i) => (
                                <CPaginationItem
                                    key={i + 1}
                                    active={page === i + 1}
                                    onClick={() => setPage(i + 1)}
                                >
                                    {i + 1}
                                </CPaginationItem>
                            ))}
                            <CPaginationItem disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                <CIcon icon={cilChevronRight} />
                            </CPaginationItem>
                        </CPagination>

                    </CCardBody>
                </CCard>
            </CCol>

            {/* MODAL */}
            <CModal visible={showModal} onClose={() => setShowModal(false)} alignment="center" size="lg">
                <CModalHeader onClose={() => setShowModal(false)}>
                    <CModalTitle>{editId ? 'Edit Personnel' : 'Add New Personnel'}</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleSubmit}>
                    <CModalBody>
                        <CRow className="mb-3">
                            <CCol md={6}>
                                <CFormLabel>Name</CFormLabel>
                                <CFormInput
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel>Gender</CFormLabel>
                                <CFormSelect
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="Mr.">Mr.</option>
                                    <option value="Ms.">Ms.</option>
                                </CFormSelect>
                            </CCol>
                        </CRow>
                        <CRow className="mb-3">
                            <CCol md={6}>
                                <CFormLabel>Division</CFormLabel>
                                <CFormSelect
                                    value={formData.division_id}
                                    onChange={(e) => setFormData({ ...formData, division_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select</option>
                                    {helpers.divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </CFormSelect>
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel>Position</CFormLabel>
                                <CFormSelect
                                    value={formData.position_id}
                                    onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select</option>
                                    {helpers.positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </CFormSelect>
                            </CCol>
                        </CRow>
                        <CRow className="mb-3">
                            <CCol md={6}>
                                <CFormLabel>Location</CFormLabel>
                                <CFormSelect
                                    value={formData.location_id}
                                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    {helpers.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </CFormSelect>
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel>Phone</CFormLabel>
                                <CFormInput
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </CCol>
                        </CRow>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
                        <CButton color="primary" type="submit">{editId ? 'Save Changes' : 'Create Personnel'}</CButton>
                    </CModalFooter>
                </CForm>
            </CModal>

            {/* QR MODAL */}
            <CModal visible={showQrModal} onClose={() => setShowQrModal(false)} alignment="center" className="text-center">
                <CModalHeader onClose={() => setShowQrModal(false)}>
                    <CModalTitle>Personnel QR</CModalTitle>
                </CModalHeader>
                <CModalBody className="d-flex flex-column align-items-center">
                    {selectedQrPersonnel && (
                        <>
                            <div className="p-3 border rounded mb-3">
                                <QRCodeCanvas value={selectedQrPersonnel.uid || 'NO-UID'} size={200} level="H" />
                            </div>
                            <h5>{selectedQrPersonnel.name}</h5>
                            <CBadge color="light" className="text-dark border">{selectedQrPersonnel.uid || 'NO UID'}</CBadge>
                        </>
                    )}
                </CModalBody>
            </CModal>
            <CToaster ref={toaster} push={toast} placement="top-end" />
        </CRow >
    )
}

export default Personnel
