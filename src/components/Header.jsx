import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNoteContext } from "../context/NoteContext";
import { useUserContext } from "../context/UserContext";
import { useSidebarContext } from '../context/SidebarContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faMagnifyingGlass, faArrowLeft, faXmark, faLightbulb, faFileArchive, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import DarkModeToggler from './DarkModeToggler';
import ViewModeToggler from "./ViewModeToggler";
import Profile from "./Profile";
import Alert from "./Alert";

const navItems = [
  { name: "Notes", icon: faLightbulb, path: "/notes", textSize: "text-[1.4rem]", px: "px-[1.053rem]", py: "py-" },
  { name: "Archive", icon: faFileArchive, path: "/archive", textSize: "text-xl", px: "px-[1.09rem]", py: "py-" },
  { name: "Bin", icon: faTrash, path: "/trash", textSize: "text-xl", px: "px-[1.022rem]", py: "py-" }
];

const Header = () => {
  const [searchText, setSearchText] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { search, setOpenDropdownNoteId, setDropdownType } = useNoteContext();
  const { profileOpen, setProfileOpen, closeProfile, alertMessage } = useUserContext();
  const { sidebarOpen, setSidebarOpen } = useSidebarContext();

  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const [lastVisitedPrimaryPath, setLastVisitedPrimaryPath] = useState(
    localStorage.getItem('lastVisitedPrimaryPath') || '/notes' // Default to /notes
  );

  // Focus the input and navigate to search page
  const handleInputFocus = useCallback(() => {
    if (location.pathname !== "/search") {
      navigate("/search");
    }
  }, [location.pathname]);

  // Update the URL text query parameter value
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchText(query);
    navigate(`/search?text=${encodeURIComponent(query)}`, { replace: true });
  }, []);

  // Clear search and navigate back to last visited primary path
  const clearSearch = useCallback(() => {
    setSearchText("");
    if (location.pathname === "/search") {
      navigate(lastVisitedPrimaryPath, { replace: true });
    }
  }, [location.pathname, lastVisitedPrimaryPath]);

  // Close mobile search bar
  const closeMobileSearch = useCallback(() => {
    setShowMobileSearch(false);
    clearSearch();
  }, [clearSearch]);

  // Effect to listen to scroll event and set the value of isScrolled state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <div className="flex w-screen">
        <header className={`flex justify-between items-center px-2.5 xl:py-1 border-b-gray-200 dark:border-b-gray-800 fixed top-0 bg-white dark:bg-gray-900 z-20 w-full max-w-screen transition-colors ${isScrolled ? "border-b-0 shadow-md/30 shadow-gray-700 dark:shadow-gray-500" : "border-b-2"}`}>
          {/* Hamburger and logo */}
          <div className="flex items-center">
            <button onClick={() => { setOpenDropdownNoteId(null); setDropdownType(""); setSidebarOpen(!sidebarOpen) }} className="px-4.5 py-3.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer">
              <FontAwesomeIcon icon={faBars} className="text-xl text-gray-700 dark:text-gray-200" />
            </button>
            <h1 className="text-2xl xl:text-3xl font-bold ml-4 text-purple-600 cursor-pointer"><Link to="/notes">SnipKeep</Link></h1>
          </div>
          {/* Large screens and up (>= lg): show full search bar */}
          <div className="hidden lg:flex mx-6 items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-0.5 focus-within:bg-white focus-within:shadow-sm/20 dark:focus-within:bg-gray-700 transition-all z-30">
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
              className="bg-transparent focus:outline-none w-lg xl:w-xl text-gray-800 text-md py-1 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors"
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
              className="p-3 mt-0.5 rounded-full text-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
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
            <ViewModeToggler />
            <DarkModeToggler />
            <button onClick={() => !profileOpen ? setProfileOpen(true) : closeProfile()} className="flex items-center justify-center px-2.5 xl:px-5 py-2 mr-1 text-lg font-semibold text-white bg-purple-600 rounded-full hover:bg-purple-700 cursor-pointer"><FontAwesomeIcon icon={faUser} className="xl:pr-2" /><span className="hidden xl:block">Profile</span></button>
          </div>
        </header >

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-65 shadow-lg/40 md:shadow-none" : "w-18"} transition-all duration-100 overflow-hidden bg-white dark:bg-gray-800 h-screen fixed top-0 z-10`}>
          <ul className="space-y-1 pt-14 xl:pt-17">
            {navItems.map(({ name, icon, path, textSize, px }) => (
              <li key={name}>
                <Link
                  to={path}
                  className={`flex items-center rounded-r-full transition-colors
                  ${sidebarOpen ? (location.pathname === path || (location.pathname === "/search" && path === lastVisitedPrimaryPath)) ? 'px-7 py-3 bg-purple-300 dark:bg-purple-500 dark:text-white' : 'px-7 py-3 hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700'
                      : 'px-2.5'
                    }`}>
                  <FontAwesomeIcon icon={icon} className={`${textSize} mr-6 rounded-full ${!sidebarOpen
                    ? (location.pathname === path || (location.pathname === "/search" && path === lastVisitedPrimaryPath)) ? `${px} py-3.5 text-gray-800 bg-purple-300 dark:bg-purple-500 dark:text-white` : `${px} py-3.5 text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white` : ''}`} />
                  {sidebarOpen && <span className='text-md font-semibold'>{name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {profileOpen && <Profile />}

      {alertMessage && <Alert text={alertMessage} color="purple" />}
    </>
  )
}

export default Header;