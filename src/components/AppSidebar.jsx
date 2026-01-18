import React from 'react'
import axios from 'axios'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilUser, cilDrop, cilCalendar } from '@coreui/icons'
import { useAuth } from '../context/AuthContext'

import { AppSidebarNav } from './AppSidebarNav.jsx'

import navigation from '../_nav.jsx'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  const [logo, setLogo] = React.useState('/pob/logo.png')

  React.useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await axios.get('/settings')
        if (res.data && res.data.icon_dashboard) {
          let logoUrl = res.data.icon_dashboard;
          if (logoUrl.startsWith('http://localhost:5000')) {
            logoUrl = logoUrl.replace('http://localhost:5000', '');
          }
          if (logoUrl.startsWith('https://localhost:5000')) {
            logoUrl = logoUrl.replace('https://localhost:5000', '');
          }
          if (logoUrl.startsWith('/') && !logoUrl.startsWith('/pob/api')) {
            logoUrl = `/pob/api${logoUrl}`;
          }
          setLogo(logoUrl)
        }
      } catch (err) {
        console.error('Failed to fetch logo', err)
      }
    }
    fetchLogo()
  }, [])

  const { user } = useAuth()
  const [navItems, setNavItems] = React.useState(navigation)

  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setNavItems(navigation)
      } else {
        import('@coreui/react').then(({ CNavItem }) => {
          let items = [];

          // Define standard components
          const dashboardItem = {
            component: CNavItem,
            name: 'Dashboard',
            to: '/dashboard',
            icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
          };
          const profileItem = {
            component: CNavItem,
            name: 'Update Profile',
            to: '/profile',
            icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
          };

          if (user.role === 'medic') {
            // Medic: Dashboard + Profile + Medical
            items = [
              dashboardItem,
              profileItem,
              {
                component: CNavItem,
                name: 'Medical (MCU)',
                to: '/medical',
                icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
              }
            ];
          } else if (user.role === 'operator') {
            // Operator: Profile + Event Attendance (NO Dashboard)
            items = [
              profileItem, // No Dashboard for Operator
              {
                component: CNavItem,
                name: 'Event Attendance',
                to: '/events',
                icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
              }
            ];
          } else {
            // Default User: Dashboard + Profile
            items = [
              dashboardItem,
              profileItem
            ];
          }

          setNavItems(items);
        });
      }
    } else {
      setNavItems(navigation)
    }
  }, [user])

  return (
    <CSidebar
      className="border-end"
      colorScheme="light"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <img src={logo} alt="Logo" height={32} className="sidebar-brand-full" onError={(e) => { e.target.onerror = null; e.target.src = '/pob/logo.png'; }} />
          <img src={logo} alt="Logo" height={32} className="sidebar-brand-narrow" onError={(e) => { e.target.onerror = null; e.target.src = '/pob/logo.png'; }} />
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <AppSidebarNav items={navItems} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
