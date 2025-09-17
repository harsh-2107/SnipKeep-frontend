import React from 'react';

const Confirm = ({ text="Delete note forever?", onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-[#3130308c]">
      <div className="relative p-4 sm:px-6 pt-5 w-[95%] max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-lg">
        <h2 className="text-md text-gray-800 dark:text-white">{text}</h2>
        <div className="flex items-center justify-end mt-5 gap-4">
          <button onClick={() => onClose(false)}
            className="font-semibold dark:bg-transparent text-gray-700 dark:text-white px-4 py-2 rounded-full hover:bg-purple-50 dark:hover:bg-gray-800 transition">Cancel</button>
          <button onClick={() => onClose(true)}
            className="font-semibold dark:bg-transparent text-purple-700 dark:text-white px-4 py-2 rounded-full hover:bg-purple-50 dark:hover:bg-gray-800 transition">Delete</button>
        </div>
      </div>
    </div>
  )
}

export default Confirm;