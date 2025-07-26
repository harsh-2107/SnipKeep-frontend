import { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext('false');

export const SidebarProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(localStorage.getItem('sidebarOpen') === 'true');

  // Update the slidebarOpen value in local storage whenever it changes
  useEffect(() => {
    if (sidebarOpen) {
      localStorage.setItem('sidebarOpen', 'true');
    } else {
      localStorage.setItem('sidebarOpen', 'false');
    }
  }, [sidebarOpen]);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebarContext = () => useContext(SidebarContext);