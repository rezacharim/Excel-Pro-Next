"use client";

import { NextPage } from "next";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  FiSliders,
  FiX,
  FiSearch,
  FiFileText,
  FiClock,
  FiFile,
} from "react-icons/fi";
import FilterModal from "@/components/molecules/FilterModal/FilterModal";
import { debounce } from "lodash";
import { Button } from "@/components/atoms/Button/Button";

// Transfer interface based on the controller response
interface Transfer {
  id: number;
  amount: number;
  plan: string;
  status: string;
  token: string;
  expiryDate: Date;
  isFirstTimePayment: boolean;
  confirmedByUser: boolean;
  confirmedAt: Date | null;
  verifiedByAdmin: boolean;
  verifiedAt: Date | null;
  adminId: number | null;
  adminNotes: string | null;
  subscriptionEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  user?: {
    id: number;
    fullname: string;
    phone_number: string;
    email: string;
    isTemporary: boolean;
  };
  userName?: string;
}

enum TransferStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

enum SubscriptionPlan {
  FREE = "free",
  U5_U8 = "U5_U8",
  U9_U12 = "U9_U12",
  U13_U14 = "U13_U14",
  U15_U18 = "U15_U18",
}

interface VerifyTransferDto {
  isApproved: boolean;
  notes?: string;
}

const Payment: NextPage = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [allTransfers, setAllTransfers] = useState<Transfer[]>([]);
  const [pendingVerificationTransfers, setPendingVerificationTransfers] =
    useState<Transfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"pending" | "all">("pending");
  const [verificationNotes, setVerificationNotes] = useState<{
    [key: number]: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const savedToken = Cookies.get("auth_token")!;

  // Debounced search query
  const debouncedSetSearchQuery = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Fetch transfers from API
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setIsLoading(true);
        setIsPendingLoading(true);

        const pendingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transfer/admin/pending-verification`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
        );

        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingVerificationTransfers(pendingData);
        } else {
          throw new Error("Failed to fetch pending transfers");
        }

        const allResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transfer/admin`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
        );

        if (allResponse.ok) {
          const allData = await allResponse.json();
          setAllTransfers(allData);
          setFilteredTransfers(allData);
        } else {
          throw new Error("Failed to fetch all transfers");
        }
      } catch (error) {
        console.error("Error fetching transfers:", error);
        setErrorMessage("Failed to load transfers. Please try again.");
      } finally {
        setIsLoading(false);
        setIsPendingLoading(false);
      }
    };

    fetchTransfers();
  }, [savedToken]);

  // Filtering logic
  useEffect(() => {
    if (allTransfers.length === 0) return;

    let newFilteredTransfers = [...allTransfers];

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      newFilteredTransfers = newFilteredTransfers.filter(
        (transfer) =>
          (transfer.user?.fullname || transfer.userName || "")
            .toLowerCase()
            .includes(query) ||
          (transfer.user?.email || "").toLowerCase().includes(query) ||
          (transfer.user?.phone_number || "").toLowerCase().includes(query)
      );
    }

    // Apply active filters
    if (activeFilters.length > 0) {
      const statusFilters = [
        { name: "pending", value: TransferStatus.PENDING },
        { name: "confirmed", value: TransferStatus.CONFIRMED },
        { name: "verified", value: TransferStatus.VERIFIED },
        { name: "rejected", value: TransferStatus.REJECTED },
        { name: "expired", value: TransferStatus.EXPIRED },
      ];

      const planFilters = [
        { name: "free", value: SubscriptionPlan.FREE },
        { name: "u5-u8", value: SubscriptionPlan.U5_U8 },
        { name: "u9-u12", value: SubscriptionPlan.U9_U12 },
        { name: "u13-u14", value: SubscriptionPlan.U13_U14 },
        { name: "u15-u18", value: SubscriptionPlan.U15_U18 },
      ];

      // Apply status filters (allow multiple)
      const activeStatusFilters = statusFilters.filter((f) =>
        activeFilters.includes(f.name)
      );
      if (activeStatusFilters.length > 0) {
        newFilteredTransfers = newFilteredTransfers.filter((transfer) =>
          activeStatusFilters.some((f) => f.value === transfer.status)
        );
      }

      // Apply plan filters (allow multiple)
      const activePlanFilters = planFilters.filter((f) =>
        activeFilters.includes(f.name)
      );
      if (activePlanFilters.length > 0) {
        newFilteredTransfers = newFilteredTransfers.filter((transfer) =>
          activePlanFilters.some((f) => f.value === transfer.plan)
        );
      }

      // Apply boolean filters
      if (activeFilters.includes("first payment")) {
        newFilteredTransfers = newFilteredTransfers.filter(
          (transfer) => transfer.isFirstTimePayment
        );
      }

      if (activeFilters.includes("temporary user")) {
        newFilteredTransfers = newFilteredTransfers.filter(
          (transfer) => transfer.user?.isTemporary
        );
      }

      // Apply sorting (only one sort at a time)
      if (activeFilters.includes("newest")) {
        newFilteredTransfers.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (activeFilters.includes("oldest")) {
        newFilteredTransfers.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else if (activeFilters.includes("highest amount")) {
        newFilteredTransfers.sort((a, b) => b.amount - a.amount);
      } else if (activeFilters.includes("lowest amount")) {
        newFilteredTransfers.sort((a, b) => a.amount - b.amount);
      }
    }

    setFilteredTransfers(newFilteredTransfers);
  }, [activeFilters, searchQuery, allTransfers]);

  // Verify a transfer
  const verifyTransfer = async (transferId: number, isApproved: boolean) => {
    try {

      const verifyDto: VerifyTransferDto = {
        isApproved,
        notes: verificationNotes[transferId] || "",
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transfer/admin/verify/${transferId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(verifyDto),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify transfer");
      }

      const updatedTransfer = await response.json();

      setPendingVerificationTransfers((prev) =>
        prev.filter((t) => t.id !== transferId)
      );

      setAllTransfers((prev) =>
        prev.map((t) => (t.id === transferId ? updatedTransfer : t))
      );
      setFilteredTransfers((prev) =>
        prev.map((t) => (t.id === transferId ? updatedTransfer : t))
      );

      setVerificationNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[transferId];
        return newNotes;
      });

      setErrorMessage(null);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error verifying transfer:", error);
        setErrorMessage(
          error.message || "Failed to verify transfer. Please try again."
        );
      }
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter));
  };

  const applyFilters = (filters: string[]) => {
    setActiveFilters(filters);
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "—";
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString();
  };

  const exportToCSV = () => {
    const transfersToExport =
      viewMode === "pending" ? pendingVerificationTransfers : filteredTransfers;

    if (transfersToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Amount",
      "Plan",
      "Status",
      "Created Date",
      "Confirmed Date",
      "Verified Date",
      "User Name",
      "Phone Number",
      "Email",
      "First Payment",
      "Temporary User",
    ];

    const csvRows = transfersToExport.map((transfer) => {
      return [
        transfer.amount,
        transfer.plan,
        transfer.status,
        formatDate(transfer.createdAt),
        formatDate(transfer.confirmedAt),
        formatDate(transfer.verifiedAt),
        transfer.user?.fullname || transfer.userName || "",
        transfer.user?.phone_number || "",
        transfer.user?.email || "",
        transfer.isFirstTimePayment ? "Yes" : "No",
        transfer.user?.isTemporary ? "Yes" : "No",
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transfer_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const transfersToExport =
      viewMode === "pending" ? pendingVerificationTransfers : filteredTransfers;

    if (transfersToExport.length === 0) {
      alert("No data to export");
      return;
    }

    let excelContent =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent +=
      "<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Transfer Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>";
    excelContent += "<body><table>";

    excelContent += "<tr>";
    const headers = [
      "Amount",
      "Plan",
      "Status",
      "Created Date",
      "Confirmed Date",
      "Verified Date",
      "User Name",
      "Phone Number",
      "Email",
      "First Payment",
      "Temporary User",
    ];

    headers.forEach((header) => {
      excelContent += `<th>${header}</th>`;
    });
    excelContent += "</tr>";

    transfersToExport.forEach((transfer) => {
      excelContent += "<tr>";
      excelContent += `<td>${transfer.amount}</td>`;
      excelContent += `<td>${transfer.plan}</td>`;
      excelContent += `<td>${transfer.status}</td>`;
      excelContent += `<td>${formatDate(transfer.createdAt)}</td>`;
      excelContent += `<td>${formatDate(transfer.confirmedAt)}</td>`;
      excelContent += `<td>${formatDate(transfer.verifiedAt)}</td>`;
      excelContent += `<td>${
        transfer.user?.fullname || transfer.userName || ""
      }</td>`;
      excelContent += `<td>${transfer.user?.phone_number || ""}</td>`;
      excelContent += `<td>${transfer.user?.email || ""}</td>`;
      excelContent += `<td>${transfer.isFirstTimePayment ? "Yes" : "No"}</td>`;
      excelContent += `<td>${transfer.user?.isTemporary ? "Yes" : "No"}</td>`;
      excelContent += "</tr>";
    });

    excelContent += "</table></body></html>";
    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transfer_data.xls");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case TransferStatus.VERIFIED:
        return "bg-green-100 text-green-800";
      case TransferStatus.CONFIRMED:
        return "bg-blue-100 text-blue-800";
      case TransferStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case TransferStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case TransferStatus.EXPIRED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanBadgeClass = (plan: string): string => {
    switch (plan) {
      case SubscriptionPlan.U15_U18:
        return "bg-purple-100 text-purple-800";
      case SubscriptionPlan.U13_U14:
        return "bg-blue-100 text-blue-800";
      case SubscriptionPlan.U9_U12:
        return "bg-teal-100 text-teal-800";
      case SubscriptionPlan.U5_U8:
        return "bg-green-100 text-green-800";
      case SubscriptionPlan.FREE:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen rounded-lg">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
          {errorMessage}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between">
        <div className="flex flex-col mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Transfers</h1>
          <p className="text-gray-500 text-sm md:text-base">
            Track and manage payment transfers
          </p>
        </div>

        <div className="flex mb-4 sm:mb-0">
          <Button
            onClick={() => setViewMode("pending")}
            className={`px-4 py-2 rounded-l-lg border hover:text-white ${
              viewMode === "pending"
                ? "bg-primary text-white"
                : "bg-white text-gray-700"
            }`}
          >
            <FiClock className="inline mr-1" size={16} />
            Pending Verification
            {pendingVerificationTransfers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white text-primary rounded-full text-xs">
                +{pendingVerificationTransfers.length}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setViewMode("all")}
            className={`px-4 py-2 rounded-r-lg border hover:text-white ${
              viewMode === "all"
                ? "bg-primary text-white"
                : "bg-white text-gray-700"
            }`}
          >
            All Transfers
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:justify-between gap-4">
        <div className="md:hidden">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-4 w-full py-2"
          >
            <FiSliders className="mr-2" size={16} />
            <span>
              Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
            </span>
          </button>
        </div>

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
            className="flex items-center bg-white border border-gray-200 rounded-lg px-3 md:px-4 py-1 md:py-2 text-sm md:text-base"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <FiSliders className="mr-2" size={16} />
            <span>More filters</span>
          </button>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or phone"
              onChange={(e) => debouncedSetSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full"
            />
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>

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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {viewMode === "pending" ? (
          isPendingLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading pending transfers...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full min-w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                          Customer
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                          Amount
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                          Plan
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                          First Payment
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                          Confirmed At
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingVerificationTransfers.length > 0 ? (
                        pendingVerificationTransfers.map((transfer, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 mr-2 md:mr-3 flex items-center justify-center text-white">
                                  {(
                                    transfer.user?.fullname ||
                                    transfer.userName ||
                                    "User"
                                  ).charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-sm md:text-base">
                                    {transfer.user?.fullname ||
                                      transfer.userName ||
                                      "Unknown User"}
                                  </div>
                                  <div className="text-gray-500 text-xs md:text-sm flex items-center">
                                    {transfer.user?.phone_number || "No phone"}
                                    {transfer.user?.isTemporary && (
                                      <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                                        Temporary
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-sm md:text-base font-medium">
                              {formatCurrency(transfer.amount)}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm ${getPlanBadgeClass(
                                  transfer.plan
                                )}`}
                              >
                                {transfer.plan}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-sm md:text-base">
                              {transfer.isFirstTimePayment ? (
                                <span className="text-red-500 font-medium">
                                  Yes
                                </span>
                              ) : (
                                "No"
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-sm md:text-base text-gray-500">
                              {formatDate(transfer.confirmedAt)}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <input
                                type="text"
                                placeholder="Add notes..."
                                value={verificationNotes[transfer.id] || ""}
                                onChange={(e) =>
                                  setVerificationNotes((prev) => ({
                                    ...prev,
                                    [transfer.id]: e.target.value,
                                  }))
                                }
                                className="px-2 py-1 border border-gray-200 rounded-lg w-full text-sm"
                              />
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    verifyTransfer(transfer.id, true)
                                  }
                                  className="bg-green-100 text-green-600 hover:bg-green-200 px-3 py-1 rounded-lg text-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    verifyTransfer(transfer.id, false)
                                  }
                                  className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-lg text-sm"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center text-gray-500"
                          >
                            No transfers waiting for verification
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-3 md:p-4 border-t border-gray-200 text-gray-500 text-xs md:text-sm">
                Showing {pendingVerificationTransfers.length} pending transfers
              </div>
            </>
          )
        ) : isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading transfers...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="overflow-y-auto max-h-80">
                <table className="w-full min-w-full">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                        Customer
                      </th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                        Amount
                      </th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                        Plan
                      </th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 whitespace-nowrap">
                        Created Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.length > 0 ? (
                      filteredTransfers.map((transfer, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 mr-2 md:mr-3 flex items-center justify-center text-white">
                                {(
                                  transfer.user?.fullname ||
                                  transfer.userName ||
                                  "User"
                                ).charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-sm md:text-base">
                                  {transfer.user?.fullname ||
                                    transfer.userName ||
                                    "Unknown User"}
                                </div>
                                <div className="text-gray-500 text-xs md:text-sm">
                                  {transfer.user?.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm md:text-base font-medium">
                            {formatCurrency(transfer.amount)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm ${getStatusBadgeClass(
                                transfer.status
                              )}`}
                            >
                              {transfer.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm ${getPlanBadgeClass(
                                transfer.plan
                              )}`}
                            >
                              {transfer.plan}
                            </span>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-sm md:text-base text-gray-500">
                            {formatDate(transfer.createdAt)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex gap-2">
                              {transfer.status === TransferStatus.CONFIRMED && (
                                <>
                                  <button
                                    onClick={() =>
                                      verifyTransfer(transfer.id, true)
                                    }
                                    className="bg-green-100 text-green-600 hover:bg-green-200 px-3 py-1 rounded-lg text-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      verifyTransfer(transfer.id, false)
                                    }
                                    className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-lg text-sm"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-gray-500"
                        >
                          No transfers available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-3 md:p-4 border-t border-gray-200 text-gray-500 text-xs md:text-sm">
              Showing {filteredTransfers.length} transfers
            </div>
          </>
        )}
      </div>

      {/* Filter Modal Integration */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={applyFilters}
        activeFilters={activeFilters}
      />
    </div>
  );
};

export default Payment;
