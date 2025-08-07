import { createContext, useContext, useState, useEffect } from "react";

const ViewModeContext = createContext('grid');

export const ViewModeProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode') ?? 'grid');  

  // Update the noteView value in local storage whenever it changes
  useEffect(() => {
    if (viewMode === 'grid') {
      localStorage.setItem('viewMode', 'grid');
    } else {
      localStorage.setItem('viewMode', 'list');
    }
  }, [viewMode]);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export const useViewModeContext = () => useContext(ViewModeContext);