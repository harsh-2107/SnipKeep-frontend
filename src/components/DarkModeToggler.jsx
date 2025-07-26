import { useDarkMode } from '../context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const DarkModeToggler = () => {
  const { darkMode, setDarkMode } = useDarkMode();
  return (
    <button onClick={() => { setDarkMode(!darkMode) }} className="px-2 sm:text-3xl text-2xl rounded-full">
      {darkMode ? <FontAwesomeIcon icon={faSun} className="text-white hover:text-gray-200" /> : <FontAwesomeIcon icon={faMoon} className="text-gray-700 hover:text-gray-600" />}
    </button>
  )
}

export default DarkModeToggler;