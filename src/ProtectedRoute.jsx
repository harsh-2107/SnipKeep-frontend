import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import { useUserContext } from './context/UserContext';
import { useNoteContext } from './context/NoteContext';
import { useTagContext } from './context/TagContext';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { getUser } = useUserContext();
  const { getAllNotes } = useNoteContext();
  const { fetchAllTags } = useTagContext();

  // On ProtectedRoute mount, check if user is authenticated by verifying token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      // If token found, verify it with the backend
      if (token) {
        try {
          const success = await getUser();
          if (success) {
            setIsAuthenticated(true); // If token is valid, set user as authenticated
            getAllNotes();
            fetchAllTags();
          } else {
            // If token is invalid, remove it from local storage and set user as unauthenticated
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Something went wrong:", error);
        }
      } else {
        setIsAuthenticated(false); // If token not found, set user as unauthenticated
      }
      setLoadingAuth(false);
    }

    checkAuth();
  }, [])

  if (loadingAuth) {
    // Show a loading page while checking authentication
    return (
      <div className="flex justify-center items-center h-screen w-screen text-gray-700 dark:text-gray-400 font-semibold gap-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center mb-42 gap-3">
          <LoadingSpinner />
          <h1 className="text-3xl">Loading...</h1>
        </div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;