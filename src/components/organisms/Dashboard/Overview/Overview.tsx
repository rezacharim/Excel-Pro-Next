"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  FiSliders,
  FiX,
  FiSearch,
  FiMenu,
  FiFileText,
  FiFile,
  FiEye,
} from "react-icons/fi";
import FilterModal from "@/components/molecules/FilterModal/FilterModal";
import Modal from "@/components/atoms/Modal/Modal"; // Update path as needed
import { getAllUsers } from "@/services/getAllUsers";
import Image from "next/image";

// Complete User interface based on your database schema
interface User {
  id: number;
  fullname: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  tShirtSize: string;
  shortSize: string;
  jacketSize: string;
  pantsSize: string;
  address: string;
  postalCode: string;
  city: string;
  emergencyContactName: string;
  emergencyPhone: string;
  experienceLevel: string;
  photoUrl: string;
  NationalIdCard: string;
  gender: "Male" | "Female";
  isTemporary?: boolean;
  parent_name: string;
  phone_number: string;
  email: string;
  current_skill_level: "Beginner" | "Intermediate" | "Advanced";
  player_positions?: "Goalkeeper" | "Defender" | "Midfielder" | "Striker";
  custom_position?: string;
  policy: boolean;
  stripeCustomerId?: string;
  activePlan?: string;
  currentSubscriptionEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  subscriptionCounter: number;
}

// Simplified interface for the table display
type Player = Pick<
  User,
  | "id"
  | "fullname"
  | "phone_number"
  | "gender"
  | "dateOfBirth"
  | "activePlan"
  | "photoUrl"
>;

const Overview = () => {
  // State for filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // State for filter modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // State for player detail modal
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);

  // State for all users from database (complete user data)
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // State for original player data (simplified view for the table)
  const [originalPlayers, setOriginalPlayers] = useState<Player[]>([]);

  // State for filtered players (what we'll actually display)
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);

  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);

  // variable for set cookie
  const savedToken = Cookies.get("auth_token")!;

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch users from database on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const users = await getAllUsers(savedToken);
        setAllUsers(users);

        // Create simplified player objects for the table view
        const simplifiedPlayers = users.map((user: User) => ({
          id: user.id,
          fullname: user.fullname,
          phone_number: user.phone_number,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          activePlan: user.activePlan || "No Plan",
          photoUrl: user.photoUrl,
        }));

        setOriginalPlayers(simplifiedPlayers);
        setFilteredPlayers(simplifiedPlayers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [savedToken]);

  // State for mobile menu and mobile filters
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // State for search
  const [searchQuery, setSearchQuery] = useState("");

  // Function to remove a filter
  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter));
  };

  // Function to apply filters to players data
  const applyFilters = (filters: string[]) => {
    setActiveFilters(filters);
  };

  // Function to open player details modal
  const openPlayerModal = (playerId: number) => {
    const player = allUsers.find((user) => user.id === playerId);
    if (player) {
      setSelectedPlayer(player);
      setIsPlayerModalOpen(true);
    }
  };

  // Function to convert date object to string
  const formatDate = (date: Date | undefined | null): string => {
    if (!date) return "N/A";
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  // Function to convert boolean to "Yes"/"No"
  const formatBoolean = (value: boolean | undefined): string => {
    if (value === undefined) return "N/A";
    return value ? "Yes" : "No";
  };

  // Function to properly export to CSV
  const exportToCSV = () => {
    if (allUsers.length === 0) {
      alert("No data to export");
      return;
    }

    // CSV header with all user fields
    const headers = [
      "ID",
      "Full Name",
      "Date of Birth",
      "Age",
      "Height",
      "Weight",
      "T-Shirt Size",
      "Short Size",
      "Jacket Size",
      "Pants Size",
      "Address",
      "Postal Code",
      "City",
      "Emergency Contact Name",
      "Emergency Phone",
      "Experience Level",
      "Gender",
      "Temporary",
      "Parent Name",
      "Phone Number",
      "Email",
      "Current Skill Level",
      "Player Position",
      "Custom Position",
      "Policy Agreement",
      "Stripe Customer ID",
      "Active Plan",
      "Subscription End Date",
      "Subscription Counter",
      "Created At",
      "Updated At",
    ];

    // Process each user to create CSV rows
    const csvRows = allUsers.map((user) => {
      // Calculate age from date of birth
      const age = calculateAge(user.dateOfBirth);

      return [
        user.id,
        `"${user.fullname.replace(/"/g, '""')}"`, // Escape quotes
        `"${user.dateOfBirth}"`,
        age,
        user.height,
        user.weight,
        user.tShirtSize,
        user.shortSize,
        user.jacketSize,
        user.pantsSize,
        `"${user.address.replace(/"/g, '""')}"`,
        `"${user.postalCode.replace(/"/g, '""')}"`,
        `"${user.city.replace(/"/g, '""')}"`,
        `"${user.emergencyContactName.replace(/"/g, '""')}"`,
        `"${user.emergencyPhone.replace(/"/g, '""')}"`,
        user.experienceLevel,
        user.gender,
        formatBoolean(user.isTemporary),
        `"${user.parent_name.replace(/"/g, '""')}"`,
        `"${user.phone_number.replace(/"/g, '""')}"`,
        `"${user.email.replace(/"/g, '""')}"`,
        user.current_skill_level,
        user.player_positions || "",
        user.custom_position
          ? `"${user.custom_position.replace(/"/g, '""')}"`
          : "",
        formatBoolean(user.policy),
        user.stripeCustomerId || "",
        user.activePlan || "",
        formatDate(user.currentSubscriptionEndDate),
        user.subscriptionCounter,
        formatDate(user.createdAt),
        formatDate(user.updatedAt),
      ].join(",");
    });

    // Combine header and rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Set up download
    link.href = url;
    link.setAttribute("download", "players_data.csv");
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Function to properly export to Excel
  const exportToExcel = () => {
    if (allUsers.length === 0) {
      alert("No data to export");
      return;
    }

    // Create Excel XML content
    let excelContent =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent +=
      "<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Players Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>";
    excelContent += "<body><table>";

    // Add headers
    excelContent += "<tr>";
    const headers = [
      "ID",
      "Full Name",
      "Date of Birth",
      "Age",
      "Height",
      "Weight",
      "T-Shirt Size",
      "Short Size",
      "Jacket Size",
      "Pants Size",
      "Address",
      "Postal Code",
      "City",
      "Emergency Contact Name",
      "Emergency Phone",
      "Experience Level",
      "Gender",
      "Temporary",
      "Parent Name",
      "Phone Number",
      "Email",
      "Current Skill Level",
      "Player Position",
      "Custom Position",
      "Policy Agreement",
      "Stripe Customer ID",
      "Active Plan",
      "Subscription End Date",
      "Subscription Counter",
      "Created At",
      "Updated At",
    ];

    headers.forEach((header) => {
      excelContent += `<th>${header}</th>`;
    });
    excelContent += "</tr>";

    // Add data rows
    allUsers.forEach((user) => {
      // Calculate age from date of birth
      const age = calculateAge(user.dateOfBirth);

      excelContent += "<tr>";

      // Add each user field as a cell
      excelContent += `<td>${user.id}</td>`;
      excelContent += `<td>${user.fullname}</td>`;
      excelContent += `<td>${user.dateOfBirth}</td>`;
      excelContent += `<td>${age}</td>`;
      excelContent += `<td>${user.height}</td>`;
      excelContent += `<td>${user.weight}</td>`;
      excelContent += `<td>${user.tShirtSize}</td>`;
      excelContent += `<td>${user.shortSize}</td>`;
      excelContent += `<td>${user.jacketSize}</td>`;
      excelContent += `<td>${user.pantsSize}</td>`;
      excelContent += `<td>${user.address}</td>`;
      excelContent += `<td>${user.postalCode}</td>`;
      excelContent += `<td>${user.city}</td>`;
      excelContent += `<td>${user.emergencyContactName}</td>`;
      excelContent += `<td>${user.emergencyPhone}</td>`;
      excelContent += `<td>${user.experienceLevel}</td>`;
      excelContent += `<td>${user.gender}</td>`;
      excelContent += `<td>${formatBoolean(user.isTemporary)}</td>`;
      excelContent += `<td>${user.parent_name}</td>`;
      excelContent += `<td>${user.phone_number}</td>`;
      excelContent += `<td>${user.email}</td>`;
      excelContent += `<td>${user.current_skill_level}</td>`;
      excelContent += `<td>${user.player_positions || ""}</td>`;
      excelContent += `<td>${user.custom_position || ""}</td>`;
      excelContent += `<td>${formatBoolean(user.policy)}</td>`;
      excelContent += `<td>${user.stripeCustomerId || ""}</td>`;
      excelContent += `<td>${user.activePlan || ""}</td>`;
      excelContent += `<td>${formatDate(user.currentSubscriptionEndDate)}</td>`;
      excelContent += `<td>${user.subscriptionCounter}</td>`;
      excelContent += `<td>${formatDate(user.createdAt)}</td>`;
      excelContent += `<td>${formatDate(user.updatedAt)}</td>`;

      excelContent += "</tr>";
    });

    // Close table and document
    excelContent += "</table></body></html>";

    // Create blob with proper Excel MIME type
    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Set up download
    link.href = url;
    link.setAttribute("download", "players_data.xls");
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Effect to filter players when activeFilters or searchQuery changes
  useEffect(() => {
    if (originalPlayers.length === 0) return;

    // Always start with the original player list
    let newFilteredPlayers = [...originalPlayers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      newFilteredPlayers = newFilteredPlayers.filter(
        (player) =>
          player.fullname.toLowerCase().includes(query) ||
          player.phone_number.includes(query)
      );
    }

    // Apply active filters
    if (activeFilters.length > 0) {
      // Age group filters - calculate age from dateOfBirth
      if (activeFilters.includes("U7-U12")) {
        newFilteredPlayers = newFilteredPlayers.filter((player) => {
          const age = calculateAge(player.dateOfBirth);
          return age >= 7 && age <= 12;
        });
      } else if (activeFilters.includes("U13-U15")) {
        newFilteredPlayers = newFilteredPlayers.filter((player) => {
          const age = calculateAge(player.dateOfBirth);
          return age >= 13 && age <= 15;
        });
      } else if (activeFilters.includes("U16-U18")) {
        newFilteredPlayers = newFilteredPlayers.filter((player) => {
          const age = calculateAge(player.dateOfBirth);
          return age >= 16 && age <= 18;
        });
      } else if (activeFilters.includes("18+")) {
        newFilteredPlayers = newFilteredPlayers.filter((player) => {
          const age = calculateAge(player.dateOfBirth);
          return age > 18;
        });
      }

      // Gender filters
      if (activeFilters.includes("Male")) {
        newFilteredPlayers = newFilteredPlayers.filter(
          (player) => player.gender === "Male"
        );
      } else if (activeFilters.includes("Female")) {
        newFilteredPlayers = newFilteredPlayers.filter(
          (player) => player.gender === "Female"
        );
      }

      // Plan filters - added new filter for activePlan
      if (activeFilters.includes("Premium")) {
        newFilteredPlayers = newFilteredPlayers.filter(
          (player) => player.activePlan === "Premium"
        );
      } else if (activeFilters.includes("Standard")) {
        newFilteredPlayers = newFilteredPlayers.filter(
          (player) => player.activePlan === "Standard"
        );
      } else if (activeFilters.includes("Basic")) {
        newFilteredPlayers = newFilteredPlayers.filter(
          (player) => player.activePlan === "Basic"
        );
      }

      // Sort filters
      if (activeFilters.includes("Newest")) {
        newFilteredPlayers = newFilteredPlayers.sort((a, b) => b.id - a.id);
      } else if (activeFilters.includes("Oldest")) {
        newFilteredPlayers = newFilteredPlayers.sort((a, b) => a.id - b.id);
      } else if (activeFilters.includes("A-Z")) {
        newFilteredPlayers = newFilteredPlayers.sort((a, b) =>
          a.fullname.localeCompare(b.fullname)
        );
      } else if (activeFilters.includes("Z-A")) {
        newFilteredPlayers = newFilteredPlayers.sort((a, b) =>
          b.fullname.localeCompare(a.fullname)
        );
      }
    }

    // Update the filtered players state
    setFilteredPlayers(newFilteredPlayers);
  }, [activeFilters, searchQuery, originalPlayers]);

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen rounded-lg">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between">
        <div className="flex flex-col mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Welcome To Excel Pro Dashboard
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Track, and manage your players
          </p>
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 w-full"
          >
            <FiMenu className="mr-2" size={18} />
            <span>Menu</span>
          </button>
        </div>

        {/* Action Buttons */}
        {/* <div
          className={`flex flex-col sm:flex-row gap-2 ${
            mobileMenuOpen ? "block" : "hidden sm:flex"
          }`}
        >
          <Button className="rounded-lg">
            <span>Add admin</span>
          </Button>
          <Button className="rounded-lg bg-white border border-gray-300 hover:bg-gray-200 text-gray-700">
            <span className="mr-2">👤</span>
            <span>Player of the month</span>
          </Button>
        </div> */}
      </div>

      {/* Filters & Search */}
      <div className="mb-4 flex flex-col md:flex-row md:justify-between gap-4">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-4 w-full"
          >
            <FiSliders className="mr-2" size={16} />
            <span>
              Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div
          className={`flex flex-wrap gap-2 ${
            mobileFiltersOpen ? "block" : "hidden md:flex"
          }`}
        >
          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1 md:px-4 md:py-2 text-sm md:text-base"
            >
              <span>{filter}</span>
              <button
                className="ml-2 text-gray-500"
                onClick={() => removeFilter(filter)}
              >
                <FiX size={16} />
              </button>
            </div>
          ))}
          <button
            className="flex items-center bg-white border border-gray-200 rounded-lg px-3 md:px-4 md:py-2 text-sm md:text-base"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <FiSliders className="mr-2" size={16} />
            <span>More filters</span>
          </button>
        </div>

        {/* Search and Export Section */}
        <div className="flex flex-col gap-2 w-full md:w-64">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full"
            />
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex-1"
            >
              <FiFileText className="mr-1" size={16} />
              CSV
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex-1"
            >
              <FiFile className="mr-1" size={16} />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Players Table with vertical scroll */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading players...</span>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-80">
              <table className="w-full min-w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap w-2/5">
                      Player
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap w-1/6">
                      Gender
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap w-1/6">
                      Age
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap w-1/6">
                      Active Plan
                    </th>
                    <th className="py-4 px-6 font-medium text-gray-600 text-center whitespace-nowrap w-1/6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player) => {
                      // Calculate age from date of birth
                      const age = calculateAge(player.dateOfBirth);

                      return (
                        <tr
                          key={player.id}
                          className="border-b border-gray-200"
                        >
                          <td className="py-4 px-6 whitespace-nowrap w-2/5">
                            <div className="flex items-center">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500 mr-2 md:mr-3 flex items-center justify-center text-white overflow-hidden">
                                {player.photoUrl ? (
                                  <Image
                                    src={player.photoUrl}
                                    alt={player.fullname}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  player.fullname.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-sm md:text-base">
                                  {player.fullname}
                                </div>
                                <div className="text-gray-500 text-xs md:text-sm">
                                  {player.phone_number}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm md:text-base w-1/6">
                            {player.gender}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm md:text-base w-1/6">
                            {age}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap w-1/6">
                            <span
                              className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm ${
                                player.activePlan === "Premium"
                                  ? "bg-purple-100 text-purple-800"
                                  : player.activePlan === "Standard"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {player.activePlan}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap w-1/6 text-center">
                            <button
                              onClick={() => openPlayerModal(player.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                              title="View player details"
                            >
                              <FiEye size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-500"
                      >
                        No players found matching the selected filters or search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 md:p-4 border-t border-gray-200 text-gray-500 text-xs md:text-sm">
              Showing {filteredPlayers.length} results
            </div>
          </>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilters={activeFilters}
        onApplyFilters={applyFilters}
      />

      {/* Player Details Modal */}
      {selectedPlayer && (
        <Modal
          isOpen={isPlayerModalOpen}
          onClose={() => setIsPlayerModalOpen(false)}
          title="Player Details"
        >
          <div className="space-y-6">
            {/* Player Photo */}
            <div className="flex justify-center">
              {selectedPlayer.photoUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <Image
                    src={selectedPlayer.photoUrl}
                    alt={selectedPlayer.fullname}
                    loading="lazy"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl">
                  {selectedPlayer.fullname.charAt(0)}
                </div>
              )}
            </div>

            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{selectedPlayer.fullname}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{selectedPlayer.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-medium">
                    {calculateAge(selectedPlayer.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{selectedPlayer.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Temporary Player</p>
                  <p className="font-medium">
                    {formatBoolean(selectedPlayer.isTemporary)}
                  </p>
                </div>
              </div>
            </div>

            {/* Physical Characteristics */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Physical Characteristics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Height</p>
                  <p className="font-medium">{selectedPlayer.height} cm</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium">{selectedPlayer.weight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">T-Shirt Size</p>
                  <p className="font-medium">{selectedPlayer.tShirtSize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Short Size</p>
                  <p className="font-medium">{selectedPlayer.shortSize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jacket Size</p>
                  <p className="font-medium">{selectedPlayer.jacketSize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pants Size</p>
                  <p className="font-medium">{selectedPlayer.pantsSize}</p>
                </div>
              </div>
            </div>

            {/* Contact Info Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Parent Name</p>
                  <p className="font-medium">
                    {selectedPlayer.parent_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{selectedPlayer.phone_number}</p>
                </div>
                <div className="break-words">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedPlayer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedPlayer.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Postal Code</p>
                  <p className="font-medium">{selectedPlayer.postalCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium">{selectedPlayer.city}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">
                    {selectedPlayer.emergencyContactName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedPlayer.emergencyPhone}</p>
                </div>
              </div>
            </div>

            {/* Training Info Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Training Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Experience Level</p>
                  <p className="font-medium">
                    {selectedPlayer.experienceLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Skill Level</p>
                  <p className="font-medium">
                    {selectedPlayer.current_skill_level}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium">
                    {selectedPlayer.player_positions ||
                      selectedPlayer.custom_position ||
                      "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Subscription
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Active Plan</p>
                  <p className="font-medium">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        selectedPlayer.activePlan === "Premium"
                          ? "bg-purple-100 text-purple-800"
                          : selectedPlayer.activePlan === "Standard"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedPlayer.activePlan || "No Plan"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subscription End Date</p>
                  <p className="font-medium">
                    {formatDate(selectedPlayer.currentSubscriptionEndDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stripe Customer ID</p>
                  <p className="font-medium">
                    {selectedPlayer.stripeCustomerId || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subscription Counter</p>
                  <p className="font-medium">
                    {selectedPlayer.subscriptionCounter}
                  </p>
                </div>
              </div>
            </div>

            {/* National ID Card */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                National ID Card
              </h3>
              <div className="flex justify-center">
                {selectedPlayer.NationalIdCard ? (
                  <div className="max-w-full h-40 overflow-hidden border border-gray-200 rounded-lg">
                    <Image
                      src={selectedPlayer.NationalIdCard}
                      width={180}
                      height={120}
                      loading="lazy"
                      alt="National ID Card"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-gray-500">No National ID Card available</p>
                )}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Legal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Policy Agreement</p>
                  <p className="font-medium">
                    {formatBoolean(selectedPlayer.policy)}
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Dates */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Registration Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">
                    {formatDate(selectedPlayer.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {formatDate(selectedPlayer.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Overview;
