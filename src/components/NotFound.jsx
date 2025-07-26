import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGhost } from '@fortawesome/free-solid-svg-icons';

const NotFound = () => {
  return (
    <div className="flex justify-center items-center h-screen w-screen text-gray-700 dark:text-gray-400 font-semibold bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center mb-40">
        <div className="flex items-center justify-center text-6xl font-bold mb-6">
          <FontAwesomeIcon icon={faGhost} className="mr-6 mt-2" />
          <h1>404 Not Found</h1>
        </div>
        <Link to="/login" className="bg-purple-600 text-white px-6 py-2 text-lg rounded-full hover:bg-purple-700 transition">Login</Link>
      </div>
    </div>
  )
}

export default NotFound;