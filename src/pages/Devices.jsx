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
    CDropdown,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem,
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
    cilChevronRight,
    cilChevronBottom,
    cilOptions,
    cilDevices,
    cilSettings,
    cilQrCode // Importing QR icon
} from '@coreui/icons'
import Swal from 'sweetalert2'
import { QRCodeCanvas } from 'qrcode.react'

const Devices = () => {
    const [locations, setLocations] = useState([])
    const [allDevices, setAllDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showLocationModal, setShowLocationModal] = useState(false)

    // Device Form Data
    const [formData, setFormData] = useState({
        eui: '',
        type: 'IN',
        location_id: '',
        status: 1
    })
    const [editId, setEditId] = useState(null)

    // Location Form Data
    const [locationFormData, setLocationFormData] = useState({
        name: '',
        type: 'SITE',
        parent_id: '',
        capacity: ''
    })
    const [editLocationId, setEditLocationId] = useState(null)

    const [expanded, setExpanded] = useState({})
    const [toast, addToast] = useState(0)
    const toaster = React.useRef()

    // QR Modal State
    const [showQrModal, setShowQrModal] = useState(false)
    const [qrDevice, setQrDevice] = useState(null)

    const deviceTypes = ['IN', 'OUT']
    const deviceStatuses = [
        { value: 1, label: 'Active' },
        { value: 0, label: 'Inactive' }
    ]
    const locationTypes = ['SITE', 'MAIN GATE', 'GATE', 'OFFICE', 'FIELD', 'ROOM', 'OTHER']

    useEffect(() => {
        fetchData()
    }, [search])

    const fetchData = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            // Fetch All Locations and Devices
            const [locRes, devRes] = await Promise.all([
                axios.get('/locations?limit=1000', { headers: { token } }),
                axios.get(`/devices?limit=1000&search=${search}`, { headers: { token } })
            ])

            setLocations(locRes.data.data)
            setAllDevices(devRes.data.data)

            // Auto-expand if searching devices
            if (search) {
                const allExpanded = {}
                locRes.data.data.forEach(l => {
                    allExpanded[l.id] = true
                })
                setExpanded(allExpanded)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
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

    // Helper to organize locations into tree
    const getLocationTree = () => {
        const roots = locations.filter(l => !l.parent_id)
        const children = locations.filter(l => l.parent_id)
        roots.sort((a, b) => a.name.localeCompare(b.name))

        const buildNode = (node) => {
            const nodeChildren = children.filter(c => c.parent_id == node.id)
            nodeChildren.sort((a, b) => a.name.localeCompare(b.name))

            // Attach devices
            const nodeDevices = allDevices.filter(d => d.location_id == node.id)

            return { ...node, children: nodeChildren.map(buildNode), devices: nodeDevices }
        }
        return roots.map(buildNode)
    }

    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    // --- QR HANDLERS ---
    const handleOpenQr = (dev) => {
        setQrDevice(dev)
        setShowQrModal(true)
    }

    const downloadQRCode = () => {
        const canvas = document.getElementById('qr-gen')
        if (canvas) {
            const pngUrl = canvas
                .toDataURL('image/png')
                .replace('image/png', 'image/octet-stream')
            let downloadLink = document.createElement('a')
            downloadLink.href = pngUrl
            downloadLink.download = `QR_${qrDevice.eui}.png`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
        }
    }

    // --- DEVICE HANDLERS ---
    const handleDelete = async (id, eui) => {
        Swal.fire({
            title: 'Are you sure?',
            html: `Delete device <b>${eui}</b>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.delete(`/devices/${id}`, { headers: { token } })
                    addToast(createToast('Device has been deleted successfully'))
                    fetchData()
                } catch (err) {
                    addToast(createToast('Failed to delete device', 'danger'))
                }
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            if (editId) {
                await axios.put(`/devices/${editId}`, formData, { headers: { token } })
                addToast(createToast('Device updated successfully'))
            } else {
                await axios.post('/devices', formData, { headers: { token } })
                addToast(createToast('Device created successfully'))
            }
            setShowModal(false)
            setEditId(null)
            setFormData({ eui: '', type: 'IN', location_id: '', status: 1 })
            fetchData()
        } catch (err) {
            addToast(createToast(err.response?.data || 'Failed to save', 'danger'))
        }
    }

    const openEdit = (dev) => {
        setEditId(dev.id)
        setFormData({
            eui: dev.eui,
            type: dev.type,
            location_id: dev.location_id,
            status: dev.status
        })
        setShowModal(true)
    }

    // --- LOCATION HANDLERS ---
    const handleLocationSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            const payload = {
                ...locationFormData,
                parent_id: locationFormData.parent_id || null,
                capacity: locationFormData.capacity || null
            }

            if (editLocationId) {
                await axios.put(`/locations/${editLocationId}`, payload, { headers: { token } })
            } else {
                await axios.post('/locations', payload, { headers: { token } })
            }
            setShowLocationModal(false)
            setEditLocationId(null)
            setLocationFormData({ name: '', type: 'SITE', parent_id: '', capacity: '' })
            addToast(createToast('Location saved successfully'))
            fetchData()
        } catch (err) {
            addToast(createToast(err.response?.data?.message || 'Failed to save location', 'danger'))
        }
    }

    const handleDeleteLocation = async (id, name) => {
        Swal.fire({
            title: 'Delete Location?',
            html: `Delete <b>${name}</b>?<br/>This might delete all child gates and devices!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token')
                    await axios.delete(`/locations/${id}`, { headers: { token } })
                    addToast(createToast('Location deleted successfully'))
                    fetchData()
                } catch (err) {
                    addToast(createToast('Failed to delete location', 'danger'))
                }
            }
        })
    }

    const openEditLocation = (loc) => {
        setEditLocationId(loc.id)
        setLocationFormData({
            name: loc.name,
            type: loc.type,
            parent_id: loc.parent_id || '',
            capacity: loc.capacity || ''
        })
        setShowLocationModal(true)
    }

    const renderTreeRows = (nodes) => {
        return nodes.map((root, index) => {
            const output = []

            const renderRow = (node, level = 0) => {
                const hasChildren = node.children && node.children.length > 0
                const hasDevices = node.devices && node.devices.length > 0
                const isExpanded = expanded[node.id]

                // Calculate Recursive Gate Count
                const countGates = (n) => {
                    let count = 0;
                    if (n.children) {
                        n.children.forEach(child => {
                            // Count if it's a gate type (or child has children which are gates)
                            // Assuming 'GATE', 'MAIN GATE' or any non-SITE are relevant, 
                            // but user specifically mentioned "3 gate". POS 1 is GATE, POS 2 is GATE.
                            // Let's count all descendants that are NOT type 'SITE' or specifically 'GATE'/'MAIN GATE'
                            if (child.type === 'GATE' || child.type === 'MAIN GATE') {
                                count++;
                            }
                            count += countGates(child);
                        });
                    }
                    return count;
                };

                const gateCount = countGates(node);
                const deviceCount = node.devices ? node.devices.length : 0

                output.push(
                    <CTableRow key={node.id}>
                        <CTableDataCell className="text-center text-medium-emphasis">
                            {level === 0 ? index + 1 : ''}
                        </CTableDataCell>
                        <CTableDataCell>
                            <div className="d-flex align-items-center" style={{ paddingLeft: `${level * 30}px` }}>
                                {(hasChildren || hasDevices) ? (
                                    <CButton
                                        color="light"
                                        size="sm"
                                        variant="ghost"
                                        className="p-0 me-2"
                                        onClick={() => toggleExpand(node.id)}
                                    >
                                        <CIcon icon={isExpanded ? cilChevronBottom : cilChevronRight} />
                                    </CButton>
                                ) : (
                                    <div className="me-2" style={{ width: '24px' }}>
                                        {level > 0 && <span className="text-muted ms-2">↳</span>}
                                    </div>
                                )}
                                <span
                                    className={level === 0 ? 'fw-bold cursor-pointer' : 'cursor-pointer'}
                                    onClick={() => toggleExpand(node.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {node.name}
                                    {(node.type === 'GATE' || node.type === 'MAIN GATE') && (
                                        <small className="text-muted fw-normal ms-2" style={{ fontSize: '0.85em' }}>
                                            [ID: {node.id}]
                                        </small>
                                    )}
                                </span>

                                {node.type === 'SITE' && gateCount > 0 && (
                                    <CBadge color="secondary" shape="rounded-pill" className="ms-2 text-white bg-secondary">
                                        {gateCount} Gates
                                    </CBadge>
                                )}
                                {deviceCount > 0 && (
                                    <CBadge color="primary" shape="rounded-pill" className="ms-2">
                                        {deviceCount} Devices
                                    </CBadge>
                                )}
                            </div>
                        </CTableDataCell>
                        <CTableDataCell>
                            <CBadge color={node.type === 'SITE' ? 'primary' : 'success'}>{node.type}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                            <CDropdown variant="btn-group">
                                <CDropdownToggle color="transparent" size="sm" className="p-0 text-medium-emphasis" caret={false}>
                                    <CIcon icon={cilOptions} size="lg" />
                                </CDropdownToggle>
                                <CDropdownMenu>
                                    <CDropdownItem onClick={() => openEditLocation(node)} style={{ cursor: 'pointer' }}>
                                        <CIcon icon={cilPencil} className="me-2" /> Edit Location
                                    </CDropdownItem>
                                    <CDropdownItem onClick={() => handleDeleteLocation(node.id, node.name)} className="text-danger" style={{ cursor: 'pointer' }}>
                                        <CIcon icon={cilTrash} className="me-2" /> Delete Location
                                    </CDropdownItem>
                                </CDropdownMenu>
                            </CDropdown>
                        </CTableDataCell>
                    </CTableRow>
                )

                if (isExpanded) {
                    // Render Devices Inline (Nested Table for better management)
                    if (hasDevices) {
                        output.push(
                            <CTableRow key={`dev-row-${node.id}`}>
                                <CTableDataCell colSpan="4" className="p-0 border-0">
                                    <div className="p-3 bg-light bg-opacity-50" style={{ paddingLeft: `${(level + 1) * 30 + 20}px` }}>
                                        <CCard className="border-0 shadow-sm">
                                            <CCardBody className="p-0">
                                                <CTable hover className="mb-0">
                                                    <CTableHead color="light">
                                                        <CTableRow>
                                                            <CTableHeaderCell className="text-secondary small text-uppercase">EUI / Identifier</CTableHeaderCell>
                                                            <CTableHeaderCell className="text-secondary small text-uppercase text-center">Type</CTableHeaderCell>
                                                            <CTableHeaderCell className="text-secondary small text-uppercase text-center">Status</CTableHeaderCell>
                                                            <CTableHeaderCell className="text-secondary small text-uppercase text-center">Actions</CTableHeaderCell>
                                                        </CTableRow>
                                                    </CTableHead>
                                                    <CTableBody>
                                                        {node.devices.map(dev => (
                                                            <CTableRow key={dev.id}>
                                                                <CTableDataCell className="text-primary fw-semibold">{dev.eui}</CTableDataCell>
                                                                <CTableDataCell className="text-center">
                                                                    <CBadge color={dev.type === 'IN' ? 'success' : 'danger'} shape="rounded-pill">
                                                                        {dev.type}
                                                                    </CBadge>
                                                                </CTableDataCell>
                                                                <CTableDataCell className="text-center">
                                                                    <CBadge color={dev.status === 1 ? 'success' : 'secondary'} variant="outline">
                                                                        {dev.status === 1 ? 'Active' : 'Inactive'}
                                                                    </CBadge>
                                                                </CTableDataCell>
                                                                <CTableDataCell className="text-center">
                                                                    <CButton color="info" variant="ghost" size="sm" onClick={() => handleOpenQr(dev)} title="Show QR" className="me-1">
                                                                        <CIcon icon={cilQrCode} />
                                                                    </CButton>
                                                                    <CButton color="warning" variant="ghost" size="sm" onClick={() => openEdit(dev)} className="me-1">
                                                                        <CIcon icon={cilPencil} />
                                                                    </CButton>
                                                                    <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDelete(dev.id, dev.eui)}>
                                                                        <CIcon icon={cilTrash} />
                                                                    </CButton>
                                                                </CTableDataCell>
                                                            </CTableRow>
                                                        ))}
                                                    </CTableBody>
                                                </CTable>
                                            </CCardBody>
                                        </CCard>
                                    </div>
                                </CTableDataCell>
                            </CTableRow>
                        )
                    }

                    // Render Children Locations
                    if (hasChildren) {
                        node.children.forEach(child => renderRow(child, level + 1))
                    }
                }
            }

            renderRow(root)
            return output
        })
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <strong>Devices Management</strong> <small>Manage devices and locations</small>
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
                                <CButton color="info" className="text-white">
                                    <CIcon icon={cilSettings} className="me-2" /> Setup Browser
                                </CButton>
                                <CButton color="primary" onClick={() => {
                                    setEditId(null)
                                    setFormData({ eui: '', type: 'IN', location_id: '', status: 1 })
                                    setShowModal(true)
                                }}>
                                    <CIcon icon={cilPlus} className="me-2" /> Add Device
                                </CButton>
                            </div>

                            <CInputGroup style={{ maxWidth: '300px' }}>
                                <CInputGroupText>
                                    <CIcon icon={cilSearch} />
                                </CInputGroupText>
                                <CFormInput
                                    placeholder="Search devices..."
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
                                    <CTableHeaderCell>Location / Device</CTableHeaderCell>
                                    <CTableHeaderCell>Type</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center" style={{ width: '100px' }}>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="4" className="text-center p-5">
                                            <CSpinner color="primary" />
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : locations.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="4" className="text-center p-5 text-medium-emphasis">
                                            No data found.
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    renderTreeRows(getLocationTree())
                                )}
                            </CTableBody>
                        </CTable>
                    </CCardBody>
                </CCard>
            </CCol>

            {/* DEVICE MODAL */}
            <CModal visible={showModal} onClose={() => setShowModal(false)} alignment="center">
                <CModalHeader onClose={() => setShowModal(false)}>
                    <CModalTitle>{editId ? 'Edit Device' : 'Add New Device'}</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleSubmit}>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>EUI / Identifier</CFormLabel>
                            <CFormInput
                                placeholder="e.g. 1018273636"
                                value={formData.eui}
                                onChange={(e) => setFormData({ ...formData, eui: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Type</CFormLabel>
                            <CFormSelect
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                {deviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </CFormSelect>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Location</CFormLabel>
                            <CFormSelect
                                value={formData.location_id}
                                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                required
                            >
                                <option value="">Select Location</option>
                                {(() => {
                                    // Recursive Helper for Options
                                    const renderOptions = (nodes, level = 0) => {
                                        return nodes.map(node => (
                                            <React.Fragment key={node.id}>
                                                <option value={node.id}>
                                                    {'\u00A0'.repeat(level * 4)}
                                                    {level > 0 ? '↳ ' : ''}
                                                    {node.name} &nbsp; [{node.type}]
                                                </option>
                                                {node.children && node.children.length > 0 && renderOptions(node.children, level + 1)}
                                            </React.Fragment>
                                        ));
                                    };
                                    return renderOptions(getLocationTree());
                                })()}
                            </CFormSelect>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Status</CFormLabel>
                            <CFormSelect
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                            >
                                {deviceStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </CFormSelect>
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
                        <CButton color="primary" type="submit">{editId ? 'Save Changes' : 'Create Device'}</CButton>
                    </CModalFooter>
                </CForm>
            </CModal>

            {/* LOCATION MODAL */}
            <CModal visible={showLocationModal} onClose={() => setShowLocationModal(false)} alignment="center">
                <CModalHeader onClose={() => setShowLocationModal(false)}>
                    <CModalTitle>{editLocationId ? 'Edit Location' : 'Add Location'}</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleLocationSubmit}>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>Location Name</CFormLabel>
                            <CFormInput
                                onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                                value={locationFormData.name || ''}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Type</CFormLabel>
                            <CFormSelect
                                onChange={(e) => setLocationFormData({ ...locationFormData, type: e.target.value })}
                                value={locationFormData.type || 'SITE'}
                            >
                                {locationTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </CFormSelect>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Parent</CFormLabel>
                            <CFormSelect
                                onChange={(e) => setLocationFormData({ ...locationFormData, parent_id: e.target.value })}
                                value={locationFormData.parent_id || ''}
                            >
                                <option value="">None (Root)</option>
                                {(() => {
                                    // Recursive Helper for Options, excluding self
                                    const renderOptions = (nodes, level = 0) => {
                                        return nodes.map(node => {
                                            // Prevent selecting self as parent
                                            if (node.id === editLocationId) return null;

                                            return (
                                                <React.Fragment key={node.id}>
                                                    <option value={node.id}>
                                                        {'\u00A0'.repeat(level * 4)}
                                                        {level > 0 ? '↳ ' : ''}
                                                        {node.name} &nbsp; [{node.type}]
                                                    </option>
                                                    {node.children && node.children.length > 0 && renderOptions(node.children, level + 1)}
                                                </React.Fragment>
                                            );
                                        });
                                    };
                                    return renderOptions(getLocationTree());
                                })()}
                            </CFormSelect>
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setShowLocationModal(false)}>Cancel</CButton>
                        <CButton color="primary" type="submit">{editLocationId ? 'Save Location' : 'Add Location'}</CButton>
                    </CModalFooter>
                </CForm>
            </CModal>

            {/* QR CODE MODAL - NEW */}
            <CModal visible={showQrModal} onClose={() => setShowQrModal(false)} alignment="center">
                <CModalHeader onClose={() => setShowQrModal(false)}>
                    <CModalTitle>Device QR Code</CModalTitle>
                </CModalHeader>
                <CModalBody className="text-center">
                    {qrDevice && (
                        <>
                            <div className="mb-3">
                                <h5 className="mb-0">{qrDevice.type} - {qrDevice.eui}</h5>
                                <p className="text-muted small">Scan to Check-{qrDevice.type === 'IN' ? 'IN' : 'OUT'}</p>
                            </div>
                            <div className="p-3 border rounded d-inline-block bg-white shadow-sm">
                                <QRCodeCanvas
                                    id="qr-gen"
                                    value={qrDevice.eui}
                                    size={256}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>
                        </>
                    )}
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setShowQrModal(false)}>Close</CButton>
                    <CButton color="primary" onClick={downloadQRCode}>
                        <CIcon icon={cilCloudDownload} className="me-2" /> Download PNG
                    </CButton>
                </CModalFooter>
            </CModal>

            <CToaster ref={toaster} push={toast} placement="top-end" />
        </CRow >
    )
}

export default Devices
