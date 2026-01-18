import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CButton,
    CFormInput,
    CInputGroup,
    CInputGroupText,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CFormLabel,
    CFormSelect,
    CBadge,
    CToast,
    CToastBody,
    CToastClose,
    CToaster,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilPlus,
    cilPencil,
    cilTrash,
    cilReload,
    cilSearch,
    cilX,
    cilCloudDownload,
    cilPrint,
    cilCloudUpload
} from '@coreui/icons'
import { useAuth } from '../context/AuthContext'

const Users = () => {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)

    // Modal States
    const [modalVisible, setModalVisible] = useState(false)
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [resetModalVisible, setResetModalVisible] = useState(false)

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        role: 'user',
        password: ''
    })

    // Edit & Reset State
    const [selectedUser, setSelectedUser] = useState(null)
    const [resetPassword, setResetPassword] = useState({ password: '', confirm: '' })

    // Toast State
    const [toast, addToast] = useState(0)
    const toaster = React.useRef()

    // File Input Ref
    const fileInputRef = React.useRef()

    useEffect(() => {
        fetchUsers()
    }, [search])

    const createToast = (message, color = 'success') => (
        <CToast autohide={true} delay={3000} color={color} className="text-white align-items-center">
            <div className="d-flex">
                <CToastBody>{message}</CToastBody>
                <CToastClose className="me-2 m-auto" white />
            </div>
        </CToast>
    )

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`http://localhost:5000/users?search=${search}`)
            setUsers(res.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        if (users.length === 0) return addToast(createToast('No data to export', 'info'))

        const headers = ['Name', 'Username', 'Email', 'Role', 'Created At']
        const csvContent = [
            headers.join(','),
            ...users.map(u => `"${u.name}","${u.username}","${u.email}","${u.role}","${u.created_at}"`)
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800')
        printWindow.document.write('<html><head><title>Print Users</title>')
        printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid black; padding: 8px; text-align: left; } </style>')
        printWindow.document.write('</head><body>')
        printWindow.document.write('<h2>User List</h2>')
        printWindow.document.write('<table><thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th></tr></thead><tbody>')
        users.forEach(u => {
            printWindow.document.write(`<tr><td>${u.name}</td><td>${u.username}</td><td>${u.email}</td><td>${u.role}</td></tr>`)
        })
        printWindow.document.write('</tbody></table>')
        printWindow.document.write('</body></html>')
        printWindow.document.close()
        printWindow.print()
    }

    const handleImportClick = () => {
        fileInputRef.current.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await axios.post('http://localhost:5000/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            addToast(createToast(res.data.message))
            fetchUsers()
        } catch (error) {
            addToast(createToast(error.response?.data?.message || 'Import failed', 'danger'))
        }
        e.target.value = null // Reset input
    }

    const handleCreate = async () => {
        try {
            await axios.post('http://localhost:5000/users', formData)
            setModalVisible(false)
            setFormData({ name: '', username: '', email: '', role: 'user', password: '' })
            addToast(createToast('User created successfully'))
            fetchUsers()
        } catch (error) {
            addToast(createToast(error.response?.data?.message || 'Failed to create user', 'danger'))
        }
    }

    const handleEditClick = (user) => {
        setSelectedUser(user)
        setFormData({
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            password: '' // Optional in edit
        })
        setEditModalVisible(true)
    }

    const handleUpdate = async () => {
        try {
            await axios.put(`http://localhost:5000/users/${selectedUser.id}`, formData)
            setEditModalVisible(false)
            addToast(createToast('User updated successfully'))
            fetchUsers()
        } catch (error) {
            addToast(createToast(error.response?.data?.message || 'Failed to update user', 'danger'))
        }
    }

    const handleDelete = (user) => {
        if (user.id === currentUser?.id) {
            return addToast(createToast('You cannot delete yourself.', 'danger'))
        }

        Swal.fire({
            title: 'Delete User?',
            text: `Are you sure you want to delete ${user.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://localhost:5000/users/${user.id}`)
                    addToast(createToast('User has been deleted.'))
                    fetchUsers()
                } catch (error) {
                    addToast(createToast('Failed to delete user', 'danger'))
                }
            }
        })
    }

    const handleResetClick = (user) => {
        setSelectedUser(user)
        setResetPassword({ password: '', confirm: '' })
        setResetModalVisible(true)
    }

    const handleResetSubmit = async () => {
        if (resetPassword.password !== resetPassword.confirm) {
            return addToast(createToast('Passwords do not match', 'danger'))
        }
        try {
            await axios.put(`http://localhost:5000/users/${selectedUser.id}/reset-password`, { password: resetPassword.password })
            setResetModalVisible(false)
            addToast(createToast('Password reset successfully'))
        } catch (error) {
            addToast(createToast(error.response?.data?.message || 'Failed to reset password', 'danger'))
        }
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader className="d-flex justify-content-between align-items-center bg-white py-3">
                        <strong className="fs-5">User Management</strong>
                    </CCardHeader>
                    <CCardBody>
                        <div className="d-flex flex-wrap justify-content-between mb-4 gap-2">
                            <div className="d-flex gap-2">
                                <CButton color="light" className="border" onClick={handleExport}>
                                    <CIcon icon={cilCloudDownload} className="me-2" /> Export CSV
                                </CButton>
                                <CButton color="light" className="border" onClick={handlePrint}>
                                    <CIcon icon={cilPrint} className="me-2" /> Print
                                </CButton>
                                <CButton color="success" className="text-white" onClick={handleImportClick}>
                                    <CIcon icon={cilCloudUpload} className="me-2" /> Import
                                </CButton>
                                <CButton color="primary" onClick={() => setModalVisible(true)}>
                                    <CIcon icon={cilPlus} className="me-2" /> Add New
                                </CButton>
                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <CInputGroup style={{ maxWidth: '300px' }}>
                                <CFormInput
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoComplete="off"
                                />
                                <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                            </CInputGroup>
                        </div>

                        <CTable hover responsive align="middle">
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>Name</CTableHeaderCell>
                                    <CTableHeaderCell>Username</CTableHeaderCell>
                                    <CTableHeaderCell>Email</CTableHeaderCell>
                                    <CTableHeaderCell>Role</CTableHeaderCell>
                                    <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {users.length > 0 ? users.map(user => (
                                    <CTableRow key={user.id}>
                                        <CTableDataCell>{user.name}</CTableDataCell>
                                        <CTableDataCell>{user.username}</CTableDataCell>
                                        <CTableDataCell>{user.email}</CTableDataCell>
                                        <CTableDataCell>
                                            <CBadge color={user.role === 'admin' ? 'danger' : user.role === 'operator' ? 'warning' : 'info'}>
                                                {user.role.toUpperCase()}
                                            </CBadge>
                                        </CTableDataCell>
                                        <CTableDataCell className="text-end">
                                            <CButton color="warning" size="sm" variant="ghost" className="me-1" onClick={() => handleEditClick(user)} title="Edit">
                                                <CIcon icon={cilPencil} />
                                            </CButton>
                                            <CButton color="info" size="sm" variant="ghost" className="me-1" onClick={() => handleResetClick(user)} title="Reset Password">
                                                <CIcon icon={cilReload} />
                                            </CButton>
                                            <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDelete(user)} title="Delete">
                                                <CIcon icon={cilTrash} />
                                            </CButton>
                                        </CTableDataCell>
                                    </CTableRow>
                                )) : (
                                    <CTableRow>
                                        <CTableDataCell colSpan="5" className="text-center">No users found</CTableDataCell>
                                    </CTableRow>
                                )}
                            </CTableBody>
                        </CTable>
                    </CCardBody>
                </CCard>

                {/* Create Modal */}
                <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
                    <CModalHeader>
                        <CModalTitle>Create New User</CModalTitle>
                    </CModalHeader>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>Full Name</CFormLabel>
                            <CFormInput value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="row mb-3">
                            <div className="col-6">
                                <CFormLabel>Username</CFormLabel>
                                <CFormInput value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div className="col-6">
                                <CFormLabel>Role</CFormLabel>
                                <CFormSelect value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="operator">Operator</option>
                                    <option value="medic">Medic</option>
                                    <option value="admin">Admin</option>
                                </CFormSelect>
                            </div>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Email</CFormLabel>
                            <CFormInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Password</CFormLabel>
                            <CFormInput
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                autoComplete="new-password"
                            />
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setModalVisible(false)}>Close</CButton>
                        <CButton color="primary" onClick={handleCreate}>Create User</CButton>
                    </CModalFooter>
                </CModal>

                {/* Edit Modal */}
                <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
                    <CModalHeader>
                        <CModalTitle>Edit User</CModalTitle>
                    </CModalHeader>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>Full Name</CFormLabel>
                            <CFormInput value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="row mb-3">
                            <div className="col-6">
                                <CFormLabel>Username</CFormLabel>
                                <CFormInput value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div className="col-6">
                                <CFormLabel>Role</CFormLabel>
                                <CFormSelect value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="operator">Operator</option>
                                    <option value="medic">Medic</option>
                                    <option value="admin">Admin</option>
                                </CFormSelect>
                            </div>
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Email</CFormLabel>
                            <CFormInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>New Password (Optional)</CFormLabel>
                            <CFormInput
                                type="password"
                                placeholder="Leave blank to keep current"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                autoComplete="new-password"
                            />
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setEditModalVisible(false)}>Close</CButton>
                        <CButton color="primary" onClick={handleUpdate}>Update User</CButton>
                    </CModalFooter>
                </CModal>

                {/* Reset Password Modal */}
                <CModal visible={resetModalVisible} onClose={() => setResetModalVisible(false)}>
                    <CModalHeader>
                        <CModalTitle>Reset Password</CModalTitle>
                    </CModalHeader>
                    <CModalBody>
                        <p>Resetting password for: <strong>{selectedUser?.name}</strong></p>
                        <div className="mb-3">
                            <CFormLabel>New Password</CFormLabel>
                            <CFormInput
                                type="password"
                                value={resetPassword.password}
                                onChange={(e) => setResetPassword({ ...resetPassword, password: e.target.value })}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="mb-3">
                            <CFormLabel>Confirm Password</CFormLabel>
                            <CFormInput
                                type="password"
                                value={resetPassword.confirm}
                                onChange={(e) => setResetPassword({ ...resetPassword, confirm: e.target.value })}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="alert alert-info small">
                            Password must be at least 6 characters.
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setResetModalVisible(false)}>Close</CButton>
                        <CButton color="info" className="text-white" onClick={handleResetSubmit}>Reset Password</CButton>
                    </CModalFooter>
                </CModal>
                <CToaster ref={toaster} push={toast} placement="top-end" />
            </CCol>
        </CRow>
    )
}

export default Users

