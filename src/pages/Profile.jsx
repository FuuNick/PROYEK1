import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CForm,
    CFormInput,
    CFormLabel,
    CRow,
    CAlert,
    CAvatar,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilLockLocked, cilSave } from '@coreui/icons'

const Profile = () => {
    const { user, updateProfile } = useAuth()
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [avatar, setAvatar] = useState(null)
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        if (user) {
            setName(user.name || '')
            if (user.picture) {
                let pic = user.picture;
                if (pic.startsWith('http://localhost:5000')) {
                    pic = pic.replace('http://localhost:5000', '');
                }
                if (pic.startsWith('https://localhost:5000')) {
                    pic = pic.replace('https://localhost:5000', '');
                }
                setPreview(
                    pic.startsWith('/uploads') ? `/pob/api${pic}` : pic
                )
            }
        }
    }, [user])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setAvatar(file)
            setPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        if (password !== confirmPassword) {
            setMessage({ type: 'danger', text: 'Passwords do not match!' })
            return
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('name', name)
        if (password) formData.append('password', password)
        if (avatar) formData.append('avatar', avatar)

        const success = await updateProfile(formData)

        if (success) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            setPassword('')
            setConfirmPassword('')
        } else {
            setMessage({ type: 'danger', text: 'Failed to update profile.' })
        }
        setLoading(false)
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <strong>My Profile</strong>
                    </CCardHeader>
                    <CCardBody>
                        <CForm onSubmit={handleSubmit}>
                            {message.text && (
                                <CAlert color={message.type} dismissible>
                                    {message.text}
                                </CAlert>
                            )}
                            <CRow>
                                {/* Left Column: Avatar */}
                                <CCol md={4} className="text-center mb-4">
                                    <div className="position-relative d-inline-block">
                                        <div
                                            className="rounded-circle border border-3 border-white shadow-sm overflow-hidden bg-light"
                                            style={{ width: '160px', height: '160px', margin: '0 auto' }}
                                        >
                                            {preview ? (
                                                <img
                                                    src={preview || 'avatars/8.jpg'} // Fallback if preview is null initially though user check handles it
                                                    alt="Profile"
                                                    className="w-100 h-100 object-fit-cover"
                                                />
                                            ) : (
                                                <div className="d-flex align-items-center justify-content-center w-100 h-100 text-secondary">
                                                    <CIcon icon={cilUser} size="3xl" />
                                                </div>
                                            )}
                                        </div>
                                        <label
                                            className="position-absolute start-0 w-100 bottom-0 bg-dark bg-opacity-50 text-white text-center py-1 cursor-pointer transition-opacity"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            Change
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    </div>
                                    <div className="mt-2 text-medium-emphasis small">JPG or PNG max 2MB</div>
                                </CCol>

                                {/* Right Column: Form Fields */}
                                <CCol md={8}>
                                    <h5 className="mb-3 border-bottom pb-2">Personal Information</h5>
                                    <div className="mb-3">
                                        <CFormLabel>Full Name</CFormLabel>
                                        <CFormInput
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <h5 className="mb-3 border-bottom pb-2 mt-4">Security</h5>
                                    <div className="mb-3 position-relative">
                                        <CFormLabel>New Password</CFormLabel>
                                        <div className="position-relative">
                                            <CFormInput
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Leave blank to keep current password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pe-5"
                                            />
                                            <button
                                                type="button"
                                                className="position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent text-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="form-text">
                                            Only fill this if you want to change your password
                                        </div>
                                    </div>

                                    {password && (
                                        <div className="mb-3 animate__animated animate__fadeIn position-relative">
                                            <CFormLabel>Confirm New Password</CFormLabel>
                                            <CFormInput
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Re-enter new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                                        <CButton color="primary" type="submit" disabled={loading}>
                                            {loading ? (
                                                <>Saving...</>
                                            ) : (
                                                <>
                                                    <CIcon icon={cilSave} className="me-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </CButton>
                                    </div>
                                </CCol>
                            </CRow>
                        </CForm>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    )
}

export default Profile
