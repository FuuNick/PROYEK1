import React from 'react'
import { Link } from 'react-router-dom'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilLockLocked,
  cilSettings,
  cilUser,
  cilAccountLogout,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useAuth } from '../../context/AuthContext'

import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const { user, logout } = useAuth()

  const getAvatarUrl = () => {
    if (user && user.picture) {
      let pic = user.picture;
      if (pic.startsWith('http://localhost:5000')) {
        pic = pic.replace('http://localhost:5000', '');
      }
      if (pic.startsWith('https://localhost:5000')) {
        pic = pic.replace('https://localhost:5000', '');
      }
      return pic.startsWith('/uploads') ? `/pob/api${pic}` : pic;
    }
    return avatar8
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={getAvatarUrl()} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        <Link to="/profile" className="dropdown-item">
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </Link>
        {user && user.role === 'admin' && (
          <Link to="/settings" className="dropdown-item">
            <CIcon icon={cilSettings} className="me-2" />
            Settings
          </Link>
        )}
        <CDropdownDivider />
        <CDropdownItem href="#">
          <CIcon icon={cilLockLocked} className="me-2" />
          Lock Account
        </CDropdownItem>
        <CDropdownItem onClick={logout} style={{ cursor: 'pointer' }}>
          <CIcon icon={cilAccountLogout} className="me-2" />
          Sign Out
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
