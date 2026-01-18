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
    CAlert,
    CInputGroup,
    CInputGroupText
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilOptions,
    cilCloudUpload,
    cilCloudDownload,
    cilSave,
    cilTrash,
    cilCheckCircle,
    cilWarning,
    cilX,
    cilDescription
} from '@coreui/icons'
import Swal from 'sweetalert2'

const DatabaseSync = () => {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        replicationStats: [],
        subscriptionStats: [],
        publications: [],
        syncConfig: null,
        knownClients: {}
    })

    // Forms
    const [configForm, setConfigForm] = useState({ role: 'client', node_alias: '', node_id: '' })
    const [subForm, setSubForm] = useState({ partner_ip: '', db_password: '', new_client_alias: '' })
    const [generatedSql, setGeneratedSql] = useState([])

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
            const token = localStorage.getItem('token')
            const res = await axios.get('http://localhost:5000/database-sync', { headers: { token } })
            setData(res.data)
            if (res.data.syncConfig) {
                setConfigForm(res.data.syncConfig)
            }
        } catch (err) {
            console.error(err)
            addToast(createToast('Failed to fetch sync status', 'danger'))
        }
    }

    const saveConfig = async (e) => {
        e.preventDefault()
        try {
            await axios.post('http://localhost:5000/database-sync/config', configForm)
            addToast(createToast('Configuration Saved'))
            fetchData()
        } catch (err) {
            addToast(createToast('Failed to save configuration', 'danger'))
        }
    }

    const createPublication = async () => {
        try {
            setLoading(true)
            await axios.post('http://localhost:5000/database-sync/publication', {})
            addToast(createToast('Publication Created Successfully'))
            fetchData()
        } catch (err) {
            addToast(createToast(err.response?.data?.message || 'Failed', 'danger'))
        } finally {
            setLoading(false)
        }
    }

    const createSubscription = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await axios.post('http://localhost:5000/database-sync/subscription', subForm)
            addToast(createToast('Subscription Created & Sync Started'))
            setSubForm({ ...subForm, db_password: '' })
            fetchData()
        } catch (err) {
            console.error(err)
            const logs = err.response?.data?.logs || []
            const logMsg = logs.join('\n')
            Swal.fire('Connection Failed', `<pre class="text-start small">${logMsg}</pre>`, 'error')
        } finally {
            setLoading(false)
        }
    }

    const resetSync = async () => {
        Swal.fire({
            title: 'Reset Configuration?',
            text: 'This will DROP all subscriptions and publications. Data will not be deleted, but sync will stop.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, Reset'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post('http://localhost:5000/database-sync/reset', {})
                    addToast(createToast('Configuration Reset'))
                    fetchData()
                } catch (err) {
                    addToast(createToast('Failed to reset', 'danger'))
                }
            }
        })
    }

    const generateIdSql = async () => {
        try {
            const res = await axios.get('http://localhost:5000/database-sync/sql')
            setGeneratedSql(res.data.commands)
        } catch (err) {
            addToast(createToast(err.response?.data?.message || 'Error', 'danger'))
        }
    }

    const hasPublication = data.publications.some(p => p.pubname === 'pob_publication')
    const hasSubscription = data.subscriptionStats.length > 0

    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Database Synchronization</h2>
                <div className="d-flex gap-2">
                    <CButton color="info" variant="outline" onClick={generateIdSql}>
                        <CIcon icon={cilDescription} className="me-2" /> ID Generator
                    </CButton>
                    <CButton color="danger" className="text-white" onClick={resetSync}>
                        <CIcon icon={cilX} className="me-2" /> Reset Configuration
                    </CButton>
                </div>
            </div>

            {generatedSql.length > 0 && (
                <CAlert color="info" dismissible onClose={() => setGeneratedSql([])}>
                    <h5>SQL Commands to Prevent ID Collision</h5>
                    <p className="small">Run these commands on your PostgreSQL database to ensure unique IDs for this node.</p>
                    <pre className="bg-dark text-white p-3 rounded">{generatedSql.join('\n')}</pre>
                </CAlert>
            )}

            {/* Config Card */}
            <CCard className="mb-4 border-top-primary border-top-3">
                <CCardHeader>
                    <strong>Current Server Identity</strong> <small>Role and Node ID</small>
                </CCardHeader>
                <CCardBody>
                    <form onSubmit={saveConfig} className="row g-3 align-items-end">
                        <CCol md={3}>
                            <CFormLabel>Server Role</CFormLabel>
                            <CFormSelect value={configForm.role} onChange={e => setConfigForm({ ...configForm, role: e.target.value })}>
                                <option value="client">Client (Receiver)</option>
                                <option value="master">Master (Publisher)</option>
                            </CFormSelect>
                        </CCol>
                        <CCol md={3}>
                            <CFormLabel>Node Alias</CFormLabel>
                            <CFormInput
                                placeholder="e.g. POS 1"
                                value={configForm.node_alias}
                                onChange={e => setConfigForm({ ...configForm, node_alias: e.target.value })}
                            />
                        </CCol>
                        <CCol md={3}>
                            <CFormLabel>Node ID (1-10)</CFormLabel>
                            <CFormInput
                                type="number"
                                placeholder="Unique ID"
                                value={configForm.node_id}
                                onChange={e => setConfigForm({ ...configForm, node_id: e.target.value })}
                            />
                        </CCol>
                        <CCol md={3}>
                            <CButton color="primary" type="submit" className="w-100">
                                <CIcon icon={cilSave} className="me-2" /> Save Config
                            </CButton>
                        </CCol>
                    </form>
                </CCardBody>
            </CCard>

            <CRow>
                {/* Publication Status (Master) - Only show if Role is Master */}
                {configForm.role === 'master' && (
                    <CCol md={12}>
                        <CCard className="mb-4">
                            <CCardHeader className="bg-light">
                                <CIcon icon={cilCloudUpload} className="me-2" />
                                <strong>Local Publication Status</strong> (Sending Data)
                            </CCardHeader>
                            <CCardBody>
                                {hasPublication ? (
                                    <CAlert color="success" className="d-flex align-items-center">
                                        <CIcon icon={cilCheckCircle} size="xl" className="me-3" />
                                        <div>
                                            <strong>Active</strong><br />
                                            This server is publishing data ('pob_publication').
                                        </div>
                                    </CAlert>
                                ) : (
                                    <div className="text-center p-4">
                                        <p className="text-muted">No publication configured.</p>
                                        <CButton color="success" onClick={createPublication} disabled={loading}>
                                            {loading ? <CSpinner size="sm" /> : 'Enable Publication'}
                                        </CButton>
                                        <p className="small text-muted mt-2">Required if this server acts as a Master.</p>
                                    </div>
                                )}

                                {/* Connected Replicas */}
                                <h6 className="mt-4 border-bottom pb-2">Connected Replicas (Who is copying from me?)</h6>
                                <CTable small hover responsive>
                                    <CTableHead>
                                        <CTableRow>
                                            <CTableHeaderCell>Client IP</CTableHeaderCell>
                                            <CTableHeaderCell>State</CTableHeaderCell>
                                            <CTableHeaderCell>Sent LSN</CTableHeaderCell>
                                        </CTableRow>
                                    </CTableHead>
                                    <CTableBody>
                                        {data.replicationStats.length > 0 ? (
                                            data.replicationStats.map((rep, idx) => (
                                                <CTableRow key={idx}>
                                                    <CTableDataCell>{rep.client_addr}</CTableDataCell>
                                                    <CTableDataCell><CBadge color="success">{rep.state}</CBadge></CTableDataCell>
                                                    <CTableDataCell className="font-monospace small">{rep.sent_lsn}</CTableDataCell>
                                                </CTableRow>
                                            ))
                                        ) : (
                                            <CTableRow>
                                                <CTableDataCell colSpan="3" className="text-center text-muted">No active connections found.</CTableDataCell>
                                            </CTableRow>
                                        )}
                                    </CTableBody>
                                </CTable>
                            </CCardBody>
                        </CCard>

                        {/* WebSocket Server Status */}
                        <CCard className="mb-4">
                            <CCardHeader>
                                <strong>WebSocket Server (Realtime)</strong>
                            </CCardHeader>
                            <CCardBody className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <CBadge color="success" shape="rounded-pill" className="me-2 p-2">Running</CBadge>
                                    <div>
                                        <h6 className="mb-0">Socket.io Server</h6>
                                        <small className="text-muted">Integrated with Main Server (Port 5000)</small>
                                    </div>
                                </div>
                            </CCardBody>
                        </CCard>
                    </CCol>
                )}


                {/* Subscription Status (Client) - Only show if Role is Client */}
                {configForm.role === 'client' && (
                    <CCol md={12}>
                        <CCard className="mb-4 h-100">
                            <CCardHeader className="bg-light">
                                <CIcon icon={cilCloudDownload} className="me-2" />
                                <strong>Subscription Status</strong> (Receiving Data)
                            </CCardHeader>
                            <CCardBody>
                                {hasSubscription ? (
                                    <CAlert color="success" className="d-flex align-items-center">
                                        <CIcon icon={cilCheckCircle} size="xl" className="me-3" />
                                        <div>
                                            <strong>Connected</strong><br />
                                            Receiving data from Master.
                                        </div>
                                    </CAlert>
                                ) : (
                                    <CAlert color="secondary" className="d-flex align-items-center">
                                        <CIcon icon={cilWarning} size="xl" className="me-3" />
                                        <div>
                                            <strong>Not Connected</strong><br />
                                            Waiting for connection.
                                        </div>
                                    </CAlert>
                                )}

                                <div className="bg-light p-3 rounded border">
                                    <h6 className="mb-3">Add Subscription (Connect to a Master)</h6>
                                    <form onSubmit={createSubscription}>
                                        <div className="mb-3">
                                            <CFormLabel>Master IP Address</CFormLabel>
                                            <CFormInput
                                                placeholder="192.168.1.X"
                                                required
                                                value={subForm.partner_ip}
                                                onChange={e => setSubForm({ ...subForm, partner_ip: e.target.value })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <CFormLabel><small>Optional: Save Master Alias</small></CFormLabel>
                                            <CFormInput
                                                placeholder="e.g. Main Server"
                                                value={subForm.new_client_alias}
                                                onChange={e => setSubForm({ ...subForm, new_client_alias: e.target.value })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <CFormLabel><small>Optional: Master DB Name</small></CFormLabel>
                                            <CFormInput
                                                placeholder="Leave empty if same as local (pob_ms)"
                                                value={subForm.master_db_name || ''}
                                                onChange={e => setSubForm({ ...subForm, master_db_name: e.target.value })}
                                            />
                                            <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                                                Only required if Master uses a different DB name (e.g. pob_db).
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <CFormLabel>DB Password (Postgres)</CFormLabel>
                                            <CFormInput
                                                type="password"
                                                placeholder="Password for DB User 'postgres' on Master"
                                                required
                                                value={subForm.db_password}
                                                onChange={e => setSubForm({ ...subForm, db_password: e.target.value })}
                                            />
                                        </div>
                                        <div className="d-grid">
                                            <CButton color="primary" type="submit" disabled={loading}>
                                                {loading ? <CSpinner size="sm" /> : 'Start Sync'}
                                            </CButton>
                                        </div>
                                    </form>
                                </div>
                            </CCardBody>
                        </CCard>
                    </CCol>
                )}
            </CRow>

            <CToaster ref={toaster} push={toast} placement="top-end" />
        </div>
    )
}

export default DatabaseSync
