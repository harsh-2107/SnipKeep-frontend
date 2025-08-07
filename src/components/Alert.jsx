import { useState, useEffect, useCallback } from "react";
import { useNoteContext } from "../context/NoteContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

const Alert = ({ text, color, setAlertMessage }) => {
  const noteContext = useNoteContext();
  const finalSetAlertMessage = setAlertMessage ?? noteContext.setAlertMessage;
  const [visible, setVisible] = useState(false);

  // Clear the alert message after the animation ends
  const closeAlert = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      finalSetAlertMessage("");
    }, 501);
  }, [finalSetAlertMessage]);

  // Show alert with transition and auto-close after 8 seconds
  useEffect(() => {
    if (text) {
      setVisible(false);
      requestAnimationFrame(() => {
        setVisible(true); // Trigger transition after one frame
      });
      const timeout = setTimeout(() => {
        closeAlert();
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [text]);

  return (
    <div className={`flex justify-between items-center px-4 py-5 z-50 fixed mb-4 rounded-lg dark:bg-gray-900 border transition-all duration-500 ease-out transform
      ${!visible ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100 pointer-events-auto"}
      ${color === "purple" && "bottom-1 sm:bottom-2 left-2 sm:left-8 max-w-[97%] sm:min-w-lg text-purple-800 bg-purple-50 dark:text-purple-400 border-purple-400"}
      ${color === "red" && "bottom-1 sm:bottom-4.5 left-0 right-0 mx-auto max-w-[97%] sm:max-w-md text-red-800 bg-red-50 dark:text-red-400 border-red-400"}
    `} >
      <div className="ms-3 text-md font-medium">
        {text}
      </div>
      <button type="button" onClick={closeAlert}
        className={`ms-auto -mx-1.5 -my-1.5 ml-2 rounded-full p-1.5 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-900 dark:hover:bg-gray-800
        ${color === "purple" && "bg-purple-50 text-purple-500 hover:bg-purple-200 dark:text-purple-400"}
        ${color === "red" && "bg-red-50 text-red-500 hover:bg-red-200 dark:text-red-400"}`}
        aria-label="Close">
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  )
}

export default Alert;