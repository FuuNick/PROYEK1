import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
    CCard, CCardHeader, CCardBody, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
    CFormInput, CInputGroup, CInputGroupText, CButton, CBadge, CRow, CCol, CWidgetStatsA,
    CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormLabel, CFormSelect,
    CToaster, CToast, CToastHeader, CToastBody
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPencil, cilDrop, cilPeople, cilSettings, cilCloudDownload, cilCloudUpload } from '@coreui/icons'
import Swal from 'sweetalert2'

import { CPagination, CPaginationItem } from '@coreui/react'

const Medical = () => {
    const [data, setData] = useState([])
    const [stats, setStats] = useState({ total: 0 })
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(false)
    const limit = 10

    // Modals
    const [editModal, setEditModal] = useState(false)
    const [manageModal, setManageModal] = useState(false)
    const [selectedPerson, setSelectedPerson] = useState(null)
    const [statuses, setStatuses] = useState([])

    // Status Form
    const [statusForm, setStatusForm] = useState({ name: '', color: '#000000', id: null })

    // Toasts
    const [toast, setToast] = useState(0)
    const toaster = useRef()

    const addToast = (message, color = 'success') => {
        setToast(
            <CToast autohide={true} delay={3000} color={color} className="text-white align-items-center">
                <div className="d-flex">
                    <CToastBody>{message}</CToastBody>
                </div>
            </CToast>
        )
    }

    useEffect(() => {
        fetchStatuses()
    }, [])

    useEffect(() => {
        fetchData()
    }, [page, search])

    const fetchStatuses = async () => {
        try {
            const res = await axios.get('http://localhost:5000/medical/statuses')
            setStatuses(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await axios.get('http://localhost:5000/medical', { params: { search, page, limit } })
            setData(res.data.data)
            setStats(res.data.stats)
            setTotal(res.data.total)
            setTotalPages(res.data.totalPages)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (person) => {
        setSelectedPerson(person)
        setEditModal(true)
    }

    const handleSavePersonnel = async () => {
        if (!selectedPerson) return
        try {
            await axios.put(`http://localhost:5000/medical/${selectedPerson.id}`, {
                mcu_status: selectedPerson.mcu_status,
                mcu_last_date: selectedPerson.mcu_last_date
            })
            setEditModal(false)
            fetchData() // Refresh
            addToast('Medical data updated', 'success')
        } catch (err) {
            addToast('Failed to update', 'danger')
        }
    }

    // Status Management
    const handleSaveStatus = async () => {
        if (!statusForm.name) return addToast('Name required', 'danger')
        try {
            if (statusForm.id) {
                await axios.put(`http://localhost:5000/medical/statuses/${statusForm.id}`, statusForm)
            } else {
                await axios.post('http://localhost:5000/medical/statuses', statusForm)
            }
            fetchStatuses()
            setStatusForm({ name: '', color: '#000000', id: null })
            addToast('Status saved', 'success')
        } catch (err) {
            addToast('Failed to save status', 'danger')
        }
    }

    const handleDeleteStatus = async (id) => {
        if (!await Swal.fire({ title: 'Delete?', showCancelButton: true }).then(r => r.isConfirmed)) return;
        try {
            await axios.delete(`http://localhost:5000/medical/statuses/${id}`)
            fetchStatuses()
            addToast('Status deleted', 'success')
        } catch (err) {
            addToast('Failed to delete', 'danger')
        }
    }

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await axios.post('http://localhost:5000/medical/import', formData);
                fetchData();
                addToast(res.data.message, 'success');
            } catch (err) {
                addToast('Import failed', 'danger');
            }
        };
        input.click();
    };

    const handleExport = async () => {
        // Logic similar to Attendance, but for Medical
        try {
            // Fetch ALL data 
            const res = await axios.get('http://localhost:5000/medical', { params: { limit: 10000, search } })
            const dataToExport = res.data.data

            const headers = ['UID', 'Name', 'Email', 'MCU Status', 'Last MCU Date']
            const csvContent = [
                headers.join(','),
                ...dataToExport.map(row => `"${row.uid}","${row.name}","${row.email}","${row.mcu_status || ''}","${row.mcu_last_date ? row.mcu_last_date.split('T')[0] : ''}"`)
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `medical_export.csv`
            a.click()

        } catch (err) {
            addToast('Failed to export', 'danger')
        }
    }

    // Helper to get status color
    const getStatusColor = (statusName) => {
        const s = statuses.find(x => x.name === statusName);
        return s ? s.color : 'secondary';
    }

    return (
        <>
            <CToaster ref={toaster} push={toast} placement="top-end" />
            <CRow>
                {/* Dynamic Stats Cards */}
                <CCol xs={12} sm={6} lg={3}>
                    <CWidgetStatsA
                        className="mb-4"
                        color="primary"
                        value={stats.total}
                        title="Total Personnel"
                        icon={<CIcon icon={cilPeople} height={52} className="my-4 text-white" />}
                    />
                </CCol>
                {Object.entries(stats).map(([key, val]) => {
                    if (key === 'total') return null;
                    return (
                        <CCol xs={12} sm={6} lg={3} key={key}>
                            <CWidgetStatsA
                                className="mb-4"
                                color={getStatusColor(key) === 'secondary' ? 'info' : getStatusColor(key).replace('#', '')} // Simple fallback logic, ideally use proper colors
                                style={{ backgroundColor: getStatusColor(key) !== 'secondary' ? getStatusColor(key) : undefined, color: '#fff' }}
                                value={val}
                                title={key}
                                icon={<CIcon icon={cilDrop} height={52} className="my-4 text-white" />}
                            />
                        </CCol>
                    )
                })}
            </CRow>

            <CCard className="mb-4">
                <CCardHeader className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <strong className="fs-5">Medical (MCU)</strong>
                        <div className="d-flex gap-2">
                            <CButton color="info" className="text-white" onClick={() => setManageModal(true)}>
                                <CIcon icon={cilSettings} className="me-2" /> Classifications
                            </CButton>
                            <CButton color="success" className="text-white" onClick={handleImport}>
                                <CIcon icon={cilCloudUpload} className="me-2" /> Import
                            </CButton>
                            <CButton color="secondary" className="text-white" onClick={handleExport}>
                                <CIcon icon={cilCloudDownload} className="me-2" /> Export
                            </CButton>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div className="d-flex justify-content-end mb-4">
                        <CInputGroup style={{ maxWidth: '300px' }}>
                            <CFormInput
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                        </CInputGroup>
                    </div>

                    <CTable hover responsive align="middle">
                        <CTableHead>
                            <CTableRow>
                                <CTableHeaderCell>Name</CTableHeaderCell>
                                <CTableHeaderCell>UID</CTableHeaderCell>
                                <CTableHeaderCell>Status</CTableHeaderCell>
                                <CTableHeaderCell>Last MCU Date</CTableHeaderCell>
                                <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {data.length > 0 ? data.map(p => (
                                <CTableRow key={p.id}>
                                    <CTableDataCell>
                                        <div>{p.name}</div>
                                        <div className="small text-medium-emphasis">{p.email}</div>
                                    </CTableDataCell>
                                    <CTableDataCell>{p.uid}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge style={{ backgroundColor: getStatusColor(p.mcu_status) }}>
                                            {p.mcu_status || 'Unknown'}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        {p.mcu_last_date ? new Date(p.mcu_last_date).toLocaleDateString() : '-'}
                                    </CTableDataCell>
                                    <CTableDataCell className="text-end">
                                        <CButton size="sm" color="warning" variant="ghost" onClick={() => handleEdit(p)}>
                                            <CIcon icon={cilPencil} />
                                        </CButton>
                                    </CTableDataCell>
                                </CTableRow>
                            )) : (
                                <CTableRow>
                                    <CTableDataCell colSpan="5" className="text-center">No data found</CTableDataCell>
                                </CTableRow>
                            )}
                        </CTableBody>
                    </CTable>
                    {/* Pagination */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="small text-medium-emphasis">
                            Showing {data.length} of {total} entries
                        </div>
                        <CPagination align="end">
                            <CPaginationItem disabled={page === 1} onClick={() => setPage(page - 1)}>&laquo;</CPaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <CPaginationItem key={i + 1} active={i + 1 === page} onClick={() => setPage(i + 1)}>{i + 1}</CPaginationItem>
                            ))}
                            <CPaginationItem disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>&raquo;</CPaginationItem>
                        </CPagination>
                    </div>
                </CCardBody>
            </CCard>

            {/* Edit Modal */}
            <CModal visible={editModal} onClose={() => setEditModal(false)}>
                <CModalHeader>Update Medical Data</CModalHeader>
                <CModalBody>
                    {selectedPerson && (
                        <>
                            <h5>{selectedPerson.name}</h5>
                            <div className="mb-3">
                                <CFormLabel>MCU Status</CFormLabel>
                                <CFormSelect
                                    value={selectedPerson.mcu_status || ''}
                                    onChange={(e) => setSelectedPerson({ ...selectedPerson, mcu_status: e.target.value })}
                                >
                                    <option value="">Select Status</option>
                                    {statuses.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </CFormSelect>
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Last MCU Date</CFormLabel>
                                <CFormInput
                                    type="date"
                                    value={selectedPerson.mcu_last_date ? selectedPerson.mcu_last_date.split('T')[0] : ''}
                                    onChange={(e) => setSelectedPerson({ ...selectedPerson, mcu_last_date: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setEditModal(false)}>Cancel</CButton>
                    <CButton color="primary" onClick={handleSavePersonnel}>Save Changes</CButton>
                </CModalFooter>
            </CModal>

            {/* Manage Classifications Modal */}
            <CModal visible={manageModal} onClose={() => setManageModal(false)} size="lg">
                <CModalHeader>Manage MCU Classifications</CModalHeader>
                <CModalBody>
                    <div className="row mb-4">
                        <div className="col-5">
                            <CFormInput placeholder="Status Name" value={statusForm.name} onChange={e => setStatusForm({ ...statusForm, name: e.target.value })} />
                        </div>
                        <div className="col-3">
                            <CFormInput type="color" value={statusForm.color} onChange={e => setStatusForm({ ...statusForm, color: e.target.value })} title="Color" />
                        </div>
                        <div className="col-4">
                            <CButton color="primary" onClick={handleSaveStatus}>
                                {statusForm.id ? 'Update' : 'Add'} Status
                            </CButton>
                            {statusForm.id && <CButton color="secondary" className="ms-2" onClick={() => setStatusForm({ name: '', color: '#000000', id: null })}>Cancel</CButton>}
                        </div>
                    </div>

                    <CTable hover>
                        <CTableHead><CTableRow><CTableHeaderCell>Name</CTableHeaderCell><CTableHeaderCell>Color</CTableHeaderCell><CTableHeaderCell>Action</CTableHeaderCell></CTableRow></CTableHead>
                        <CTableBody>
                            {statuses.map(s => (
                                <CTableRow key={s.id}>
                                    <CTableDataCell>{s.name}</CTableDataCell>
                                    <CTableDataCell>
                                        <div style={{ width: '20px', height: '20px', backgroundColor: s.color, border: '1px solid #ccc' }}></div>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CButton size="sm" color="info" variant="ghost" onClick={() => setStatusForm(s)}><CIcon icon={cilPencil} /></CButton>
                                        <CButton size="sm" color="danger" variant="ghost" onClick={() => handleDeleteStatus(s.id)}>X</CButton>
                                    </CTableDataCell>
                                </CTableRow>
                            ))}
                        </CTableBody>
                    </CTable>
                </CModalBody>
            </CModal>
        </>
    )
}

export default Medical
