import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../Navbar';
import Alert from '../Alert';

const SignUp = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // Login if the user already has a valid token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Verify token with backend
        try {
          const getUserURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_GET_USER_ENDPOINT;
          const res = await fetch(getUserURL, {
            method: "POST",
            headers: {
              "auth-token": token,
            },
          });
          if (res.ok) {
            navigate("/notes", { replace: true });
          } else {
            // Token invalid or expired, clear it
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          setAlertMessage("Something went wrong");
        }
      }
    }

    checkAuth();
  }, []);

  // Handle sign up form submission
  const onSubmit = useCallback(async (credentials) => {
    try {
      const signUpURL = import.meta.env.VITE_API_BASE_URL + import.meta.env.VITE_SIGNUP_ENDPOINT;
      const res = await fetch(signUpURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      if (res.ok) {
        const json = await res.json();
        localStorage.setItem('token', json.authtoken);
        navigate("/notes", { replace: true });
      } else {
        const errorData = await res.json();
        setAlertMessage(errorData.error);
      }
    } catch (error) {
      setAlertMessage("Something went wrong. Please try again.");
    }
  }, []);

  // Set the cursor at input end (for password input when its visibility is toggled)
  const setFocusAtInputEnd = useCallback(() => {
    setTimeout(() => {
      const inputElement = passwordInputRef.current;
      const valueLength = inputElement.value.length;
      inputElement.focus();
      inputElement.setSelectionRange(valueLength, valueLength);
    }, 0);
  }, []);

  return (
    <>
      <Navbar />

      <form className="sm:max-w-md mx-auto py-20 max-w-xs" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="text-3xl sm:text-4xl font-bold ml-1 mb-8 sm:mb-10 text-gray-800 dark:text-purple-200">Create Account</h1>
        {/* Name input */}
        <div className="mb-3">
          <input {...register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Name must be at least 2 letters" },
            maxLength: { value: 15, message: "Name must be at most 15 letters" },
            pattern: { value: /^[A-Za-z]+$/, message: "Name must contain only alphabets" }
          })} type="text" placeholder="Enter Name" className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-full focus:ring-purple-500 focus:border-purple-500 block w-full px-5 py-3 dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500 outline-none transition-colors" autoComplete="off" />
          <p className="mt-2 ml-1 text-xs text-red-600 dark:text-red-500 select-none">{errors.name?.message || "\u00A0"}</p>
        </div>
        {/* Email input */}
        <div className="mb-3">
          <input {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Enter a valid email address",
            },
          })} type="email" placeholder="Enter Email" className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-full focus:ring-purple-500 focus:border-purple-500 block w-full px-5 py-3 dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500 outline-none transition-colors" autoComplete="off" />
          <p className="mt-2 ml-1 text-xs text-red-600 dark:text-red-500 select-none">{errors.email?.message || "\u00A0"}</p>
        </div>
        {/* Password input */}
        <div className="mb-3">
          <div className="flex items-center justify-center bg-gray-50 border border-gray-300 text-lg rounded-full focus-within:ring-purple-500 focus-within:border-purple-500 w-full px-5 dark:bg-gray-700 dark:border-gray-600 dark:focus-within:ring-purple-500 dark:focus-within:border-purple-500 transition-colors">
            <input {...register("password", {
              required: "Password is required",
              pattern: {
                value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/,
                message:
                  "Password must be at least 6 characters long and include a capital letter, a number, and a symbol",
              },
            }, passwordInputRef)} type={`${showPassword ? "text" : "password"}`} placeholder="Enter Password" className="py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full outline-none transition-none items-center select-none" />
            <FontAwesomeIcon onClick={() => {
              setShowPassword(!showPassword);
              setFocusAtInputEnd();
            }} icon={showPassword ? faEyeSlash : faEye} className="p-2 sm:p-3 rounded-full text-gray-900 dark:text-white hover:bg-purple-100 dark:hover:bg-gray-500" />
          </div>
          <p className="min-h-8 mt-2 ml-1 text-xs text-red-600 dark:text-red-500 select-none">{errors.password?.message || "\u00A0"}</p>
        </div>
        {/* Submit */}
        <button type="submit" className="mx-auto text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-purple-300 font-bold rounded-full text-lg w-full py-3 text-center" disabled={isSubmitting}>Submit</button>
      </form>

      {alertMessage && <Alert text={alertMessage} color="red" setAlertMessage={setAlertMessage} />}
    </>
  )
}

export default SignUp;