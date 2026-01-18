import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Personnel from './pages/Personnel';
import Divisions from './pages/Divisions';
import Positions from './pages/Positions';
import Locations from './pages/Locations';
import Devices from './pages/Devices';
import Vehicles from './pages/Vehicles';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import VisitorManagement from './pages/VisitorManagement';
import Monitor from './pages/Monitor';
import DatabaseSync from './pages/DatabaseSync';
import DatabaseBackup from './pages/DatabaseBackup';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Medical from './pages/Medical';
import Settings from './pages/Settings';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';
import PublicDashboard from './pages/PublicDashboard';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router basename="/pob">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/live" element={<PublicLayout><PublicDashboard /></PublicLayout>} />

            <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/personnel" element={<Personnel />} />
              <Route path="/divisions" element={<Divisions />} />
              <Route path="/positions" element={<Positions />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/visitors" element={<VisitorManagement />} />
              <Route path="/monitor" element={<Monitor />} />
              <Route path="/medical" element={<Medical />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/database-sync" element={<DatabaseSync />} />
              <Route path="/backup" element={<DatabaseBackup />} />
              <Route path="/db-sync" element={<Navigate to="/database-sync" replace />} />
              <Route path="/users" element={<Users />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
