import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
    CCard, CCardHeader, CCardBody, CForm, CFormLabel, CFormInput, CFormTextarea, CFormSelect,
    CButton, CNav, CNavItem, CNavLink, CTabContent, CTabPane, CFormCheck, CImage,
    CToaster, CToast, CToastHeader, CToastBody,
    CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CBadge
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPencil, cilDrop, cilPeople, cilSettings, cilCloudDownload, cilCloudUpload, cilTrash, cilBuilding } from '@coreui/icons'
import Swal from 'sweetalert2'

const Settings = () => {
    const [activeKey, setActiveKey] = useState(1)
    const [formData, setFormData] = useState({
        company: '', app_name: '', running_text: '',
        dashboard_location_id: '', dashboard_global_name: '',
        site_parent_location_id: '', auto_deactivate_days: 365,
        mcu_feature_active: false, mcu_validity_days: 365,
        mcu_expired_message: '', mcu_unfit_warning_message: '', mcu_denied_message: '',
        icon_dashboard: null
    })
    const [previewIcon, setPreviewIcon] = useState(null)
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(0)
    const toaster = useRef()

    const [marqueeItems, setMarqueeItems] = useState([])
    const [marqueeForm, setMarqueeForm] = useState({ text: '', color: '#ffffff', id: null })

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
        fetchSettings()
        fetchLocations()
        fetchMarquees()
    }, [])

    const fetchMarquees = async () => {
        try {
            const res = await axios.get('http://localhost:5000/marquee')
            setMarqueeItems(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const handleSaveMarquee = async () => {
        if (!marqueeForm.text) return addToast('Message text required', 'danger')
        try {
            if (marqueeForm.id) {
                await axios.put(`http://localhost:5000/marquee/${marqueeForm.id}`, marqueeForm)
                addToast('Message updated', 'success')
            } else {
                await axios.post('http://localhost:5000/marquee', marqueeForm)
                addToast('Message added', 'success')
            }
            fetchMarquees()
            setMarqueeForm({ text: '', color: '#ffffff', id: null })
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to save message'
            addToast(msg, 'danger')
        }
    }

    const handleDeleteMarquee = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Message?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/marquee/${id}`)
                addToast('Message deleted', 'success')
                fetchMarquees()
            } catch (err) {
                addToast('Failed to delete message', 'danger')
            }
        }
    }

    const fetchSettings = async () => {
        try {
            const res = await axios.get('http://localhost:5000/settings')
            if (res.data) {
                setFormData({
                    ...res.data,
                    mcu_feature_active: res.data.mcu_feature_active === true || res.data.mcu_feature_active === 'true',
                    icon_dashboard: res.data.icon_dashboard // Keep string path if exists
                })
            }
        } catch (err) {
            console.error(err)
        }
    }

    const fetchLocations = async () => {
        try {
            // Use authorized endpoint to get full fields including custom messages
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/locations', {
                params: { limit: 100 },
                headers: { token: token }
            });
            // The auth endpoint returns { data: [...] } structure
            setLocations(res.data.data);
        } catch (err) {
            console.error(err)
            // Fallback to public if auth fails (though Settings is protected)
            try {
                const res = await axios.get('http://localhost:5000/locations/public');
                setLocations(res.data);
            } catch (e) { }
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target
        if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] })
            setPreviewIcon(URL.createObjectURL(files[0]))
        } else if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked })
        } else {
            setFormData({ ...formData, [name]: value })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const data = new FormData()
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key])
            }
        })

        try {
            const res = await axios.post('http://localhost:5000/settings', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            addToast('Settings updated successfully', 'success')
            // Refresh to get clean state (e.g. icon path string instead of file obj)
            fetchSettings()
        } catch (err) {
            addToast('Failed to update settings', 'danger')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <CToaster ref={toaster} push={toast} placement="top-end" />
            <CCard className="mb-4">
                <CCardHeader>
                    <strong>System Settings</strong>
                </CCardHeader>
                <CCardBody>
                    <CNav variant="tabs" role="tablist">
                        <CNavItem>
                            <CNavLink
                                active={activeKey === 1}
                                onClick={() => setActiveKey(1)}
                                style={{ cursor: 'pointer' }}
                            >
                                General
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink
                                active={activeKey === 4}
                                onClick={() => setActiveKey(4)}
                                style={{ cursor: 'pointer' }}
                            >
                                Running Text
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink
                                active={activeKey === 2}
                                onClick={() => setActiveKey(2)}
                                style={{ cursor: 'pointer' }}
                            >
                                Dashboard
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink
                                active={activeKey === 3}
                                onClick={() => setActiveKey(3)}
                                style={{ cursor: 'pointer' }}
                            >
                                Medical (MCU)
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink
                                active={activeKey === 5}
                                onClick={() => setActiveKey(5)}
                                style={{ cursor: 'pointer' }}
                            >
                                Links
                            </CNavLink>
                        </CNavItem>
                        <CNavItem>
                            <CNavLink
                                active={activeKey === 6}
                                onClick={() => setActiveKey(6)}
                                style={{ cursor: 'pointer' }}
                            >
                                Gate Alerts
                            </CNavLink>
                        </CNavItem>
                    </CNav>
                    <CTabContent className="p-3 border border-top-0 rounded-bottom">
                        {/* General Settings */}
                        <CTabPane role="tabpanel" aria-labelledby="home-tab" visible={activeKey === 1}>
                            <div className="mb-3">
                                <CFormLabel>Company Name</CFormLabel>
                                <CFormInput name="company" value={formData.company || ''} onChange={handleChange} />
                            </div>
                            <div className="mb-3">
                                <CFormLabel>App Name</CFormLabel>
                                <CFormInput name="app_name" value={formData.app_name || ''} onChange={handleChange} />
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Auto Deactivate Visitors (Days)</CFormLabel>
                                <CFormInput type="number" name="auto_deactivate_days" value={formData.auto_deactivate_days} onChange={handleChange} />
                            </div>
                        </CTabPane>

                        {/* Marquee Settings */}
                        <CTabPane role="tabpanel" aria-labelledby="marquee-tab" visible={activeKey === 4}>
                            <div className="mb-4 p-3 border rounded bg-light">
                                <h5>{marqueeForm.id ? 'Edit Message' : 'Add New Message'}</h5>
                                <div className="row g-3">
                                    <div className="col-md-8">
                                        <CFormInput
                                            placeholder="Enter running text message..."
                                            value={marqueeForm.text}
                                            onChange={(e) => setMarqueeForm({ ...marqueeForm, text: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <CFormInput
                                            type="color"
                                            value={marqueeForm.color}
                                            onChange={(e) => setMarqueeForm({ ...marqueeForm, color: e.target.value })}
                                            title="Text Color"
                                            style={{ height: '38px' }}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <CButton color="primary" className="w-100" onClick={handleSaveMarquee}>
                                            {marqueeForm.id ? 'Update' : 'Add'}
                                        </CButton>
                                    </div>
                                    {marqueeForm.id && (
                                        <div className="col-12 text-end">
                                            <CButton
                                                color="secondary"
                                                size="sm"
                                                onClick={() => setMarqueeForm({ text: '', color: '#ffffff', id: null })}
                                            >
                                                Cancel Edit
                                            </CButton>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <CTable hover responsive align="middle">
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell>Message</CTableHeaderCell>
                                        <CTableHeaderCell>Color</CTableHeaderCell>
                                        <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {marqueeItems.length > 0 ? marqueeItems.map(item => (
                                        <CTableRow key={item.id}>
                                            <CTableDataCell>
                                                <span style={{ color: item.color, backgroundColor: '#333', padding: '2px 5px', borderRadius: '4px' }}>
                                                    {item.text}
                                                </span>
                                            </CTableDataCell>
                                            <CTableDataCell>
                                                <div style={{ width: '20px', height: '20px', backgroundColor: item.color, border: '1px solid #ccc' }}></div>
                                            </CTableDataCell>
                                            <CTableDataCell className="text-end">
                                                <CButton size="sm" color="warning" variant="ghost" onClick={() => setMarqueeForm(item)}>
                                                    <CIcon icon={cilPencil} />
                                                </CButton>
                                                <CButton size="sm" color="danger" variant="ghost" onClick={() => handleDeleteMarquee(item.id)}>
                                                    <CIcon icon={cilTrash} />
                                                </CButton>
                                            </CTableDataCell>
                                        </CTableRow>
                                    )) : (
                                        <CTableRow>
                                            <CTableDataCell colSpan="3" className="text-center">No running text messages found</CTableDataCell>
                                        </CTableRow>
                                    )}
                                </CTableBody>
                            </CTable>
                        </CTabPane>

                        {/* Dashboard Settings */}
                        <CTabPane role="tabpanel" aria-labelledby="profile-tab" visible={activeKey === 2}>
                            <div className="mb-3">
                                <CFormLabel>Dashboard Logo</CFormLabel>
                                <CFormInput type="file" name="icon_dashboard" onChange={handleChange} accept="image/*" />
                                {previewIcon ? (
                                    <CImage src={previewIcon} height={100} className="mt-2 border rounded p-1" alt="Logo Preview" />
                                ) : formData.icon_dashboard && typeof formData.icon_dashboard === 'string' ? (
                                    <CImage
                                        src={`/pob/uploads/${formData.icon_dashboard.split('uploads/').pop()}`}
                                        height={100}
                                        className="mt-2 border rounded p-1"
                                        alt="Logo Stored"
                                        onError={(e) => { e.target.style.display = 'none'; addToast('Current logo file not found', 'warning'); }}
                                    />
                                ) : null}
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Default Dashboard Location</CFormLabel>
                                <CFormSelect name="dashboard_location_id" value={formData.dashboard_location_id || ''} onChange={handleChange}>
                                    <option value="">-- All Locations (Global) --</option>
                                    {locations.filter(l => l.type === 'SITE').map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </CFormSelect>
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Global Dashboard Name</CFormLabel>
                                <CFormInput name="dashboard_global_name" value={formData.dashboard_global_name || ''} onChange={handleChange} />
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Site Parent Location (Filter)</CFormLabel>
                                <CFormSelect name="site_parent_location_id" value={formData.site_parent_location_id || ''} onChange={handleChange}>
                                    <option value="">Select Location</option>
                                    {(() => {
                                        // Helper to prepare structured list
                                        let filtered = [];

                                        // 1. If Specific Site Selected
                                        if (formData.dashboard_location_id) {
                                            // Helper to find descendants recursively
                                            const getDescendants = (parentId) => {
                                                let descendants = [];
                                                const children = locations.filter(l => l.parent_id == parentId);
                                                children.forEach(child => {
                                                    descendants.push(child);
                                                    descendants = [...descendants, ...getDescendants(child.id)];
                                                });
                                                return descendants;
                                            };

                                            // Find the parent (Selected Site)
                                            const parent = locations.find(l => l.id == formData.dashboard_location_id);
                                            if (parent) {
                                                filtered.push(parent);
                                                // Get all recursive descendants
                                                const allDescendants = getDescendants(formData.dashboard_location_id);
                                                filtered = [...filtered, ...allDescendants];
                                            }
                                        }
                                        // 2. If Global (All) Selected
                                        else {
                                            // Get all SITEs first
                                            const sites = locations.filter(l => l.type === 'SITE');

                                            // Helper to find descendants recursively
                                            const getDescendants = (parentId) => {
                                                let descendants = [];
                                                const children = locations.filter(l => l.parent_id == parentId);
                                                children.forEach(child => {
                                                    descendants.push(child);
                                                    descendants = [...descendants, ...getDescendants(child.id)];
                                                });
                                                return descendants;
                                            };

                                            sites.forEach(site => {
                                                filtered.push(site);
                                                // Find children for this site recursively
                                                const allDescendants = getDescendants(site.id);
                                                filtered = [...filtered, ...allDescendants];
                                            });
                                        }

                                        return filtered.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {/* Indent based on depth manually or just check parent */}
                                                {loc.type === 'SITE' ? loc.name :
                                                    (loc.parent_id && locations.find(p => p.id == loc.parent_id && p.type === 'SITE')) ?
                                                        `\u00A0\u00A0\u00A0— ${loc.name}` :
                                                        `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0• ${loc.name}`}
                                            </option>
                                        ));
                                    })()}
                                </CFormSelect>
                            </div>
                        </CTabPane>

                        {/* MCU Settings */}
                        <CTabPane role="tabpanel" aria-labelledby="contact-tab" visible={activeKey === 3}>
                            <div className="mb-3">
                                <CFormCheck
                                    id="mcuActive"
                                    label="Enable MCU Feature"
                                    name="mcu_feature_active"
                                    checked={formData.mcu_feature_active}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <CFormLabel>MCU Validity (Days)</CFormLabel>
                                <CFormInput type="number" name="mcu_validity_days" value={formData.mcu_validity_days} onChange={handleChange} />
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Expired Message</CFormLabel>
                                <CFormTextarea name="mcu_expired_message" value={formData.mcu_expired_message || ''} onChange={handleChange} />
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Unfit Warning Message</CFormLabel>
                                <CFormTextarea name="mcu_unfit_warning_message" value={formData.mcu_unfit_warning_message || ''} onChange={handleChange} />
                            </div>
                            <div className="mb-3">
                                <CFormLabel>Access Denied Message</CFormLabel>
                                <CFormTextarea name="mcu_denied_message" value={formData.mcu_denied_message || ''} onChange={handleChange} />
                            </div>
                        </CTabPane>

                        {/* Links Settings */}
                        <CTabPane role="tabpanel" aria-labelledby="links-tab" visible={activeKey === 5}>
                            <div className="mb-4">
                                <h5>Dashboard Links Generator</h5>
                                <p className="text-muted small mb-3">
                                    Generate direct links to display specific location dashboards on separate monitors.
                                </p>

                                <CTable hover responsive bordered small className="mb-4">
                                    <CTableHead color="light">
                                        <CTableRow>
                                            <CTableHeaderCell>Location</CTableHeaderCell>
                                            <CTableHeaderCell>Type</CTableHeaderCell>
                                            <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                                        </CTableRow>
                                    </CTableHead>
                                    <CTableBody>
                                        {(() => {
                                            // Helper to prepare structured list for Table
                                            let ordered = [];
                                            // Helper to find descendants recursively with depth tracking
                                            const getDescendants = (parentId, depth) => {
                                                let descendants = [];
                                                const children = locations.filter(l => l.parent_id == parentId);
                                                children.forEach(child => {
                                                    descendants.push({ ...child, depth: depth });
                                                    descendants = [...descendants, ...getDescendants(child.id, depth + 1)];
                                                });
                                                return descendants;
                                            };

                                            const sites = locations.filter(l => l.type === 'SITE');
                                            sites.forEach(site => {
                                                ordered.push({ ...site, depth: 0 });
                                                // Find children recursively
                                                const allDescendants = getDescendants(site.id, 1);
                                                ordered = [...ordered, ...allDescendants];
                                            });

                                            return ordered.map(loc => (
                                                <CTableRow key={loc.id}>
                                                    <CTableDataCell>
                                                        <div style={{ paddingLeft: `${loc.depth * 20}px` }}>
                                                            {loc.depth > 0 ? (
                                                                <span className="text-secondary">— {loc.name}</span>
                                                            ) : (
                                                                <span className="fw-bold text-primary">{loc.name}</span>
                                                            )}
                                                        </div>
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                        <CBadge color={loc.type === 'SITE' ? 'primary' : 'success'}>{loc.type}</CBadge>
                                                    </CTableDataCell>
                                                    <CTableDataCell className="text-end">
                                                        <CButton
                                                            color="info"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => {
                                                                const baseUrl = import.meta.env.BASE_URL || '/';
                                                                const url = `${window.location.origin}${baseUrl}live?location_id=${loc.id}`;
                                                                window.open(url, '_blank');
                                                            }}
                                                        >
                                                            <CIcon icon={cilSearch} className="me-1" /> Open
                                                        </CButton>
                                                        <CButton
                                                            color="secondary"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                const baseUrl = import.meta.env.BASE_URL || '/';
                                                                const url = `${window.location.origin}${baseUrl}live?location_id=${loc.id}`;
                                                                navigator.clipboard.writeText(url);
                                                                addToast('Link copied to clipboard', 'success');
                                                            }}
                                                        >
                                                            Copy Link
                                                        </CButton>
                                                    </CTableDataCell>
                                                </CTableRow>
                                            ));
                                        })()}
                                    </CTableBody>
                                </CTable>
                            </div>
                        </CTabPane>

                        {/* Gate Alerts Settings */}
                        <CTabPane role="tabpanel" aria-labelledby="alerts-tab" visible={activeKey === 6}>
                            <div className="mb-4">
                                <h5>Custom Gate Alerts</h5>
                                <p className="text-muted small mb-3">
                                    Configure custom "Welcome" and "Goodbye" messages for specific Gates or POS locations.
                                </p>

                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="list-group" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            {(() => {
                                                // 1. Find all SITES
                                                const sites = locations.filter(l => l.type === 'SITE');

                                                // Helper to find all valid descendants recursively
                                                const getGateDescendants = (parentId) => {
                                                    let descendants = [];
                                                    const children = locations.filter(l => l.parent_id === parentId);
                                                    children.forEach(child => {
                                                        if (child.type === 'GATE' || child.type === 'POS' || child.type === 'MAIN GATE') {
                                                            descendants.push(child);
                                                        }
                                                        // Continue recursion regardless of type (in case a GATE is inside a BUILDING inside a SITE etc)
                                                        descendants = [...descendants, ...getGateDescendants(child.id)];
                                                    });
                                                    return descendants;
                                                };

                                                // 2. Prepare Orphans (No Parent)
                                                // We need to be careful not to show items that ARE found as descendants of a Site
                                                // So let's collect all IDs that are descendants of any Site first
                                                let siteDescendantIds = new Set();

                                                // We can't easily populate siteDescendantIds before mapping, so let's do logic inside.
                                                // Actually, improved approach:
                                                // Identify Orphans as those who have no parent OR their parent is not in the locations list (broken chain)
                                                // OR their ancestry chain never hits a SITE.

                                                // Simpler: Just render Sites and their full recursive descendants.
                                                // Then render items with !parent_id.
                                                // Complex case: Gate with parent that is NOT a Site and NOT unconnected.
                                                // But usually standard tree is Site -> Main Gate -> Gate.

                                                // Let's stick to the user's focus: Sites.

                                                const renderedIds = new Set();

                                                return (
                                                    <>
                                                        {sites.map(site => {
                                                            // Find all descendants that are gates
                                                            const descendants = getGateDescendants(site.id);
                                                            if (descendants.length === 0) return null;

                                                            descendants.forEach(d => renderedIds.add(d.id));

                                                            return (
                                                                <div key={site.id} className="mb-2">
                                                                    <div className="p-2 bg-light font-weight-bold text-uppercase small text-muted border-bottom">
                                                                        <CIcon icon={cilBuilding} className="me-1" /> {site.name}
                                                                    </div>
                                                                    {descendants.map(loc => (
                                                                        <button
                                                                            key={loc.id}
                                                                            type="button"
                                                                            className={`list-group-item list-group-item-action ${formData.id === loc.id ? 'active' : ''}`}
                                                                            style={{ paddingLeft: '1.5rem', borderLeft: '3px solid transparent', borderLeftColor: formData.id === loc.id ? 'white' : 'transparent' }}
                                                                            onClick={() => {
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    id: loc.id,
                                                                                    name: loc.name,
                                                                                    type: loc.type,
                                                                                    parent_id: loc.parent_id,
                                                                                    capacity: loc.capacity,
                                                                                    custom_in_message: loc.custom_in_message || '',
                                                                                    custom_out_message: loc.custom_out_message || ''
                                                                                });
                                                                            }}
                                                                        >
                                                                            <div className="d-flex w-100 justify-content-between align-items-center">
                                                                                <span className="mb-0">
                                                                                    {loc.parent_id !== site.id ? <span className="text-muted small me-1">↳ </span> : ''}
                                                                                    {loc.name}
                                                                                </span>
                                                                                <CBadge color={loc.type === 'MAIN GATE' ? 'danger' : 'info'} size="sm" shape="rounded-pill" style={{ opacity: 0.8 }}>
                                                                                    {loc.type}
                                                                                </CBadge>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Orphans Section - items not rendered yet & no parent */}
                                                        {(() => {
                                                            const orphans = locations.filter(l =>
                                                                (l.type === 'GATE' || l.type === 'POS' || l.type === 'MAIN GATE') &&
                                                                !l.parent_id &&
                                                                !renderedIds.has(l.id) // Should be redundant if no parent, but good safety
                                                            );

                                                            if (orphans.length > 0) {
                                                                return (
                                                                    <div className="mb-2">
                                                                        <div className="p-2 bg-light font-weight-bold text-uppercase small text-muted border-bottom">
                                                                            Other Locations
                                                                        </div>
                                                                        {orphans.map(loc => (
                                                                            <button
                                                                                key={loc.id}
                                                                                type="button"
                                                                                className={`list-group-item list-group-item-action ${formData.id === loc.id ? 'active' : ''}`}
                                                                                onClick={() => {
                                                                                    setFormData({
                                                                                        ...formData,
                                                                                        id: loc.id,
                                                                                        name: loc.name,
                                                                                        type: loc.type,
                                                                                        parent_id: loc.parent_id,
                                                                                        capacity: loc.capacity,
                                                                                        custom_in_message: loc.custom_in_message || '',
                                                                                        custom_out_message: loc.custom_out_message || ''
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <div className="d-flex w-100 justify-content-between align-items-center">
                                                                                    <span className="mb-0">{loc.name}</span>
                                                                                    <CBadge color="secondary" size="sm" shape="rounded-pill">{loc.type}</CBadge>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            }
                                                        })()}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="col-md-8">
                                        {formData.id && (formData.type === 'GATE' || formData.type === 'POS' || formData.type === 'MAIN GATE') ? (
                                            <div className="p-3 border rounded">
                                                <h6>Edit Alerts for: <strong>{formData.name}</strong></h6>
                                                <hr />
                                                <div className="mb-3">
                                                    <CFormLabel>Custom IN Message (Welcome)</CFormLabel>
                                                    <CFormInput
                                                        name="custom_in_message"
                                                        placeholder="e.g. Welcome to Main Workshop"
                                                        value={formData.custom_in_message || ''}
                                                        onChange={handleChange}
                                                    />
                                                    <div className="form-text">Leave empty to use default "Welcome [Name]"</div>
                                                </div>
                                                <div className="mb-3">
                                                    <CFormLabel>Custom OUT Message (Goodbye)</CFormLabel>
                                                    <CFormInput
                                                        name="custom_out_message"
                                                        placeholder="e.g. Have a safe trip home"
                                                        value={formData.custom_out_message || ''}
                                                        onChange={handleChange}
                                                    />
                                                    <div className="form-text">Leave empty to use default "Goodbye [Name]"</div>
                                                </div>
                                                <div className="text-end">
                                                    <CButton color="success" onClick={async () => {
                                                        setLoading(true);
                                                        try {
                                                            await axios.put(`http://localhost:5000/locations/${formData.id}`, formData, {
                                                                headers: { token: localStorage.getItem('token') }
                                                            });
                                                            addToast('Alerts updated successfully', 'success');
                                                            // Reload locations to update the list state
                                                            const res = await axios.get('http://localhost:5000/locations', { params: { limit: 100 }, headers: { token: localStorage.getItem('token') } });
                                                            setLocations(res.data.data);
                                                        } catch (err) {
                                                            addToast('Failed to update alerts', 'danger');
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }} disabled={loading}>
                                                        {loading ? 'Saving...' : 'Save Alerts'}
                                                    </CButton>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="alert alert-info">
                                                Select a Gate/POS from the list to configure custom alerts.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CTabPane>

                    </CTabContent>

                    <div className="mt-3">
                        <CButton color="primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </CButton>
                    </div>
                </CCardBody>
            </CCard>
        </>
    )
}

export default Settings
