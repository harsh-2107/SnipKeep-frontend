import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useUserContext } from "../context/UserContext"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faDoorOpen, faPenToSquare, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Profile = () => {
  // useForm for Username Update Form
  const {
    register: registerUsername,
    handleSubmit: handleSubmitUsername,
    formState: { errors: errorsUsername, isSubmitting: isSubmittingUsername },
    reset: resetUsernameForm,
  } = useForm({
    defaultValues: {
      newName: name
    }
  });

  // useForm for Password Update Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword },
  } = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: ""
    }
  });
  
  const { name, email, visible, changeName, changePassword, closeProfile } = useUserContext();
  const [editName, setEditName] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const nameInputRef = useRef(null);
  const oldPassInputRef = useRef(null);
  const newPassInputRef = useRef(null);
  const confirmPassInputRef = useRef(null);

  const oldPassword = watchPassword("oldPassword");
  const newPassword = watchPassword("newPassword");

  // Handle user name updation
  const handleNameChange = async (data) => {
    await changeName(data);
    setEditName(false);
  }

  // Handle password updation
  const handlePasswordChange = async (data) => {
    const success = await changePassword(data);
    if (success) {
      setEditPassword(false);
    }
  }

  // Set cursor at input end
  const setFocusAtInputEnd = (ref) => {
    if (ref?.current) {
      setTimeout(() => {
        const inputElement = ref.current;
        const valueLength = inputElement.value.length;
        inputElement.focus();
        inputElement.setSelectionRange(valueLength, valueLength);
      }, 0);
    }
  }

  // Sign out user by clearing their token and redirecting to the login page
  const signout = () => {
    localStorage.removeItem('token');
    navigate("/login", { replace: true });
  }

  // Reset the change name form and focus at the end of new name input when the user clicks on edit name button
  useEffect(() => {
    if (editName) {
      resetUsernameForm({
        newName: name
      })
      setFocusAtInputEnd(nameInputRef);
    }
  }, [editName])

  // Reset the change password form and focus at the old password input when the user clicks on change password button
  useEffect(() => {
    if (editPassword) {
      resetPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      })
      oldPassInputRef.current.focus();
    }
  }, [editPassword])

  return (
    <div className={`fixed sm:w-md px-6 py-3 bg-purple-50 rounded-lg shadow-sm/20 dark:bg-gray-700 z-10 right-1 sm:right-2
      transition-all duration-300 ease-out transform
      ${!visible ? "translate-y-0 opacity-0" : "translate-y-15 xl:translate-y-17 opacity-100"}`}>
      <div className="flex items-center justify-between pb-2 border-b-2 border-gray-200 dark:border-gray-600">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Profile</h1>
        <button onClick={() => closeProfile()} className="text-xl px-3 py-1 rounded-full text-gray-500 bg-transparent hover:bg-purple-100 dark:hover:bg-gray-600 dark:text-white"><FontAwesomeIcon icon={faXmark} /></button>
      </div>
      {/* Name */}
      <div className="grid grid-cols-[1fr_auto_4fr] text-xl items-center mt-2">
        <h2 className="text-gray-900 font-bold dark:text-gray-300">Name</h2>
        <h2 className="text-gray-900 font-bold dark:text-gray-300 pr-4">:</h2>
        {editName ?
          <form className="flex items-center" onSubmit={handleSubmitUsername(handleNameChange)}>
            <div className="flex items-center justify-between text-md bg-gray-50 border border-gray-300 rounded-full focus-within:ring-purple-500 focus-within:border-purple-500 pl-4 pr-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:focus-within:ring-purple-500 dark:focus-within:border-purple-500 mr-2">
              <input type="text" {...registerUsername("newName", { // Use registerUsername
                required: "New name is required",
                minLength: { value: 2, message: "Name must be at least 2 letters" },
                maxLength: { value: 15, message: "Name must be at most 15 letters" },
                pattern: { value: /^[A-Za-z\s]+$/, message: "Name must contain only alphabets and spaces" },
                validate: (value) => value.trim() !== name.trim() || "New name cannot be the same as current name"
              })}
                ref={(e) => {
                  registerUsername("newName").ref(e);
                  nameInputRef.current = e;
                }}
                placeholder="Enter new name" className="bg-transparent w-full py-1.5 text-gray-800 dark:text-white outline-none transition-colors mr-1" autoComplete="off" />
              <FontAwesomeIcon onClick={() => setEditName(false)} icon={faXmark} className="px-2 py-1 rounded-full text-gray-900 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-500" autoComplete="off" />
            </div>
            <button type="submit" className="text-sm px-3 py-2 rounded-full text-white bg-purple-600 hover:bg-purple-700" disabled={isSubmittingUsername}>
              <FontAwesomeIcon icon={faPenToSquare} /></button>
          </form>
          :
          <div className="flex items-center justify-between">
            <h2 className="text-gray-800 dark:text-white my-2">{name}</h2>
            <button onClick={() => { setEditName(true); }} className="text-sm px-3 py-2 rounded-full text-white bg-purple-600 hover:bg-purple-700"><FontAwesomeIcon icon={faPenToSquare} /></button>
          </div>
        }
      </div>
      {/* Name error */}
      <div className={`${editName ? "flex" : "invisible"} items-center justify-center w-full`}>
        <p className="ml-7 text-xs text-red-600 dark:text-red-500 select-none">{errorsUsername.newName?.message || "\u00A0"}</p>
      </div>
      {/* Email */}
      <div className="grid grid-cols-[1fr_auto_4fr] text-xl pb-4 items-center">
        <h2 className="text-gray-900 font-bold dark:text-gray-300">Email</h2>
        <h2 className="text-gray-900 font-bold dark:text-gray-300 pr-4">:</h2>
        <h2 className="text-gray-800 dark:text-white">{email}</h2>
      </div>
      {!editPassword && (
        <button onClick={() => setEditPassword(true)} className="flex items-center justify-center w-full py-2 text-lg font-semibold text-white bg-purple-600 rounded-full hover:bg-purple-700 mb-4"><span>Change Password</span></button>
      )}
      {/* Change password */}
      <div className="border-t border-gray-300 dark:border-gray-600">
        {editPassword && (
          <>
            <div className="flex items-center justify-between mt-3">
              <div className="text-xl text-gray-900 font-bold dark:text-gray-300">Change Password</div>
              <FontAwesomeIcon icon={faXmark} onClick={() => setEditPassword(false)} className="px-2 py-1.5 rounded-full text-gray-600 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-500" />
            </div>
            <form onSubmit={handleSubmitPassword(handlePasswordChange)}>
              {/* Old Password */}
              <div className="my-2">
                <div className="flex items-center justify-between text-md bg-gray-50 border border-gray-300 rounded-full focus-within:ring-purple-500 focus-within:border-purple-500 w-full px-5 dark:bg-gray-700 dark:border-gray-600 dark:focus-within:ring-purple-500 dark:focus-within:border-purple-500">
                  <input {...registerPassword("oldPassword", {
                    required: "Old password is required",
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
                      message:
                        "Password must be at least 6 characters long and include a capital letter, a number, and a symbol",
                    },
                  })} ref={(e) => {
                    registerPassword("oldPassword").ref(e);
                    oldPassInputRef.current = e;
                  }} type={`${showOldPassword ? "text" : "password"}`} placeholder="Enter old Password" className="bg-transparent w-full py-2 text-gray-900 placeholder-gray-800 dark:placeholder-gray-400 dark:text-white outline-none transition-colors" autoComplete="off" />
                  <FontAwesomeIcon onClick={() => {
                    setShowOldPassword(!showOldPassword);
                    setFocusAtInputEnd(oldPassInputRef);
                  }} icon={showOldPassword ? faEyeSlash : faEye} className="p-2 rounded-full text-gray-800 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-500" />
                </div>
                <p className="ml-2 text-xs text-red-600 dark:text-red-500 select-none">{errorsPassword.oldPassword?.message || "\u00A0"}</p>
              </div>
              {/* New Password */}
              <div className="my-2">
                <div className="flex items-center justify-between text-md bg-gray-50 border border-gray-300 rounded-full focus-within:ring-purple-500 focus-within:border-purple-500 w-full px-5 dark:bg-gray-700 dark:border-gray-600 dark:focus-within:ring-purple-500 dark:focus-within:border-purple-500">
                  <input {...registerPassword("newPassword", {
                    required: "New password is required",
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
                      message:
                        "Password must be at least 6 characters long and include a capital letter, a number, and a symbol",
                    },
                    validate: (value) => value !== oldPassword || "New password cannot be the same as old password"
                  })} ref={(e) => {
                    registerPassword("newPassword").ref(e);
                    newPassInputRef.current = e;
                  }} type={`${showNewPassword ? "text" : "password"}`} placeholder="Enter new Password" className="bg-transparent w-full py-2 text-gray-900 placeholder-gray-800 dark:placeholder-gray-400 dark:text-white outline-none transition-colors" autoComplete="off" />
                  <FontAwesomeIcon onClick={() => {
                    setShowNewPassword(!showNewPassword);
                    setFocusAtInputEnd(newPassInputRef);
                  }} icon={showNewPassword ? faEyeSlash : faEye} className="p-2 rounded-full text-gray-800 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-500" />
                </div>
                <p className="ml-2 text-xs text-red-600 dark:text-red-500 select-none">{errorsPassword.newPassword?.message || "\u00A0"}</p>
              </div>
              {/* Confirm New Password */}
              <div className="my-2">
                <div className="flex items-center justify-between text-md bg-gray-50 border border-gray-300 rounded-full focus-within:ring-purple-500 focus-within:border-purple-500 w-full px-5 dark:bg-gray-700 dark:border-gray-600 dark:focus-within:ring-purple-500 dark:focus-within:border-purple-500">
                  <input {...registerPassword("confirmNewPassword", {
                    required: "Confirm new password is required",
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
                      message:
                        "Password must be at least 6 characters long and include a capital letter, a number, and a symbol",
                    },
                    validate: (value) => value === newPassword || "Passwords do not match"
                  })} ref={(e) => {
                    registerPassword("confirmNewPassword").ref(e);
                    confirmPassInputRef.current = e;
                  }} type={`${showConfirmPassword ? "text" : "password"}`} placeholder="Enter new Password" className="bg-transparent w-full py-2 text-gray-900 placeholder-gray-800 dark:placeholder-gray-400 dark:text-white outline-none transition-colors" autoComplete="off" />
                  <FontAwesomeIcon onClick={() => {
                    setShowConfirmPassword(!showConfirmPassword);
                    setFocusAtInputEnd(confirmPassInputRef);
                  }} icon={showConfirmPassword ? faEyeSlash : faEye} className="p-2 rounded-full text-gray-800 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-500" />
                </div>
                <p className="ml-2 text-xs text-red-600 dark:text-red-500 select-none">{errorsPassword.confirmNewPassword?.message || "\u00A0"}</p>
              </div>
              <button type="submit" className="flex items-center justify-center w-full py-2 text-lg font-semibold text-white bg-purple-600 rounded-full hover:bg-purple-700 mb-4" disabled={isSubmittingPassword}><span>Change Password</span></button>
            </form>
          </>
        )}
      </div>
      {/* Signout button */}
      <div className="pt-4 pb-1.5 border-t-2 border-gray-200 dark:border-gray-600">
        <button onClick={() => signout()} className="flex items-center justify-center w-full py-3 text-lg font-semibold text-white bg-purple-600 rounded-full hover:bg-purple-700"><FontAwesomeIcon icon={faDoorOpen} className="mr-3" /><span>Signout</span></button>
      </div>
    </div>
  )
}

export default Profile;