import Header from './Header';
import { useSidebarContext } from '../context/SidebarContext';

const DisplayHeader = () => {
  const { sidebarOpen, setSidebarOpen } = useSidebarContext();
  
  return (
    <div className="flex w-screen">
      <Header isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
    </div>
  )
}

export default DisplayHeader;