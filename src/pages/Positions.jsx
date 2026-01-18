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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
    cilBriefcase,
    cilPencil,
    cilTrash,
    cilPlus,
    cilSearch,
    cilX,
    cilCloudDownload,
    cilPrint,
    cilCloudUpload,
} from '@coreui/icons'
import Swal from 'sweetalert2'

const Positions = () => {
    const [positions, setPositions] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '' })
    const [editId, setEditId] = useState(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        fetchPositions()
    }, [search, page])

    const fetchPositions = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await axios.get(`/positions?search=${search}&page=${page}&limit=${limit}`, {
                headers: { token },
            })
            setPositions(res.data.data)
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
                    await axios.delete(`/positions/${id}`, { headers: { token } })
                    Swal.fire('Deleted!', `${name} has been deleted.`, 'success')
                    fetchPositions()
                } catch (err) {
                    console.error(err)
                    Swal.fire('Error!', err.response?.data || 'Failed to delete position.', 'error')
                }
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            if (editId) {
                await axios.put(`/positions/${editId}`, formData, { headers: { token } })
                Swal.fire('Success!', 'Position updated successfully', 'success')
            } else {
                await axios.post('/positions', formData, { headers: { token } })
                Swal.fire('Success!', 'Position created successfully', 'success')
            }
            setShowModal(false)
            setEditId(null)
            setFormData({ name: '' })
            fetchPositions()
        } catch (err) {
            console.error(err)
            Swal.fire(
                'Operation Failed',
                err.response?.data || 'An error occurred while saving.',
                'error',
            )
        }
    }

    const openEdit = (p) => {
        setEditId(p.id)
        setFormData({ name: p.name })
        setShowModal(true)
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <strong>Positions Management</strong> <small>List of all positions</small>
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
                                    setFormData({ name: '' })
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
                                    placeholder="Search positions..."
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
                                    <CTableHeaderCell scope="col">Position</CTableHeaderCell>
                                    <CTableHeaderCell className="text-center" scope="col" style={{ width: '150px' }}>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="3" className="text-center p-5">
                                            <CSpinner color="primary" />
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : positions.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan="3" className="text-center p-5 text-medium-emphasis">
                                            No positions found.
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    positions.map((p, index) => (
                                        <CTableRow key={p.id}>
                                            <CTableDataCell className="text-center">{(page - 1) * limit + index + 1}</CTableDataCell>
                                            <CTableDataCell>
                                                <span className="fw-semibold">{p.name}</span>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-center">
                                                <CTooltip content="Edit Position">
                                                    <CButton color="warning" variant="ghost" size="sm" className="me-2" onClick={() => openEdit(p)}>
                                                        <CIcon icon={cilPencil} />
                                                    </CButton>
                                                </CTooltip>
                                                <CTooltip content="Delete Position">
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

                        {/* Pagination */}
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="text-medium-emphasis small">
                                Showing <strong>{(page - 1) * limit + 1}</strong> to <strong>{Math.min(page * limit, totalCount)}</strong> of <strong>{totalCount}</strong> entries
                            </div>
                            <CPagination className="mb-0">
                                <CPaginationItem disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</CPaginationItem>
                                {[...Array(totalPages)].map((_, i) => (
                                    <CPaginationItem key={i + 1} active={i + 1 === page} onClick={() => setPage(i + 1)}>{i + 1}</CPaginationItem>
                                )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
                                <CPaginationItem disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</CPaginationItem>
                            </CPagination>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>

            {/* Modal */}
            <CModal visible={showModal} onClose={() => setShowModal(false)} alignment="center">
                <CModalHeader onClose={() => setShowModal(false)}>
                    <CModalTitle>{editId ? 'Edit Position' : 'Add New Position'}</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleSubmit}>
                    <CModalBody>
                        <div className="mb-3">
                            <CFormLabel>Position Name</CFormLabel>
                            <CFormInput
                                placeholder="Enter position name"
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                required
                            />
                        </div>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
                        <CButton color="primary" type="submit">{editId ? 'Save Changes' : 'Create Position'}</CButton>
                    </CModalFooter>
                </CForm>
            </CModal>
        </CRow>
    )
}

export default Positions
