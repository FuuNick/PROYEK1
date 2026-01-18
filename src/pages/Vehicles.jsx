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
    cilTruck,
    cilQrCode,
    cilChevronLeft,
    cilChevronRight
} from '@coreui/icons'
import { QRCodeCanvas } from 'qrcode.react'
import Swal from 'sweetalert2'

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([])
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showQRModal, setShowQRModal] = useState(false)
    const [qrVehicle, setQrVehicle] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        type: 'LV',
        rfid_tag: '',
        status: true,
        location_id: ''
    })
    const [editId, setEditId] = useState(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [toast, addToast] = useState(0)
    const toaster = React.useRef()

    const vehicleTypes = ['LV', 'HV', 'BUS', 'OTHER']

    useEffect(() => {
        fetchVehicles()
        fetchLocations()
    }, [search, page])

    const createToast = (message, color = 'success') => (
        <CToast autohide={true} delay={3000} color={color} className="text-white align-items-center">
            <div className="d-flex">
                <CToastBody>{message}</CToastBody>
                <CToastClose className="me-2 m-auto" white />
            </div>
        </CToast>
    )

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get('/locations?limit=1000', { headers: { token } })
            setLocations(res.data.data)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchVehicles = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await axios.get(`/vehicles?search=${search}&page=${page}&limit=${limit}`, { headers: { token } })
            setVehicles(res.data.data)
            setTotalCount(res.data.total)
            setTotalPages(Math.ceil(res.data.total / res.data.limit))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id, name) => {
        Swal.fire({
            title: 'Are you sure?',
            html: `Delete vehicle <b>${name}</b>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.delete(`/vehicles/${id}`, { headers: { token } })
                    addToast(createToast('Vehicle has been deleted successfully'))
                    fetchVehicles()
                } catch (err) {
                    addToast(createToast('Failed to delete vehicle', 'danger'))
                }
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            if (editId) {
                await axios.put(`/vehicles/${editId}`, formData, { headers: { token } })
            } else {
                await axios.post('/vehicles', formData, { headers: { token } })
            }
            setShowModal(false)
            setEditId(null)
            setFormData({ name: '', type: 'LV', rfid_tag: '', status: true, location_id: '' })
            addToast(createToast(`Vehicle ${editId ? 'updated' : 'created'} successfully`))
            fetchVehicles()
        } catch (err) {
            addToast(createToast(err.response?.data || 'An error occurred while saving', 'danger'))
        }
    }

    const handleStatusToggle = async (id, currentStatus, vehicle) => {
        try {
            const token = localStorage.getItem('token')
            const newStatus = !currentStatus

            // Optimistic update
            setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v))

            await axios.put(`/vehicles/${id}`, { ...vehicle, status: newStatus }, { headers: { token } })

            addToast(createToast(`Vehicle ${newStatus ? 'activated' : 'deactivated'}`))
        } catch (err) {
            setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: currentStatus } : v))
            addToast(createToast('Failed to update status', 'danger'))
        }
    }

    const openEdit = (v) => {
        setEditId(v.id)
        setFormData({
            name: v.name,
            type: v.type,
            rfid_tag: v.rfid_tag,
            status: v.status,
            location_id: v.location_id || ''
        })
        setShowModal(true)
    }

    const openQR = (v) => {
        setQrVehicle(v)
        setShowQRModal(true)
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <div className="d-flex align-items-center">
                            <CIcon icon={cilTruck} className="me-2 text-primary" size="lg" />
                            <strong>Vehicles Management</strong>
                        </div>
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
                                    setFormData({ name: '', type: 'LV', rfid_tag: '', status: true, location_id: '' })
                                    setShowModal(true)
                                }}>
                                    <CIcon icon={cilPlus} className="me-2" /> Add Vehicle
                                </CButton>
                            </div>

                            <CInputGroup style={{ maxWidth: '300px' }}>
                                <CInputGroupText>
                                    <CIcon icon={cilSearch} />
                                </CInputGroupText>
                                <CFormInput
                                    placeholder="Search vehicles..."
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
                                    <CTableHeaderCell>Vehicle Name / Plat No</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">Type</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">RFID Tag</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">Status</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center">Location</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center" style={{ width: '150px' }}>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="7" className="text-center p-5">
                                            <CSpinner color="primary" />
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : vehicles.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="7" className="text-center p-5 text-medium-emphasis">
                                            No vehicles found.
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    vehicles.map((v, index) => {
                                        const isActive = [true, 1, 'true', '1'].includes(v.status)
                                        return (
                                            <CTableRow key={v.id}>
                                                <CTableDataCell className="text-center">
                                                    {(page - 1) * limit + index + 1}
                                                </CTableDataCell>
                                                <CTableDataCell className="fw-bold">{v.name}</CTableDataCell>
                                                <CTableDataCell className="text-center">
                                                    <CBadge color="info" shape="rounded-pill">{v.type}</CBadge>
                                                </CTableDataCell>
                                                <CTableDataCell className="text-center font-monospace small">{v.rfid_tag}</CTableDataCell>
                                                <CTableDataCell className="text-center">
                                                    <CFormSwitch
                                                        id={`status-${v.id}`}
                                                        checked={isActive}
                                                        onChange={() => handleStatusToggle(v.id, v.status, v)}
                                                        label={isActive ? 'Active' : 'Inactive'}
                                                    />
                                                </CTableDataCell>
                                                <CTableDataCell className="text-center">{v.location_name || '-'}</CTableDataCell>
                                                <CTableDataCell className="text-center">
                                                    <CTooltip content="View QR">
                                                        <CButton color="light" variant="ghost" size="sm" onClick={() => openQR(v)}>
                                                            <CIcon icon={cilQrCode} />
                                                        </CButton>
                                                    </CTooltip>
                                                    <CTooltip content="Edit">
                                                        <CButton color="warning" variant="ghost" size="sm" onClick={() => openEdit(v)}>
                                                            <CIcon icon={cilPencil} />
                                                        </CButton>
                                                    </CTooltip>
                                                    <CTooltip content="Delete">
                                                        <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDelete(v.id, v.name)}>
                                                            <CIcon icon={cilTrash} />
                                                        </CButton>
                                                    </CTooltip>
                                                </CTableDataCell>
                                            </CTableRow>
                                        )
                                    })
                                )}
                            </CTableBody>
                        </CTable>

                        <CPagination align="end" aria-label="Page navigation">
                            <CPaginationItem disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <CIcon icon={cilChevronLeft} />
                            </CPaginationItem>
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
            <CModal visible={showModal} onClose={() => setShowModal(false)} alignment="center">
                <CModalHeader onClose={() => setShowModal(false)}>
                    <CModalTitle>{editId ? 'Edit Vehicle' : 'Add New Vehicle'}</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleSubmit}>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>Vehicle Name / Plat No</CFormLabel>
                            <CFormInput
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g KT 1234 AB"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Type</CFormLabel>
                            <CFormSelect
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </CFormSelect>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>RFID Tag</CFormLabel>
                            <CFormInput
                                value={formData.rfid_tag}
                                onChange={(e) => setFormData({ ...formData, rfid_tag: e.target.value })}
                                placeholder="e.g E200..."
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Location</CFormLabel>
                            <CFormSelect
                                value={formData.location_id}
                                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                            >
                                <option value="">Unknown / None</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </CFormSelect>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Status</CFormLabel>
                            <CFormSelect
                                value={formData.status ? 'true' : 'false'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value === 'true' })}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </CFormSelect>
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
                        <CButton color="primary" type="submit">{editId ? 'Save Changes' : 'Add Vehicle'}</CButton>
                    </CModalFooter>
                </CForm>
            </CModal>

            {/* QR MODAL */}
            <CModal visible={showQRModal} onClose={() => setShowQRModal(false)} alignment="center" className="text-center">
                <CModalHeader onClose={() => setShowQRModal(false)}>
                    <CModalTitle>Vehicle QR</CModalTitle>
                </CModalHeader>
                <CModalBody className="d-flex flex-column align-items-center">
                    {qrVehicle && (
                        <>
                            <h5>{qrVehicle.name}</h5>
                            <p className="text-muted small">{qrVehicle.rfid_tag}</p>
                            <div className="p-3 border rounded mb-3">
                                <QRCodeCanvas
                                    id="qr-canvas"
                                    value={JSON.stringify({
                                        id: qrVehicle.id,
                                        type: 'vehicle',
                                        eui: qrVehicle.rfid_tag
                                    })}
                                    size={200}
                                    level="H"
                                />
                            </div>
                            <CButton color="primary" onClick={() => {
                                const canvas = document.getElementById('qr-canvas');
                                if (canvas) {
                                    const url = canvas.toDataURL('image/png');
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `QR-${qrVehicle.name}.png`;
                                    a.click();
                                }
                            }}>
                                <CIcon icon={cilCloudDownload} className="me-2" /> Download QR
                            </CButton>
                        </>
                    )}
                </CModalBody>
            </CModal>
            <CToaster ref={toaster} push={toast} placement="top-end" />
        </CRow >
    )
}

export default Vehicles
