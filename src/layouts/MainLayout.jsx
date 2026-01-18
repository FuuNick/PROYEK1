import React, { useEffect } from 'react'
import axios from 'axios'
import AppContent from '../components/AppContent.jsx'
import AppSidebar from '../components/AppSidebar.jsx'
import AppFooter from '../components/AppFooter.jsx'
import AppHeader from '../components/AppHeader.jsx'

const MainLayout = () => {
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('http://localhost:5000/settings')
                if (res.data && res.data.app_name) {
                    document.title = res.data.app_name
                }
                // Optional: set favicon if useful, but requires link tag manipulation
            } catch (err) {
                console.error(err)
            }
        }
        fetchSettings()
    }, [])

    return (
        <div>
            <AppSidebar />
            <div className="wrapper d-flex flex-column min-vh-100">
                <AppHeader />
                <div className="body flex-grow-1">
                    <AppContent />
                </div>
                <AppFooter />
            </div>
        </div>
    )
}

export default MainLayout
