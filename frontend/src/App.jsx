import React from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'

import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import PostGig from './pages/PostGig'
import SkillExchange from './pages/SkillExchange'
import Profile from './pages/Profile'
import GigList from './pages/GigList'
import PublicProfile from './pages/PublicProfile'
import GigDetails from './pages/GigDetails'
import Chat from './pages/Chat'
import VideoSession from './pages/VideoSession'
import AdminDashboard from './pages/AdminDashboard'
import Search from './pages/Search'
import Browse from './pages/Browse'

import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { useTheme } from './hooks/useTheme'

/* Page transition variants */
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: 0.15 },
  },
}

const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {children}
  </motion.div>
)

const App = () => {
  const location = useLocation()
  useTheme()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Toast provider — renders bottom-right */}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        expand
        closeButton
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            background: 'var(--panel)',
            border: '0.5px solid var(--border)',
            color: 'var(--text)',
          },
        }}
      />

      {/* Sticky navbar */}
      <Navbar />

      {/* Content area */}
      <main style={{ flex: 1, paddingTop: 0, paddingBottom: 24 }}>
        <ErrorBoundary>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {/* Public routes */}
              <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
              <Route path="/signin" element={<PageWrapper><div className="max-w-7xl mx-auto px-4 pt-8"><SignIn /></div></PageWrapper>} />
              <Route path="/signup" element={<PageWrapper><div className="max-w-7xl mx-auto px-4 pt-8"><SignUp /></div></PageWrapper>} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <Dashboard />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <Search />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/post-gig" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <PostGig />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/skill-exchange" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <SkillExchange />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
              {/* Redirect old typo URL */}
              <Route path="/skill-exchage" element={<Navigate to="/skill-exchange" replace />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Profile />
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Profile />
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/browse" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Browse />
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/gig-list" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <GigList />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/gigs/:id" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <GigDetails />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/user/:email" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <PublicProfile />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <Chat />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/session/:id" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <VideoSession />
                  </PageWrapper>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <PageWrapper>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
                      <AdminDashboard />
                    </div>
                  </PageWrapper>
                </ProtectedRoute>
              } />
            </Routes>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default App
