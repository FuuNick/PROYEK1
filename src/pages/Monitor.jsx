import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
    CCard,
    CCardHeader,
    CCardBody,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CFormInput,
    CInputGroup,
    CInputGroupText,
    CFormSelect,
    CBadge,
    CPagination,
    CPaginationItem,
    CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilCloudDownload, cilPrint, cilArrowLeft, cilArrowRight } from '@coreui/icons'
import Swal from 'sweetalert2'

const Monitor = () => {
    const [logs, setLogs] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(false)

    // Pagination State
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [total, setTotal] = useState(0)
    const limit = 10

    useEffect(() => {
        setPage(1) // Reset to page 1 on filter change
    }, [search, statusFilter])

    useEffect(() => {
        fetchLogs()
    }, [page, search, statusFilter])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const params = { page, limit }
            if (search) params.search = search
            if (statusFilter) params.status = statusFilter

            const res = await axios.get('http://localhost:5000/attendance', { params })
            // Backend now returns { data, total, page, totalPages }
            setLogs(res.data.data)
            setTotal(res.data.total)
            setTotalPages(res.data.totalPages)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            // Fetch ALL data matching filters for export
            const params = { limit: 10000 } // High limit effectively fetches all
            if (search) params.search = search
            if (statusFilter) params.status = statusFilter

            const res = await axios.get('http://localhost:5000/attendance', { params })
            const dataToExport = res.data.data

            if (dataToExport.length === 0) return Swal.fire('Info', 'No data to export', 'info')

            const headers = ['Personnel Name', 'Time In', 'Time Out', 'Location', 'Status']
            const csvContent = [
                headers.join(','),
                ...dataToExport.map(log => `"${log.personnel_name}","${log.time_in ? new Date(log.time_in).toLocaleString() : ''}","${log.time_out ? new Date(log.time_out).toLocaleString() : ''}","${log.location_name || ''}","${log.status}"`)
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `attendance_log_${new Date().toISOString().split('T')[0]}.csv`
            a.click()
        } catch (error) {
            Swal.fire('Error', 'Failed to export data', 'error')
        }
    }

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800')
        printWindow.document.write('<html><head><title>Print Attendance Log</title>')
        printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid black; padding: 8px; text-align: left; } </style>')
        printWindow.document.write('</head><body>')
        printWindow.document.write('<h2>Attendance Log</h2>')
        printWindow.document.write('<table><thead><tr><th>Name</th><th>Time In</th><th>Time Out</th><th>Location</th><th>Status</th></tr></thead><tbody>')
        logs.forEach(log => {
            printWindow.document.write(`<tr><td>${log.personnel_name}</td><td>${log.time_in ? new Date(log.time_in).toLocaleString() : ''}</td><td>${log.time_out ? new Date(log.time_out).toLocaleString() : ''}</td><td>${log.location_name || ''}</td><td>${log.status}</td></tr>`)
        })
        printWindow.document.write('</tbody></table>')
        printWindow.document.write('</body></html>')
        printWindow.document.close()
        printWindow.print()
    }

    const formatTime = (isoString) => {
        if (!isoString) return '-'
        return new Date(isoString).toLocaleString()
    }

    return (
        <CCard className="mb-4">
            <CCardHeader className="bg-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <strong className="fs-5">Attendance Log</strong>
                </div>
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
                        <CFormSelect
                            style={{ width: '150px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="IN">IN</option>
                            <option value="OUT">OUT</option>
                            <option value="FIELD">FIELD</option>
                        </CFormSelect>
                    </div>

                    <CInputGroup style={{ maxWidth: '300px' }}>
                        <CFormInput
                            placeholder="Search personnel..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                    </CInputGroup>
                </div>

                <CTable hover responsive align="middle" className="mb-4">
                    <CTableHead>
                        <CTableRow>
                            <CTableHeaderCell>Personnel Name</CTableHeaderCell>
                            <CTableHeaderCell>Time In</CTableHeaderCell>
                            <CTableHeaderCell>Time Out</CTableHeaderCell>
                            <CTableHeaderCell>Location</CTableHeaderCell>
                            <CTableHeaderCell>Status</CTableHeaderCell>
                        </CTableRow>
                    </CTableHead>
                    <CTableBody>
                        {logs.length > 0 ? logs.map(log => (
                            <CTableRow key={log.id}>
                                <CTableDataCell className="fw-bold">{log.personnel_name}</CTableDataCell>
                                <CTableDataCell>{formatTime(log.time_in)}</CTableDataCell>
                                <CTableDataCell>{formatTime(log.time_out)}</CTableDataCell>
                                <CTableDataCell>{log.location_name || '-'}</CTableDataCell>
                                <CTableDataCell>
                                    <CBadge color={
                                        log.status === 'IN' ? 'success' :
                                            log.status === 'OUT' ? 'danger' :
                                                'info'
                                    }>
                                        {log.status}
                                    </CBadge>
                                </CTableDataCell>
                            </CTableRow>
                        )) : (
                            <CTableRow>
                                <CTableDataCell colSpan="5" className="text-center py-4">
                                    No attendance records found
                                </CTableDataCell>
                            </CTableRow>
                        )}
                    </CTableBody>
                </CTable>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center">
                    <div className="small text-medium-emphasis">
                        Showing {logs.length} of {total} entries
                    </div>
                    <CPagination align="end" aria-label="Page navigation">
                        <CPaginationItem
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            style={{ cursor: page === 1 ? 'default' : 'pointer' }}
                        >
                            <span aria-hidden="true">&laquo;</span>
                        </CPaginationItem>

                        {[...Array(totalPages)].map((_, i) => (
                            <CPaginationItem
                                key={i + 1}
                                active={i + 1 === page}
                                onClick={() => setPage(i + 1)}
                                style={{ cursor: 'pointer' }}
                            >
                                {i + 1}
                            </CPaginationItem>
                        ))}

                        <CPaginationItem
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(page + 1)}
                            style={{ cursor: (page === totalPages || totalPages === 0) ? 'default' : 'pointer' }}
                        >
                            <span aria-hidden="true">&raquo;</span>
                        </CPaginationItem>
                    </CPagination>
                </div>
            </CCardBody>
        </CCard>
    )
}

export default Monitor

