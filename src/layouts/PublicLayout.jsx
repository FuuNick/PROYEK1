import React from 'react'
import RunningText from '../components/RunningText'

const PublicLayout = ({ children }) => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, backgroundColor: '#ebedef' }}>
                {children}
            </div>
            <div style={{ position: 'fixed', bottom: 0, width: '100%', zIndex: 1050 }}>
                <RunningText />
            </div>
        </div>
    )
}

export default PublicLayout
