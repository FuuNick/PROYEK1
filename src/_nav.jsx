import React from 'react'
import CIcon from '@coreui/icons-react'
import {
    cilBell,
    cilCalculator,
    cilChartPie,
    cilCursor,
    cilDescription,
    cilDrop,
    cilNotes,
    cilPencil,
    cilPuzzle,
    cilSpeedometer,
    cilStar,
    cilPeople,
    cilLocationPin,
    cilTablet,
    cilTruck,
    cilUser,
    cilBuilding,
    cilBriefcase,
    cilCalendar,
    cilSave,
    cilSettings,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
    {
        component: CNavItem,
        name: 'Dashboard',
        to: '/dashboard',
        icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    },
    {
        component: CNavTitle,
        name: 'Master Data',
    },
    {
        component: CNavItem,
        name: 'Divisions',
        to: '/divisions',
        icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Positions',
        to: '/positions',
        icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Locations',
        to: '/locations',
        icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Devices',
        to: '/devices',
        icon: <CIcon icon={cilTablet} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Personnel',
        to: '/personnel',
        icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Vehicles',
        to: '/vehicles',
        icon: <CIcon icon={cilTruck} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Medical (MCU)',
        to: '/medical',
        icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
    },
    {
        component: CNavTitle,
        name: 'Attendance',
    },
    {
        component: CNavItem,
        name: 'Attendance Log',
        to: '/monitor',
        icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Visitor Management',
        to: '/visitors',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Event Attendance',
        to: '/events',
        icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
    },
    {
        component: CNavTitle,
        name: 'Administration',
    },
    {
        component: CNavItem,
        name: 'User Management',
        to: '/users',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'System Settings',
        to: '/settings',
        icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Database Sync',
        to: '/database-sync',
        icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
    },
    {
        component: CNavItem,
        name: 'Database Backup',
        to: '/backup',
        icon: <CIcon icon={cilSave} customClassName="nav-icon" />,
    },
]

export default _nav
