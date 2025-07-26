import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NoteProvider } from "./context/NoteContext";
import { SidebarProvider } from './context/SidebarContext';
import { UserProvider } from "./context/UserContext";
import ProtectedRoute from "./ProtectedRoute";
import Home from './components/Intro/Home';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Notes from './components/Notes/Notes';
import Archive from "./components/Notes/Archive";
import Trash from "./components/Notes/Trash";
import Search from "./components/Notes/Search";
import NotFound from './components/NotFound';

function App() {
  return (
    <>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path='/' element={<Home />} />

            {/* Protected Routes */}
            <Route path="/notes" element={
              <ProtectedRoute>
                <SidebarProvider><UserProvider><NoteProvider>
                  <Notes />
                </NoteProvider></UserProvider></SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/archive" element={
              <ProtectedRoute>
                <SidebarProvider><UserProvider><NoteProvider>
                  <Archive />
                </NoteProvider></UserProvider></SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/trash" element={
              <ProtectedRoute>
                <SidebarProvider><UserProvider><NoteProvider>
                  <Trash />
                </NoteProvider></UserProvider></SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <SidebarProvider><UserProvider><NoteProvider>
                  <Search />
                </NoteProvider></UserProvider></SidebarProvider>
              </ProtectedRoute>
            } />

            {/* Undefined Routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  )
}

export default App;