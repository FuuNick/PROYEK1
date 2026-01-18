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
    CPagination,
    CPaginationItem,
    CTooltip,
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
    cilMap,
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
} from '@coreui/icons'
import Swal from 'sweetalert2'

const Locations = () => {
    const [locations, setLocations] = useState([])
    const [allLocations, setAllLocations] = useState([])
    const [devices, setDevices] = useState([]) // Store fetched devices
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', type: '', parent_id: '', capacity: '' })
    const [editId, setEditId] = useState(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const [expanded, setExpanded] = useState({})
    const [toast, addToast] = useState(0)
    const toaster = React.useRef()

    const locationTypes = ['SITE', 'MAIN GATE', 'GATE', 'OFFICE', 'FIELD', 'ROOM', 'OTHER']

    useEffect(() => {
        fetchLocations()
        fetchAllLocations()
        fetchDevices()
    }, [search, page])

    const fetchLocations = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await axios.get(`/locations?search=${search}&limit=1000`, { headers: { token } })
            setLocations(res.data.data)
            setTotalCount(res.data.total)

            if (search) {
                const allIds = {}
                res.data.data.forEach((l) => (allIds[l.id] = true))
                setExpanded(allIds)
            }
        } catch (err) {
            console.error(err)
            addToast(createToast('Failed to fetch locations', 'danger'))
        } finally {
            setLoading(false)
        }
    }

    const fetchAllLocations = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get(`/locations?limit=1000`, { headers: { token } })
            setAllLocations(res.data.data)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchDevices = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get('/devices?limit=1000', { headers: { token } })
            setDevices(res.data.data)
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
                    await axios.delete(`/locations/${id}`, { headers: { token } })
                    addToast(createToast(`${name} has been deleted successfully`))
                    fetchLocations()
                } catch (err) {
                    console.error(err)
                    addToast(createToast(err.response?.data || 'Failed to delete location', 'danger'))
                }
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            if (editId) {
                await axios.put(`/locations/${editId}`, formData, { headers: { token } })
                addToast(createToast('Location updated successfully'))
            } else {
                await axios.post('/locations', formData, { headers: { token } })
                addToast(createToast('Location created successfully'))
            }
            setShowModal(false)
            setEditId(null)
            setFormData({ name: '', type: '', parent_id: '', capacity: '' })
            fetchLocations()
            fetchAllLocations()
        } catch (err) {
            console.error(err)
            addToast(createToast(err.response?.data || 'An error occurred while saving', 'danger'))
        }
    }

    const openEdit = (l) => {
        setEditId(l.id)
        setFormData({
            name: l.name,
            type: l.type,
            parent_id: l.parent_id || '',
            capacity: l.capacity || '',
        })
        setShowModal(true)
    }

    const toggleExpand = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'SITE':
                return 'primary'
            case 'MAIN GATE':
                return 'dark'
            case 'GATE':
                return 'success'
            case 'OFFICE':
                return 'info'
            case 'FIELD':
                return 'warning'
            case 'ROOM':
                return 'secondary'
            default:
                return 'light'
        }
    }

    const getLocationTree = () => {
        const roots = locations.filter((l) => !l.parent_id)
        const children = locations.filter((l) => l.parent_id)
        roots.sort((a, b) => a.name.localeCompare(b.name))

        const buildNode = (node) => {
            const nodeChildren = children.filter((c) => c.parent_id == node.id)
            nodeChildren.sort((a, b) => a.name.localeCompare(b.name))
            return { ...node, children: nodeChildren.map(buildNode) }
        }
        return roots.map(buildNode)
    }

    const getDevicesForLocation = (locationId) => {
        return devices.filter(d => d.location_id == locationId)
    }

    const renderTreeRows = (nodes) => {
        return nodes.map((root, index) => {
            const output = []

            const renderRow = (node, level = 0) => {
                const hasChildren = node.children && node.children.length > 0
                const associatedDevices = getDevicesForLocation(node.id)
                const hasDevices = associatedDevices.length > 0
                const isExpanded = expanded[node.id]

                // Calculate Gate count (direct children with type 'GATE')
                const gateCount = node.children ? node.children.filter(c => c.type === 'GATE').length : 0

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
                                </span>

                                {(gateCount > 0 || hasDevices) && (
                                    <CDropdown variant="btn-group" className="ms-2">
                                        <CDropdownToggle color="transparent" size="sm" className="p-0 text-decoration-none shadow-none" caret={false}>
                                            {gateCount > 0 && (
                                                <CBadge color="light" className="text-dark border me-1">
                                                    {gateCount} GATES
                                                </CBadge>
                                            )}
                                            {hasDevices && (
                                                <CBadge color="light" textColor="primary" className="border border-primary bg-primary bg-opacity-10">
                                                    {associatedDevices.length} DEVICES
                                                </CBadge>
                                            )}
                                        </CDropdownToggle>
                                        <CDropdownMenu>
                                            {gateCount > 0 && (
                                                <>
                                                    <CDropdownItem header>Gates</CDropdownItem>
                                                    {node.children.filter(c => c.type === 'GATE').map(g => (
                                                        <CDropdownItem key={g.id} disabled>{g.name}</CDropdownItem>
                                                    ))}
                                                </>
                                            )}
                                            {gateCount > 0 && hasDevices && <CDropdownItem divider />}
                                            {hasDevices && (
                                                <>
                                                    <CDropdownItem header>Devices</CDropdownItem>
                                                    {associatedDevices.map(d => (
                                                        <CDropdownItem key={d.id} disabled>
                                                            <div className="d-flex flex-column">
                                                                <span className="fw-semibold">{d.type}</span>
                                                                <small className="text-muted">{d.eui}</small>
                                                            </div>
                                                        </CDropdownItem>
                                                    ))}
                                                </>
                                            )}
                                        </CDropdownMenu>
                                    </CDropdown>
                                )}
                            </div>
                        </CTableDataCell>
                        <CTableDataCell>
                            <CBadge color={getTypeBadgeColor(node.type)}>{node.type || 'N/A'}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-medium-emphasis">
                            {node.parent_name || '-'}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                            {node.capacity || '-'}
                        </CTableDataCell>

                        <CTableDataCell className="text-center">
                            <CDropdown variant="btn-group">
                                <CDropdownToggle color="transparent" size="sm" className="p-0 text-medium-emphasis caret-off">
                                    <CIcon icon={cilOptions} size="lg" />
                                </CDropdownToggle>
                                <CDropdownMenu>
                                    <CDropdownItem onClick={() => openEdit(node)} style={{ cursor: 'pointer' }}>
                                        <CIcon icon={cilPencil} className="me-2" /> Edit
                                    </CDropdownItem>
                                    <CDropdownItem onClick={() => handleDelete(node.id, node.name)} className="text-danger" style={{ cursor: 'pointer' }}>
                                        <CIcon icon={cilTrash} className="me-2" /> Delete
                                    </CDropdownItem>
                                </CDropdownMenu>
                            </CDropdown>
                        </CTableDataCell>
                    </CTableRow>
                )

                if (isExpanded && hasChildren) {
                    node.children.forEach(child => renderRow(child, level + 1))
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
                        <strong>Locations Management</strong> <small>Hierarchical view of locations</small>
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
                                    setFormData({ name: '', type: '', parent_id: '', capacity: '' })
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
                                    placeholder="Search locations..."
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
                                    <CTableHeaderCell className="text-center" scope="col" style={{ width: '60px' }}>#</CTableHeaderCell>
                                    <CTableHeaderCell scope="col">Location Name</CTableHeaderCell>
                                    <CTableHeaderCell scope="col">Type</CTableHeaderCell>
                                    <CTableHeaderCell scope="col">Parent</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center" scope="col">Capacity</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center" scope="col" style={{ width: '80px' }}>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="7" className="text-center p-5">
                                            <CSpinner color="primary" />
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : locations.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="7" className="text-center p-5 text-medium-emphasis">
                                            No locations found.
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    renderTreeRows(getLocationTree())
                                )}
                            </CTableBody>
                        </CTable>

                        <div className="d-flex justify-content-between align-items-center">
                            <div className="text-medium-emphasis small">
                                Total Records: <strong>{totalCount}</strong>
                            </div>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>

            <CModal visible={showModal} onClose={() => setShowModal(false)} alignment="center">
                <CModalHeader onClose={() => setShowModal(false)}>
                    <CModalTitle>{editId ? 'Edit Location' : 'Add New Location'}</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleSubmit}>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>Location Name</CFormLabel>
                            <CFormInput
                                placeholder="Enter location name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Location Type</CFormLabel>
                            <CFormSelect
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="">Select Type (Optional)</option>
                                {locationTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </CFormSelect>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Parent Location</CFormLabel>
                            <CFormSelect
                                value={formData.parent_id}
                                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                            >
                                <option value="">None (Top Level)</option>
                                {(() => {
                                    // Build Tree from allLocations (flat list)
                                    const buildTree = (list) => {
                                        const roots = list.filter(l => !l.parent_id);
                                        const children = list.filter(l => l.parent_id);
                                        roots.sort((a, b) => a.name.localeCompare(b.name));

                                        const buildNode = (node) => {
                                            const nodeChildren = children.filter(c => c.parent_id == node.id);
                                            nodeChildren.sort((a, b) => a.name.localeCompare(b.name));
                                            return { ...node, children: nodeChildren.map(buildNode) };
                                        };
                                        return roots.map(buildNode);
                                    };

                                    const tree = buildTree(allLocations);

                                    const renderOptions = (nodes, level = 0) => {
                                        return nodes.map(node => {
                                            if (node.id === editId) return null; // Prevent self-parenting
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

                                    return renderOptions(tree);
                                })()}
                            </CFormSelect>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Capacity</CFormLabel>
                            <CFormInput
                                type="number"
                                placeholder="Enter capacity (optional)"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            />
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
                        <CButton color="primary" type="submit">{editId ? 'Save Changes' : 'Create Location'}</CButton>
                    </CModalFooter>
                </CForm>
            </CModal>
            <CToaster ref={toaster} push={toast} placement="top-end" />
        </CRow>
    )
}

export default Locations
