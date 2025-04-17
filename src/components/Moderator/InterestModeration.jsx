"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Check, CheckCheck, ChevronLeft, Square, SquareCheckBig, X } from "lucide-react"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Loader from "../Loader/Loader"

const BASE_URL = import.meta.env.VITE_BASE_URL || ""

const InterestModeration = () => {
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  })
  const [selectedInterests, setSelectedInterests] = useState([])
  const [rejectionReason, setRejectionReason] = useState("")
  const [interestType, setInterestType] = useState("all")
  const [interestStatus, setInterestStatus] = useState("pending")
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [processingIds, setProcessingIds] = useState([]) // Track interests being processed
  
  // Pop-up state
  const [showPopup, setShowPopup] = useState(false)
  const [popupAction, setPopupAction] = useState("")
  const [popupId, setPopupId] = useState(null)
  const [popupIsBulk, setPopupIsBulk] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    fetchInterests()
  }, [pagination.page, interestType, interestStatus])

  const fetchInterests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      // Map the frontend status values to what the API expects
      const apiStatus = interestStatus === "active" ? "approved" : interestStatus;
      
      // Base URL with pagination and status
      let url = `${BASE_URL}api/mod/interests?page=${pagination.page}&status=${apiStatus}`
      
      // Add type filter if not "all"
      if (interestType !== "all") {
        // Convert to proper format for API - capitalize first letter and add "Listing"
        const formattedType = interestType.charAt(0).toUpperCase() + interestType.slice(1) + "Listing"
        url += `&type=${formattedType}`
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data && response.data.success) {
        setInterests(response.data.data?.interests || response.data.data || [])
        setPagination({
          page: pagination.page,
          pages: response.data.totalPages || response.data.data?.pagination?.pages || 1,
          total: response.data.data?.pagination?.total || response.data.total || 0,
        })
        setError(null)
      } else {
        setError("Failed to load interests")
        toast.error("Failed to fetch interests for moderation")
      }
    } catch (error) {
      console.error("Error fetching interests:", error)
      setError("Failed to load interests")
      toast.error(error.response?.data?.message || "Failed to fetch interests for moderation")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectInterest = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((interestId) => interestId !== id))
    } else {
      setSelectedInterests([...selectedInterests, id])
    }
  }

  const selectAllInterests = () => {
    if (interests.length === 0) return

    setSelectedInterests(interests.map((interest) => interest._id))
  }

  const unselectAllInterests = () => {
    setSelectedInterests([])
  }

  // Show confirmation popup before approving
  const confirmApproveInterest = (id) => {
    setPopupAction("approve")
    setPopupId(id)
    setPopupIsBulk(false)
    setShowPopup(true)
    setSuccessMessage("")
  }

  // Show confirmation popup before rejecting
  const confirmRejectInterest = (id) => {
    setPopupAction("reject")
    setPopupId(id)
    setPopupIsBulk(false)
    setShowPopup(true)
    setSuccessMessage("")
  }

  // Show confirmation popup before bulk actions
  const confirmBulkAction = (action) => {
    if (selectedInterests.length === 0) {
      toast.warning("No interests selected")
      return
    }
    
    setPopupAction(action)
    setPopupIsBulk(true)
    setShowPopup(true)
    setSuccessMessage("")
  }

  const handleApproveInterest = async (id) => {
    // Add to processing state
    setProcessingIds((prev) => [...prev, id])

    try {
      const token = localStorage.getItem("token")

      await axios.post(
        `${BASE_URL}api/mod/interests/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Update local state - note we use "approved" here based on API, but display as "active"
      setInterests(interests.map((interest) => (interest._id === id ? { ...interest, status: "approved" } : interest)))

      // Remove from selected interests if it was selected
      setSelectedInterests(selectedInterests.filter((interestId) => interestId !== id))

      // Show success message in popup
      setSuccessMessage("Interest approved successfully!")
      
      // Also show toast
      toast.success("Interest approved successfully")

      // Refresh interests if in pending view
      if (interestStatus === "pending") {
        fetchInterests()
      }
    } catch (error) {
      console.error("Error approving interest:", error)
      setError("Failed to approve interest")
      toast.error(error.response?.data?.message || "Failed to approve interest")
    } finally {
      // Remove from processing state
      setProcessingIds((prev) => prev.filter((itemId) => itemId !== id))
    }
  }

  const handleRejectInterest = async (id) => {
    // Add to processing state
    setProcessingIds((prev) => [...prev, id])

    try {
      const token = localStorage.getItem("token")

      await axios.post(
        `${BASE_URL}api/mod/interests/${id}/reject`,
        {
          reason: rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Update local state
      setInterests(interests.map((interest) => (interest._id === id ? { ...interest, status: "rejected" } : interest)))

      // Remove from selected interests if it was selected
      setSelectedInterests(selectedInterests.filter((interestId) => interestId !== id))

      // Show success message in popup
      setSuccessMessage("Interest rejected successfully!")
      
      // Also show toast
      toast.error("Interest rejected successfully")

      // Refresh interests if in pending view
      if (interestStatus === "pending") {
        fetchInterests()
      }
    } catch (error) {
      console.error("Error rejecting interest:", error)
      setError("Failed to reject interest")
      toast.error(error.response?.data?.message || "Failed to reject interest")
    } finally {
      // Remove from processing state
      setProcessingIds((prev) => prev.filter((itemId) => itemId !== id))
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedInterests.length === 0) {
      toast.warning("No interests selected")
      return
    }

    // Extract just the IDs from selectedInterests
    const selectedIds = selectedInterests
    setProcessingIds((prev) => [...prev, ...selectedIds])

    try {
      const token = localStorage.getItem("token")

      await axios.post(
        `${BASE_URL}api/mod/interests/bulk-action`,
        {
          ids: selectedIds,
          action,
          reason: rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Update local state
      setInterests(interests.filter((interest) => !selectedIds.includes(interest._id)))
      setSelectedInterests([])
      setShowBulkActions(false)

      // Set success message in popup
      if (action === "approve") {
        setSuccessMessage(`${selectedIds.length} interests approved successfully!`)
        toast.success(`${selectedIds.length} interests approved successfully`)
      } else {
        setSuccessMessage(`${selectedIds.length} interests rejected successfully!`)
        toast.success(`${selectedIds.length} interests rejected successfully`)
      }

      // Refresh the interests
      fetchInterests()
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      setError(`Failed to ${action} interests`)
      toast.error(error.response?.data?.message || `Failed to ${action} interests`)
    } finally {
      setProcessingIds((prev) => prev.filter((id) => !selectedIds.includes(id)))
    }
  }

  // Handle confirmation from popup
  const handleConfirmAction = () => {
    if (popupIsBulk) {
      handleBulkAction(popupAction)
    } else {
      if (popupAction === "approve") {
        handleApproveInterest(popupId)
      } else if (popupAction === "reject") {
        handleRejectInterest(popupId)
      }
    }
    // Do not close popup immediately - will show success message
  }

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({
        ...pagination,
        page: newPage,
      })
    }
  }

  // Convert status from API to display format
  const getDisplayStatus = (apiStatus) => {
    if (apiStatus === "approved") return "active";
    return apiStatus;
  }

  // Check if an interest is approved (could be "approved" or "active" depending on API)
  const isApproved = (interest) => {
    return interest.status === "approved" || interest.status === "active";
  }

  if (loading) {
    return <Loader />
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-500 text-center">{error}</div>
        <button
          onClick={fetchInterests}
          className="mt-4 mx-auto block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Confirmation Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            {successMessage ? (
              /* Success Message Display */
              <div className="text-center">
                <div className={`mb-4 text-2xl ${popupAction === "approve" ? "text-green-500" : "text-red-500"}`}>
                  {popupAction === "approve" ? (
                    <Check className="w-16 h-16 mx-auto mb-2" />
                  ) : (
                    <X className="w-16 h-16 mx-auto mb-2" />
                  )}
                </div>
                <h3 className="text-lg font-bold mb-6">{successMessage}</h3>
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Confirmation Dialog */
              <>
                <h3 className="text-lg font-bold mb-4">
                  {popupAction === "approve" 
                    ? popupIsBulk 
                      ? "Approve Selected Interests" 
                      : "Approve Interest"
                    : popupIsBulk 
                      ? "Reject Selected Interests" 
                      : "Reject Interest"
                  }
                </h3>
                <p className="mb-6">
                  {popupAction === "approve" 
                    ? popupIsBulk 
                      ? `Are you sure you want to approve ${selectedInterests.length} selected interests?` 
                      : "Are you sure you want to approve this interest?"
                    : popupIsBulk 
                      ? `Are you sure you want to reject ${selectedInterests.length} selected interests?` 
                      : "Are you sure you want to reject this interest?"
                  }
                </p>
                
                {popupAction === "reject" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rejection Reason (optional)
                    </label>
                    <input
                      type="text"
                      className="border rounded-md px-3 py-2 w-full"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter rejection reason"
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className={`px-4 py-2 text-white rounded-md transition ${
                      popupAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Interest Moderation</h1>

        <div className="flex space-x-4">
          <select
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={interestType}
            onChange={(e) => {
              setInterestType(e.target.value)
              setPagination({ ...pagination, page: 1 })
            }}
          >
            <option value="all">All Types</option>
            <option value="product">Products</option>
            <option value="service">Services</option>
            <option value="job">Jobs</option>
            <option value="matrimony">Matrimony</option>
          </select>

          <select
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={interestStatus}
            onChange={(e) => {
              setInterestStatus(e.target.value)
              setPagination({ ...pagination, page: 1 })
            }}
          >
            <option value="pending">Pending</option>
            <option value="active">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex space-x-2">
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition duration-200"
            onClick={selectAllInterests}
          >
            <SquareCheckBig className="w-5 h-5 inline mr-1" /> Select All
          </button>
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition duration-200"
            onClick={unselectAllInterests}
          >
            <Square className="w-5 h-5 inline mr-1" /> Unselect All
          </button>
        </div>

        {selectedInterests.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              Bulk Actions ({selectedInterests.length})
            </button>
            <button
              onClick={() => confirmBulkAction("approve")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              <CheckCheck className="w-5 h-5 inline mr-1" />
              Approve Selected
            </button>
            <button
              onClick={() => confirmBulkAction("reject")}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              <X className="w-5 h-5 inline mr-1" />
              Reject Selected
            </button>
          </div>
        )}
      </div>

      {showBulkActions && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Bulk Actions</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <input
              type="text"
              placeholder="Rejection reason (optional)"
              className="border rounded-md px-3 py-2 flex-grow"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => confirmBulkAction("approve")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Approve All
              </button>
              <button
                onClick={() => confirmBulkAction("reject")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Reject All
              </button>
            </div>
          </div>
        </div>
      )}

      {interests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No interests found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-left">
                    <input
                      type="checkbox"
                      checked={selectedInterests.length === interests.length && interests.length > 0}
                      onChange={selectedInterests.length === interests.length ? unselectAllInterests : selectAllInterests}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 border-b text-left">Sender</th>
                  <th className="py-3 px-4 border-b text-left">Receiver</th>
                  <th className="py-3 px-4 border-b text-left">Listing Type</th>
                  <th className="py-3 px-4 border-b text-left">Message</th>
                  <th className="py-3 px-4 border-b text-left">Status</th>
                  <th className="py-3 px-4 border-b text-left">Date</th>
                  <th className="py-3 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interests.map((interest) => {
                  const type = interest.listingType?.replace('Listing', '').toLowerCase() || "unknown";
                  const displayStatus = getDisplayStatus(interest.status);
                  
                  return (
                    <tr key={interest._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">
                        <input
                          type="checkbox"
                          checked={selectedInterests.includes(interest._id)}
                          onChange={() => handleSelectInterest(interest._id)}
                          disabled={interest.status !== "pending" || processingIds.includes(interest._id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4 border-b">
                        <div className="font-medium">{interest.sender.firstName} {interest.sender.lastName}</div>
                        <div className="text-sm text-gray-500">{interest.sender.email}</div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <div className="font-medium">{interest.receiver.firstName} {interest.receiver.lastName}</div>
                        <div className="text-sm text-gray-500">{interest.receiver.email}</div>
                      </td>
                      <td className="py-3 px-4 border-b capitalize">{type}</td>
                      <td className="py-3 px-4 border-b">
                        {interest.message || "No message"}
                      </td>
                      <td className="py-3 px-4 border-b">
                        <span
                          className={`capitalize font-medium ${
                            isApproved(interest)
                              ? "text-green-500"
                              : interest.status === "rejected"
                                ? "text-red-500"
                                : "text-yellow-500"
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b">{new Date(interest.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 border-b">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => confirmApproveInterest(interest._id)}
                            disabled={isApproved(interest) || processingIds.includes(interest._id)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm transition duration-200 disabled:opacity-50"
                          >
                            {processingIds.includes(interest._id) && !isApproved(interest) ? (
                              <div className="w-4 h-4 inline-block border-2 border-t-transparent border-green-600 rounded-full animate-spin mr-1"></div>
                            ) : (
                              <Check className="w-4 h-4 inline mr-1" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectionReason("")
                              confirmRejectInterest(interest._id)
                            }}
                            disabled={interest.status === "rejected" || processingIds.includes(interest._id)}
                            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm transition duration-200 disabled:opacity-50"
                          >
                            {processingIds.includes(interest._id) && interest.status !== "rejected" ? (
                              <div className="w-4 h-4 inline-block border-2 border-t-transparent border-red-600 rounded-full animate-spin mr-1"></div>
                            ) : (
                              <X className="w-4 h-4 inline mr-1" />
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {interests.length} of {pagination.total} interests
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else {
                    const startPage = Math.max(1, pagination.page - 2);
                    const endPage = Math.min(pagination.pages, startPage + 4);
                    pageNum = startPage + i;
                    if (pageNum > endPage) return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        pagination.page === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === pagination.pages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default InterestModeration