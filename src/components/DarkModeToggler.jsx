import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../context/ThemeContext';

const DarkModeToggler = () => {
    const {darkMode, setDarkMode} = useDarkMode();
    return (
        <button onClick={() => {setDarkMode(!darkMode)}} className="px-2 text-3xl hover:opacity-85">
            {darkMode? <FontAwesomeIcon icon={faSun} />: <FontAwesomeIcon icon={faMoon} />}
        </button>
    )
}

export default DarkModeToggler
