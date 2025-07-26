import { Link } from "react-router-dom";
import DarkModeToggler from "./DarkModeToggler";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-4 sm:px-5 py-2 sm:py-2.5 shadow-md bg-white dark:bg-gray-800 dark:text-white transition-colors">
      <h1 className="text-2xl xl:text-3xl font-bold text-purple-600"><Link to="/">SnipKeep</Link></h1>
      <div className="flex items-center gap-3">
        <DarkModeToggler />
        <Link to="/login" className="sm:px-5 sm:py-2 px-4.5 py-2.5 text-sm sm:text-lg font-medium text-white bg-purple-600 rounded-full hover:bg-purple-700">Login</Link>
        <Link to="/signup" className="sm:px-5 sm:py-2 px-4.5 py-2.5 text-sm sm:text-lg font-medium text-white bg-purple-600 rounded-full hover:bg-purple-700">Sign Up</Link>
      </div>
    </nav>
  );
};

export default Navbar;