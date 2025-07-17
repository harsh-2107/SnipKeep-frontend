import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './components/Intro/Home'
import Login from './components/Auth/Login'
import SignUp from './components/Auth/SignUp'
import Notes from './components/Notes/Notes'
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={
            isAuthenticated ? <Navigate to='/notes' replace /> : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/notes" element={
            isAuthenticated ? <Notes /> : <Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </>
  )
}

export default App
