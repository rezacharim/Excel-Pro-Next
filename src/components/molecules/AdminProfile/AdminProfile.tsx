"use client";

import { useState, useEffect } from "react";
import { NextPage } from "next";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEdit2,
  FiSave,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import Cookies from "js-cookie";

// Admin entity interface
interface Admin {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// UpdateAuthDto interface matching your backend DTO
interface UpdateAuthDto {
  username?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

// Notification state interface
interface NotificationState {
  show: boolean;
  type: "success" | "error" | "";
  message: string;
}

// API error response interface
interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

// Helper function for date formatting that handles undefined/invalid dates
// const formatDate = (date: Date | string | undefined | null): string => {
//   if (!date) return "N/A";

//   try {
//     if (typeof date === "string") {
//       return new Date(date).toLocaleDateString();
//     }
//     return date.toLocaleDateString();
//   } catch (error) {
//     console.error("Error formatting date:", error);
//     return "Invalid date";
//   }
// };

const AdminProfileUpdate: NextPage = () => {
  // Auth token from cookies
  const authToken = Cookies.get("auth_token");

  // Get current admin ID from cookies or state management
  // For testing, we can use a default value
  const [adminId, setAdminId] = useState<number | null>(null);

  // States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: "",
    message: "",
  });

  // Admin data state
  const [adminData, setAdminData] = useState<Admin | null>(null);

  // Form data state
  const [formData, setFormData] = useState<UpdateAuthDto>({
    username: "",
    email: "",
    password: "",
    currentPassword: "",
  });

  // State to track if sensitive fields were changed (username, email, password)
  const [sensitiveFieldsChanged, setSensitiveFieldsChanged] =
    useState<boolean>(false);

  // Get admin ID on component mount
  useEffect(() => {
    // In a real app, you would get this from your auth context or user info
    // For now, we'll set it to 1 for testing
    setAdminId(2);
  }, []);

  // Fetch admin data when adminId is available
  useEffect(() => {
    if (!adminId) return;

    const fetchAdminData = async () => {
      if (!authToken) {
        setNotification({
          show: true,
          type: "error",
          message: "Authentication token is missing. Please log in again.",
        });
        setIsFetching(false);
        return;
      }

      try {
        setIsFetching(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/${adminId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = (await response.json()) as ApiErrorResponse;
          console.error("API Error Response:", errorData);
          throw new Error(errorData.message || "Failed to fetch admin data");
        }

        const data = (await response.json()) as Admin;

        // Convert date strings to Date objects if needed
        try {
          if (typeof data.createdAt === "string") {
            data.createdAt = new Date(data.createdAt);
          }
          if (typeof data.updatedAt === "string") {
            data.updatedAt = new Date(data.updatedAt);
          }
        } catch (error) {
          console.error("Error processing dates:", error);
          // Continue without throwing an error
        }

        setAdminData(data);
        setFormData({
          username: data.username,
          email: data.email,
          password: "",
          currentPassword: "",
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setNotification({
          show: true,
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch admin data",
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchAdminData();
  }, [authToken, adminId]);

  // Check if sensitive fields have been changed (matches backend logic)
  useEffect(() => {
    if (isEditing && adminData) {
      const isUsernameChanged = formData.username !== adminData.username;
      const isEmailChanged = formData.email !== adminData.email;
      const isPasswordChanged =
        formData.password !== undefined && formData.password.length > 0;

      setSensitiveFieldsChanged(
        isUsernameChanged || isEmailChanged || isPasswordChanged
      );
    }
  }, [formData, adminData, isEditing]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear notification when user starts typing
    if (notification.show) {
      setNotification({ show: false, type: "", message: "" });
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing && adminData) {
      // If canceling edit, reset form data to original values
      setFormData({
        username: adminData.username,
        email: adminData.email,
        password: "",
        currentPassword: "",
      });
      setSensitiveFieldsChanged(false);
    }

    setIsEditing(!isEditing);
    setNotification({ show: false, type: "", message: "" });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authToken || !adminData || !adminId) {
      setNotification({
        show: true,
        type: "error",
        message: "Authentication token is missing or admin data not loaded",
      });
      return;
    }

    // Validate form for sensitive updates
    if (sensitiveFieldsChanged && !formData.currentPassword) {
      setNotification({
        show: true,
        type: "error",
        message:
          "Current password is required to update username, email, or password",
      });
      return;
    }

    // Create the update data object - only include changed fields
    const updateData: UpdateAuthDto = {};

    if (formData.username !== adminData.username)
      updateData.username = formData.username;
    if (formData.email !== adminData.email) updateData.email = formData.email;
    if (formData.password && formData.password.length > 0)
      updateData.password = formData.password;

    // If no changes, show notification and return
    if (Object.keys(updateData).length === 0) {
      setNotification({
        show: true,
        type: "error",
        message: "No changes detected",
      });
      return;
    }

    // Add current password if sensitive fields changed
    if (sensitiveFieldsChanged) {
      updateData.currentPassword = formData.currentPassword;
    }

    // API URL for update
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/${adminId}`;

    try {
      setIsLoading(true);

      // Using XMLHttpRequest instead of fetch
      const xhr = new XMLHttpRequest();
      xhr.open("PATCH", apiUrl, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

      // Add timer for debugging
      console.time("XHR Request");

      // Set timeout
      xhr.timeout = 30000; // 30 seconds

      // Handle timeout
      xhr.ontimeout = function () {
        console.timeEnd("XHR Request");
        console.error("XHR request timed out");
        setNotification({
          show: true,
          type: "error",
          message: "Request timed out. Please try again.",
        });
        setIsLoading(false);
      };

      // Handle error
      xhr.onerror = function () {
        console.timeEnd("XHR Request");
        console.error("XHR request failed");
        setNotification({
          show: true,
          type: "error",
          message: "Network error occurred. Please try again.",
        });
        setIsLoading(false);
      };

      // Handle response
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          // Request is complete
          console.timeEnd("XHR Request");

          try {
            // Process successful response
            if (xhr.status >= 200 && xhr.status < 300) {
              const responseData = JSON.parse(xhr.responseText) as Admin;

              // Convert dates
              try {
                if (typeof responseData.createdAt === "string") {
                  responseData.createdAt = new Date(responseData.createdAt);
                }
                if (typeof responseData.updatedAt === "string") {
                  responseData.updatedAt = new Date(responseData.updatedAt);
                }
              } catch (error) {
                console.error("Error processing dates:", error);
              }

              // Update admin data
              setAdminData(responseData);

              // Update form data and clear password fields
              setFormData({
                username: responseData.username,
                email: responseData.email,
                password: "",
                currentPassword: "",
              });

              // Show success message
              setNotification({
                show: true,
                type: "success",
                message: "Profile updated successfully",
              });

              // Exit edit mode
              setIsEditing(false);
              setSensitiveFieldsChanged(false);
            } else {
              // Process error
              let errorMessage = "Failed to update admin profile";
              try {
                const errorData = JSON.parse(xhr.responseText);
                errorMessage = errorData.message || errorMessage;
              } catch (e) {
                console.error("Error parsing error response:", e);
              }

              throw new Error(errorMessage);
            }
          } catch (error) {
            console.error("Error in XHR response handling:", error);

            // Show error message
            setNotification({
              show: true,
              type: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to update profile",
            });
          } finally {
            setIsLoading(false);
          }
        }
      };

      const requestBody = JSON.stringify(updateData);

      xhr.send(requestBody);
    } catch (error) {
      console.error("Error setting up XHR request:", error);

      setNotification({
        show: true,
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to update profile",
      });

      setIsLoading(false);
    }
  };

  // Show loading spinner while fetching initial data
  if (isFetching) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading admin profile...</span>
      </div>
    );
  }

  // If admin data couldn't be fetched, show error
  if (!adminData && !isFetching) {
    return (
      <div className="bg-red-50 p-6 rounded-lg">
        <div className="flex items-start gap-3 text-red-700">
          <FiAlertCircle size={24} className="mt-0.5" />
          <div>
            <h3 className="font-bold text-lg">Error Loading Profile</h3>
            <p>
              {notification.message ||
                "Could not load admin profile. Please try again later."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin Profile</h2>

        <button
          type="button"
          onClick={toggleEditMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isEditing
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-primary text-white hover:bg-red-600"
          }`}
        >
          {isEditing ? (
            <>
              <FiX size={16} />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <FiEdit2 size={16} />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Notification */}
      {notification.show && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            notification.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <FiAlertCircle size={20} className="mt-0.5" />
          <p>{notification.message}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Account Information
          </h3>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`pl-10 w-full py-2 px-3 border ${
                  isEditing ? "border-gray-300" : "border-gray-200 bg-gray-50"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" size={18} />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`pl-10 w-full py-2 px-3 border ${
                  isEditing ? "border-gray-300" : "border-gray-200 bg-gray-50"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
          </div>
        </div>

        {/* Password Section - Only visible in edit mode */}
        {isEditing && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Change Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" size={18} />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleInputChange}
                    className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              </div>

              {/* Current Password - Required for sensitive changes */}
              {sensitiveFieldsChanged && (
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword || ""}
                      onChange={handleInputChange}
                      className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Required for sensitive changes"
                    />
                  </div>
                  <p className="mt-1 text-sm text-red-500">
                    Required when updating username, email, or password
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button - Only visible in edit mode */}
        {isEditing && (
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave className="mr-2" size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Meta Information */}
        {/* {adminData && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <div>
                <span className="inline-block w-32">Account Created:</span>
                <span className="font-medium">
                  {formatDate(adminData.createdAt)}
                </span>
              </div>
              <div>
                <span className="inline-block w-32">Last Updated:</span>
                <span className="font-medium">
                  {formatDate(adminData.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        )} */}
      </form>
    </div>
  );
};

export default AdminProfileUpdate;