import { createContext, useContext, useState, useEffect, useCallback } from "react";

const UserContext = createContext('false');

export const UserProvider = ({ children }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Change user's name by calling backend API
  const changeName = useCallback(async (user) => {
    try {
      const changeNameURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_CHANGE_USERNAME_ENDPOINT;
      const res = await fetch(changeNameURL, {
        method: "POST",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setName(updatedUser.name);
        setAlertMessage("Name updated successfully")
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Failed to update name. Please try again.");
    }
  }, []);

  // Change user's password by calling backend API
  const changePassword = useCallback(async (passwordObj) => {
    try {
      const changePasswordURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_CHANGE_PASSWORD_ENDPOINT;
      const { confirmNewPassword, ...updatedPasswordObj } = passwordObj;
      const res = await fetch(changePasswordURL, {
        method: "POST",
        headers: {
          "auth-token": localStorage.getItem("token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedPasswordObj)
      });
      if (res.ok) {
        setAlertMessage("Password updated successfully");
        return true;
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
        return false;
      }
    } catch (error) {
      setAlertMessage("Failed to update password. Please try again.");
      return false;
    }
  }, []);

  // Close profile modal with a short transition delay
  const closeProfile = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setProfileOpen(false)
    }, 401);
  }, []);

  // Get user name and email by calling backend API
  const getUser = useCallback(async () => {
    try {
      const getUserURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_GET_USER_ENDPOINT;
      const res = await fetch(getUserURL, {
        method: "POST",
        headers: {
          "auth-token": localStorage.getItem("token"),
        }
      });
      if (res.ok) {
        const user = await res.json();
        setName(user.name)
        setEmail(user.email);
        return true;
      }
      return false;
    } catch (error) {
      setAlertMessage("Failed to fetch user details");
      return false;
    }
  }, []);

  // Show the profile modal only after it's marked as open (for transition effect)
  useEffect(() => {
    if (profileOpen) {
      setTimeout(() => {
        setVisible(true);
      }, 0);
    }
  }, [profileOpen])

  // Clear alert message when the user navigates to a new page
  useEffect(() => {
    if (alertMessage) {
      setAlertMessage("");
    }
  }, [location.pathname])

  return (
    <UserContext.Provider value={{ name, email, getUser, setName, changeName, changePassword, profileOpen, setProfileOpen, visible, setVisible, closeProfile, alertMessage }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUserContext = () => useContext(UserContext);