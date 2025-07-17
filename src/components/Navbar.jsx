import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DarkModeToggler from "./DarkModeToggler";

const Navbar = () => {
    return (
        <nav className="flex items-center justify-between px-6 py-4 shadow-md bg-white dark:bg-gray-800 dark:text-white transition-colors">
            <h1 className="text-2xl font-bold text-purple-600">SnipKeep</h1>
            <div className="flex items-center gap-4">
                <DarkModeToggler />
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700">Login</Link>
                <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700">Sign Up</Link>
            </div>
        </nav>
    );
};

export default Navbar;
