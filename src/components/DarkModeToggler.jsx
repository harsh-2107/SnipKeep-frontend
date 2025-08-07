import { useDarkMode } from '../context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdjust } from '@fortawesome/free-solid-svg-icons';

const DarkModeToggler = () => {
  const { darkMode, setDarkMode } = useDarkMode();
  return (
    <button onClick={() => { setDarkMode(!darkMode) }} className="relative group flex flex-col justify-center items-center mx-2 rounded-full cursor-pointer">
      <FontAwesomeIcon icon={faAdjust} className={`text-xl sm:text-2xl md:text-3xl ${darkMode ? "text-white hover:text-gray-200 -scale-x-100" : "text-gray-600 hover:text-gray-700"} `} />
      <span className="absolute bg-[#22262ce8] px-2.5 pt-0.5 pb-1 rounded-sm mt-18 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">{darkMode ? "Light mode" : "Dark mode"}</span>
    </button>
  )
}

export default DarkModeToggler;