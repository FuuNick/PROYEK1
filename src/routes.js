import React from 'react'

const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'))
// We can lazy load others if needed, or just keep it simple for breadcrumbs
// Breadcrumb only needs path and name, element is optional if only used for name mapping

const routes = [
    { path: '/', exact: true, name: 'Home' },
    { path: '/dashboard', name: 'Dashboard', element: Dashboard },
    { path: '/personnel', name: 'Personnel' },
    { path: '/divisions', name: 'Divisions' },
    { path: '/positions', name: 'Positions' },
    { path: '/locations', name: 'Locations' },
    { path: '/devices', name: 'Devices' },
    { path: '/vehicles', name: 'Vehicles' },
    { path: '/events', name: 'Events' },
    { path: '/events/:id', name: 'Event Details' },
    { path: '/visitors', name: 'Visitor Management' },
    { path: '/monitor', name: 'Realtime Monitor' },
    { path: '/profile', name: 'User Profile' },
    { path: '/users-manage', name: 'User Management' },
    { path: '/database-sync', name: 'Database Sync' },
    { path: '/backup', name: 'Database Backup' },
]

export default routes
