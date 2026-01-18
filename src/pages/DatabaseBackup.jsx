import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CButton,
    CFormInput,
    CFormLabel,
    CFormSelect,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CBadge,
    CToast,
    CToastBody,
    CToastClose,
    CToaster,
    CSpinner,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CTooltip
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilCloudDownload,
    cilTrash,
    cilReload,
    cilSave,
    cilWarning,
    cilCloudUpload,
    cilDescription
} from '@coreui/icons'
import Swal from 'sweetalert2'

const DatabaseBackup = () => {
    const [schedules, setSchedules] = useState([])
    const [form, setForm] = useState({ frequency: 'daily', time: '00:00' })
    const [backups, setBackups] = useState([])
    const [loading, setLoading] = useState(false)

    // Modal State
    const [modalVisible, setModalVisible] = useState(false)
    const [modalAction, setModalAction] = useState('') // 'restore' or 'clean'
    const [selectedFile, setSelectedFile] = useState(null)
    const [password, setPassword] = useState('')

    // Toasts
    const [toast, addToast] = useState(0)
    const toaster = useRef()

    const createToast = (message, color = 'success') => (
        <CToast autohide={true} delay={5000} color={color} className="text-white align-items-center">
            <div className="d-flex">
                <CToastBody>{message}</CToastBody>
                <CToastClose className="me-2 m-auto" white />
            </div>
        </CToast>
    )

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/backup')
            setBackups(res.data.files)
            setSchedules(res.data.schedules || [])
        } catch (err) {
            addToast(createToast('Failed to load backup data', 'danger'))
        }
    }

    const handleBackupNow = async () => {
        setLoading(true)
        try {
            await axios.post('http://localhost:5000/backup/create')
            addToast(createToast('Backup created successfully'))
            fetchData()
        } catch (err) {
            addToast(createToast('Backup Failed', 'danger'))
        } finally {
            setLoading(false)
        }
    }

    const addSchedule = async () => {
        try {
            await axios.post('http://localhost:5000/backup/schedules', form)
            addToast(createToast('Schedule Added'))
            fetchData()
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to add schedule'
            addToast(createToast(msg, 'danger'))
        }
    }

    const deleteSchedule = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/backup/schedules/${id}`)
            addToast(createToast('Schedule Deleted'))
            fetchData()
        } catch (err) {
            addToast(createToast('Failed to delete schedule', 'danger'))
        }
    }

    const handleDelete = async (filename) => {
        Swal.fire({
            title: 'Delete Backup?',
            text: `Are you sure you want to delete ${filename}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, Delete'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://localhost:5000/backup/${filename}`)
                    addToast(createToast('File Deleted'))
                    fetchData()
                } catch (err) {
                    addToast(createToast('Delete Failed', 'danger'))
                }
            }
        })
    }

    const getDownloadLink = (filename) => `http://localhost:5000/backup/download/${filename}`

    // Upload Logic
    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            await axios.post('http://localhost:5000/backup/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            addToast(createToast('File Uploaded'))
            fetchData()
        } catch (err) {
            addToast(createToast('Upload Failed', 'danger'))
        }
    }

    // Modal Actions
    const openModal = (action, file = null) => {
        setModalAction(action)
        setSelectedFile(file)
        setPassword('')
        setModalVisible(true)
    }

    const handleModalSubmit = async () => {
        setModalVisible(false)
        setLoading(true)
        try {
            if (modalAction === 'restore') {
                await axios.post('http://localhost:5000/backup/restore', { filename: selectedFile, password })
                Swal.fire('Restored!', 'Database has been restored successfully.', 'success')
            } else if (modalAction === 'clean') {
                await axios.post('http://localhost:5000/backup/clean', { password })
                Swal.fire('Cleaned!', 'Database has been truncated.', 'success')
            }
        } catch (err) {
            Swal.fire('Failed', err.response?.data?.message || 'Operation Failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mb-4">
            <h2 className="mb-4">Database Backup & Restore</h2>

            <CRow>
                {/* Left Column: Schedule & Create */}
                <CCol md={4}>
                    <CCard className="mb-4">
                        <CCardHeader>
                            <strong>Create & Schedule</strong>
                        </CCardHeader>
                        <CCardBody>
                            <h6 className="text-muted mb-3">Instant Backup</h6>
                            <CButton
                                color="warning"
                                className="w-100 text-white mb-4 rounded-pill py-2"
                                onClick={handleBackupNow}
                                disabled={loading}
                            >
                                {loading ? <CSpinner size="sm" /> : <><CIcon icon={cilCloudDownload} className="me-2" /> Backup Now</>}
                            </CButton>

                            <hr />

                            <h6 className="text-muted mb-3">New Schedule</h6>
                            <div className="mb-3">
                                <CFormLabel>Frequency</CFormLabel>
                                <CFormSelect value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                                    <option value="daily">Daily</option>
                                    <option value="monthly">Monthly</option>
                                </CFormSelect>
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Run at Time</CFormLabel>
                                <CFormInput type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                            </div>
                            <CButton color="primary" className="w-100 rounded-pill mb-4" onClick={addSchedule}>
                                <CIcon icon={cilSave} className="me-2" /> Add Schedule
                            </CButton>

                            {/* Active Schedules List */}
                            <h6 className="text-muted border-bottom pb-2 mb-2">Active Schedules</h6>
                            {schedules.length > 0 ? (
                                <ul className="list-group list-group-flush">
                                    {schedules.map((sch, idx) => {
                                        // Helper to format time to 12-hour AM/PM
                                        const formatTime = (time) => {
                                            if (!time) return ''
                                            const [hour, minute] = time.split(':')
                                            const date = new Date()
                                            date.setHours(hour)
                                            date.setMinutes(minute)
                                            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                                        }

                                        return (
                                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                <div>
                                                    <strong>{sch.frequency ? sch.frequency.charAt(0).toUpperCase() + sch.frequency.slice(1) : ''}</strong>
                                                    <div className="small text-muted">at {formatTime(sch.time)}</div>
                                                </div>
                                                <CButton
                                                    color="danger"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteSchedule(sch.id)}
                                                >
                                                    <CIcon icon={cilTrash} />
                                                </CButton>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <p className="small text-muted fst-italic">No active schedules.</p>
                            )}
                        </CCardBody>
                    </CCard>

                    {/* Upload Card */}
                    <CCard className="mb-4">
                        <CCardHeader><strong>Upload Backup</strong></CCardHeader>
                        <CCardBody>
                            <CFormInput type="file" onChange={handleUpload} accept=".sql,.gz" />
                            <small className="text-muted d-block mt-2">Supports .sql and .sql.gz files.</small>
                        </CCardBody>
                    </CCard>

                    {/* Dangerous Zone */}
                    <CCard className="border-danger">
                        <CCardHeader className="bg-danger text-white"><strong>Danger Zone</strong></CCardHeader>
                        <CCardBody>
                            <p className="small text-muted">Truncate all data tables (Events, Visitors, Vehicles, Scans). This action requires a password.</p>
                            <CButton color="danger" variant="outline" className="w-100" onClick={() => openModal('clean')}>
                                <CIcon icon={cilTrash} className="me-2" /> Clean Database
                            </CButton>
                        </CCardBody>
                    </CCard>
                </CCol>

                {/* Right Column: History */}
                <CCol md={8}>
                    <CCard className="mb-4 h-100">
                        <CCardHeader className="d-flex justify-content-between align-items-center">
                            <strong>Backup History</strong>
                            <CBadge color="info" shape="rounded-pill">{backups.length} Files</CBadge>
                        </CCardHeader>
                        <CCardBody>
                            <CTable hover responsive>
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell>Filename</CTableHeaderCell>
                                        <CTableHeaderCell>Size</CTableHeaderCell>
                                        <CTableHeaderCell>Created At</CTableHeaderCell>
                                        <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {backups.length > 0 ? backups.map((file, idx) => (
                                        <CTableRow key={idx}>
                                            <CTableDataCell className="small font-monospace text-truncate" style={{ maxWidth: '200px' }} title={file.filename}>
                                                {file.filename}
                                            </CTableDataCell>
                                            <CTableDataCell>{file.size}</CTableDataCell>
                                            <CTableDataCell className="small">
                                                {new Date(file.created_at).toLocaleString()}
                                            </CTableDataCell>
                                            <CTableDataCell className="text-end">
                                                <CTooltip content="Download">
                                                    <a href={getDownloadLink(file.filename)} target="_blank" rel="noreferrer" className="btn btn-sm btn-success text-white rounded-pill me-1">
                                                        <CIcon icon={cilCloudDownload} />
                                                    </a>
                                                </CTooltip>
                                                <CTooltip content="Restore">
                                                    <CButton color="warning" size="sm" className="text-white rounded-pill me-1" onClick={() => openModal('restore', file.filename)}>
                                                        <CIcon icon={cilReload} />
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Delete">
                                                    <CButton color="danger" size="sm" className="text-white rounded-pill" onClick={() => handleDelete(file.filename)}>
                                                        <CIcon icon={cilTrash} />
                                                    </CButton>
                                                </CTooltip>
                                            </CTableDataCell>
                                        </CTableRow>
                                    )) : (
                                        <CTableRow>
                                            <CTableDataCell colSpan="4" className="text-center text-muted p-4">
                                                No backups found.
                                            </CTableDataCell>
                                        </CTableRow>
                                    )}
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Password Modal */}
            <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
                <CModalHeader onClose={() => setModalVisible(false)}>
                    <CModalTitle>Security Check</CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <div className="alert alert-warning d-flex align-items-center">
                        <CIcon icon={cilWarning} className="flex-shrink-0 me-2" size="xl" />
                        <div>
                            <strong>Warning:</strong> You are about to {modalAction === 'restore' ? 'restore the database. This will OVERWRITE current data.' : 'CLEAN the database. All data will be LOST.'}
                        </div>
                    </div>
                    <div className="mb-3">
                        <CFormLabel>Enter Database Password to Confirm</CFormLabel>
                        <CFormInput
                            type="password"
                            placeholder="DB Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setModalVisible(false)}>Cancel</CButton>
                    <CButton color="danger" onClick={handleModalSubmit} disabled={!password}>
                        Confirm {modalAction === 'restore' ? 'Restore' : 'Clean'}
                    </CButton>
                </CModalFooter>
            </CModal>

            <CToaster ref={toaster} push={toast} placement="top-end" />
        </div>
    )
}

export default DatabaseBackup
