import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import DailyReport from './pages/DailyReport'
import StaffRegistration from './pages/StaffRegistration'
import StaffPerformance from './pages/StaffPerformance'
import MonthlyReport from './pages/MonthlyReport'
import YearlyReport from './pages/YearlyReport'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  console.log('App component is rendering')
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout>
                  <Outlet />
                </Layout>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DailyReport />} />
            <Route path="/daily" element={<DailyReport />} />
            <Route path="/monthly" element={<MonthlyReport />} />
            <Route path="/yearly" element={<YearlyReport />} />
            <Route path="/staff" element={<StaffRegistration />} />
            <Route path="/performance" element={<StaffPerformance />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App

