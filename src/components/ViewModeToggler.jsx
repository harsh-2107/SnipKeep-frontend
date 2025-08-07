import { useViewModeContext } from "../context/ViewModeContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGrip, faListSquares } from '@fortawesome/free-solid-svg-icons';

const ViewModeToggler = () => {
  const { viewMode, setViewMode } = useViewModeContext();

  return (
    <div className="hidden sm:flex items-center">
      {viewMode === 'list' ?
        <button onClick={() => setViewMode('grid')} className="relative group flex flex-col justify-center items-center px-[0.97rem] py-3.5 rounded-full transition-colors bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-white cursor-pointer">
          <FontAwesomeIcon icon={faGrip} className="text-xl" />
          <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-18 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">Grid view</span>
        </button>
        :
        <button onClick={() => setViewMode('list')} className="relative group flex flex-col justify-center items-center p-3.5 rounded-full transition-colors bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-white cursor-pointer">
          <FontAwesomeIcon icon={faListSquares} className="text-xl" />
          <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-18 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">List view</span>
        </button>
      }
    </div>
  )
}

export default ViewModeToggler
