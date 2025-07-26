import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNoteContext } from "../context/NoteContext";
import { useUserContext } from "../context/UserContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faMagnifyingGlass, faArrowLeft, faXmark, faLightbulb, faFileArchive, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import DarkModeToggler from './DarkModeToggler';
import Profile from "./Profile";
import Alert from "./Alert";

const navItems = [
  { name: "Notes", icon: faLightbulb, path: "/notes" },
  { name: "Archive", icon: faFileArchive, path: "/archive" },
  { name: "Bin", icon: faTrash, path: "/trash" }
];

const Header = ({ isOpen, toggleSidebar }) => {
  const [searchText, setSearchText] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { search } = useNoteContext();
  const { profileOpen, setProfileOpen, closeProfile, alertMessage } = useUserContext();

  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const [lastVisitedPrimaryPath, setLastVisitedPrimaryPath] = useState(
    localStorage.getItem('lastVisitedPrimaryPath') || '/notes' // Default to /notes
  );

  // Focus the input and navigate to search page
  const handleInputFocus = () => {
    if (location.pathname !== "/search") {
      navigate("/search");
    }
  };

  // Update the URL text query parameter value
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchText(query);
    navigate(`/search?text=${encodeURIComponent(query)}`, { replace: true });
  };

  // Clear search and navigate back to last visited primary path
  const clearSearch = () => {
    setSearchText("");
    if (location.pathname === "/search") {
      navigate(lastVisitedPrimaryPath, { replace: true });
    }
  };

  // Close mobile search bar
  const closeMobileSearch = () => {
    setShowMobileSearch(false);
    clearSearch();
  };

  // Effect to update lastVisitedPrimaryPath when location changes
  useEffect(() => {
    // Only update if the current path is NOT the search path
    if (location.pathname !== "/search") {
      setLastVisitedPrimaryPath(location.pathname);
      localStorage.setItem('lastVisitedPrimaryPath', location.pathname);
    }
  }, [location.pathname]);

  // Open and Focus desktop or mobile input after navigating to /search
  useEffect(() => {
    if (location.pathname === "/search") {
      setTimeout(() => {
        if (window.innerWidth >= 1024) {
          inputRef.current?.focus();
        } else {
          setShowMobileSearch(true);
          mobileInputRef.current?.focus();
        }
      }, 1);
    }
  }, [location.pathname]);

  // Set searchText equal to text query parameter value if they are not same
  useEffect(() => {
    if (location.pathname === "/search") {
      const params = new URLSearchParams(location.search);
      const textQuery = params.get('text') ? decodeURIComponent(params.get('text')) : "";
      textQuery !== searchText && setSearchText(textQuery);
    }
  }, [location.search])

  // Call search function which fetches data from the server
  useEffect(() => {
    if (location.pathname === "/search") {
      search(searchText);
    }
  }, [searchText])

  return (
    <>
      <header className="flex justify-between items-center px-2.5 xl:py-1 border-b-2 border-b-gray-200 dark:border-b-gray-800 fixed top-0 bg-white dark:bg-gray-900 z-20 w-full transition-colors">
        {/* Hamburger and logo */}
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer">
            <FontAwesomeIcon icon={faBars} className="px-4.5 py-3.5 text-xl text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-2xl xl:text-3xl font-bold ml-4 text-purple-600 cursor-pointer"><Link to="/notes">SnipKeep</Link></h1>
        </div>
        {/* Large screens and up (>= lg): show full search bar */}
        <div className="hidden lg:flex mx-6 items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-0.5 focus-within:bg-white focus-within:shadow-sm/20 dark:focus-within:bg-gray-700 transition-shadow z-30">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className={`p-3 rounded-full cursor-pointer text-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 mr-2
              ${location.pathname !== "/search" ? "dark:hover:bg-gray-700" : "dark:hover:bg-gray-600"}`}
            onClick={() => { location.pathname !== "/search" ? handleInputFocus() : inputRef.current?.focus() }} />
          <input
            type="text"
            placeholder="Search"
            ref={inputRef}
            value={searchText}
            onFocus={handleInputFocus}
            onChange={(e) => handleSearchChange(e)}
            className="bg-transparent focus:outline-none w-lg xl:w-xl text-gray-800 text-md py-1 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          <FontAwesomeIcon
            icon={faXmark}
            onClick={clearSearch}
            className={`px-3 py-2.5 rounded-full text-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer 
              ${location.pathname !== "/search" ? "invisible" : ""}`}
          />
        </div>
        {/* Smaller screens (< lg): just search icon aligned right */}
        <div className="lg:hidden ml-auto flex items-center">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            onClick={handleInputFocus}
            className="p-3 mt-0.5 rounded-full text-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          />

          {/* Mobile Search Overlay */}
          {showMobileSearch && (
            <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 flex items-center px-3 py-2 z-50 shadow-md gap-2">
              <FontAwesomeIcon
                icon={faArrowLeft}
                onClick={closeMobileSearch}
                className="p-2 rounded-full text-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              />
              <input
                type="text"
                placeholder="Search"
                ref={mobileInputRef}
                value={searchText}
                onChange={(e) => handleSearchChange(e)}
                className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-white text-md placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 xl:gap-4">
          <DarkModeToggler />
          <button onClick={() => !profileOpen ? setProfileOpen(true) : closeProfile()} className="flex items-center justify-center px-2.5 sm:px-4 md:px-2.5 xl:px-5 py-2 mr-1 text-lg font-semibold text-white bg-purple-600 rounded-full hover:bg-purple-700 cursor-pointer"><FontAwesomeIcon icon={faUser} className="xl:pr-2" /><span className="hidden xl:block">Profile</span></button>
        </div>
      </header >

      {/* Sidebar */}
      <aside className={`${isOpen ? "w-65" : "w-18"} transition-all overflow-hidden bg-white dark:bg-gray-800 h-screen fixed top-0 z-10`} >
        <ul className="space-y-1 pt-14 xl:pt-17">
          {navItems.map(({ name, icon, path }) => (
            <li key={name}>
              <Link
                to={path}
                className={`flex items-center rounded-r-full transition-colors
                  ${isOpen ? (location.pathname === path || (location.pathname === "/search" && path === lastVisitedPrimaryPath)) ? 'px-7 py-3 bg-purple-300 dark:bg-purple-500 dark:text-white' : 'px-7 py-3 hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700'
                    : 'px-2.5'
                  }`}>
                <FontAwesomeIcon icon={icon} className={`text-xl mr-6 rounded-full ${!isOpen
                  ? (location.pathname === path || (location.pathname === "/search" && path === lastVisitedPrimaryPath)) ? 'px-4.5 py-3.5 text-gray-800 bg-purple-300 dark:bg-purple-500 dark:text-white' : 'px-4.5 py-3.5 text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white' : ''}`} />
                {isOpen && <span className='text-md font-semibold'>{name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {profileOpen && <Profile />}

      {alertMessage && <Alert text={alertMessage} color="purple" />}
    </>
  )
}

export default Header;