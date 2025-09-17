import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NoteProvider } from "./context/NoteContext";
import { TagProvider, useTagContext } from './context/TagContext';
import { SidebarProvider } from './context/SidebarContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { UserProvider } from "./context/UserContext";
import ProtectedRoute from "./ProtectedRoute";
import Home from './components/Intro/Home';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Notes from './components/Notes/Notes';
import Archive from "./components/Notes/Archive";
import Trash from "./components/Notes/Trash";
import Search from "./components/Notes/Search";
import TaggedNotes from "./components/Notes/TaggedNotes";
import NotFound from './components/NotFound';

// Component that renders routes with access to TagContext
function AppRoutes() {
  const { globalTags } = useTagContext();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path='/' element={<Home />} />

      {/* Protected Routes */}
      <Route path="/notes" element={
        <ProtectedRoute>
          <SidebarProvider><ViewModeProvider>
            <Notes />
          </ViewModeProvider></SidebarProvider>
        </ProtectedRoute>
      } />
      <Route path="/archive" element={
        <ProtectedRoute>
          <SidebarProvider><ViewModeProvider>
            <Archive />
          </ViewModeProvider></SidebarProvider>
        </ProtectedRoute>
      } />
      <Route path="/trash" element={
        <ProtectedRoute>
          <SidebarProvider><ViewModeProvider>
            <Trash />
          </ViewModeProvider></SidebarProvider>
        </ProtectedRoute>
      } />
      <Route path="/search" element={
        <ProtectedRoute>
          <SidebarProvider><ViewModeProvider>
            <Search />
          </ViewModeProvider></SidebarProvider>
        </ProtectedRoute>
      } />

      {/* Dynamic tag routes */}
      {globalTags && globalTags.map(({ name }) => (
        <Route key={name} path={`/label/${encodeURIComponent(name)}`} element={
          <ProtectedRoute>
            <SidebarProvider><ViewModeProvider>
              <TaggedNotes tagName={name} />
            </ViewModeProvider></SidebarProvider>
          </ProtectedRoute>
        } />
      ))}

      {/* Undefined Routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <UserProvider>
          <NoteProvider>
            <TagProvider>
              <AppRoutes />
            </TagProvider>
          </NoteProvider>
        </UserProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;