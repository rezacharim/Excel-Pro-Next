"use client";

import { ElementType, useState } from "react";
import AdminProfileUpdate from "@/components/molecules/AdminProfile/AdminProfile";
import {
  FiUser,
  // FiSettings,
  // FiCreditCard,
  // FiShield,
  // FiUsers,
  // FiBell,
} from "react-icons/fi";

interface TabItem {
  id: string;
  label: string;
  icon: ElementType;
}

const Setting = () => {
  const [activeTab, setActiveTab] = useState<string>("profile");

  // Tab configuration
  const tabs: TabItem[] = [
    { id: "profile", label: "Profile", icon: FiUser },
    // { id: "security", label: "Security", icon: FiShield },
    // { id: "notifications", label: "Notifications", icon: FiBell },
    // { id: "billing", label: "Billing", icon: FiCreditCard },
    // { id: "team", label: "Team", icon: FiUsers },
    // { id: "settings", label: "Settings", icon: FiSettings },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Admin Settings
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your profile, security, and account preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "profile" && <AdminProfileUpdate />}

          {activeTab === "security" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Security Settings</h2>
              <p className="text-gray-500">
                This section is not implemented yet.
              </p>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">
                Notification Preferences
              </h2>
              <p className="text-gray-500">
                This section is not implemented yet.
              </p>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Billing Information</h2>
              <p className="text-gray-500">
                This section is not implemented yet.
              </p>
            </div>
          )}

          {activeTab === "team" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Team Management</h2>
              <p className="text-gray-500">
                This section is not implemented yet.
              </p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">General Settings</h2>
              <p className="text-gray-500">
                This section is not implemented yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setting;
