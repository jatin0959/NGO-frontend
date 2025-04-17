"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Check, X, Square, SquareCheckBig } from "lucide-react"
import Loader from "../Loader/Loader"

function AdminInterests() {
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
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchInterests()
  }, [pagination.page, statusFilter])

  const fetchInterests = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}api/admin/interests?page=${pagination.page}&status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        setInterests(response.data.data || [])
        setPagination({
          page: response.data.currentPage || 1,
          pages: response.data.totalPages || 1,
          total: response.data.total || 0,
        })
      } else {
        setError("Failed to load interests")
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching interests:", error)
      setError("Failed to load interests")
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

  const handleSelectAll = () => {
    if (selectedInterests.length === interests.length) {
      setSelectedInterests([])
    } else {
      setSelectedInterests(interests.map((interest) => interest._id))
    }
  }

  const handleApproveInterest = async (id) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}api/admin/interests/bulk`,
        {
          interestIds: [id],
          action: "approve",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        toast.success("Interest approved successfully")
        // Update the local state
        setInterests(
          interests.map((interest) => (interest._id === id ? { ...interest, status: "accepted" } : interest)),
        )
        // Refresh the data
        fetchInterests()
      } else {
        toast.error("Failed to approve interest")
      }
    } catch (error) {
      console.error("Error approving interest:", error)
      toast.error("Failed to approve interest")
    }
  }

  const handleRejectInterest = async (id) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}api/admin/interests/bulk`,
        {
          interestIds: [id],
          action: "reject",
          reason: rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        toast.success("Interest rejected successfully")
        // Update the local state
        setInterests(
          interests.map((interest) => (interest._id === id ? { ...interest, status: "rejected" } : interest)),
        )
        // Refresh the data
        fetchInterests()
      } else {
        toast.error("Failed to reject interest")
      }
    } catch (error) {
      console.error("Error rejecting interest:", error)
      toast.error("Failed to reject interest")
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedInterests.length === 0) return

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}api/admin/interests/bulk`,
        {
          interestIds: selectedInterests,
          action,
          reason: action === "reject" ? rejectionReason : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        toast.success(`${action === "approve" ? "Approved" : "Rejected"} ${selectedInterests.length} interests`)
        setSelectedInterests([])
        setShowBulkActions(false)
        // Refresh the data
        fetchInterests()
      } else {
        toast.error(`Failed to ${action} interests`)
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      toast.error(`Failed to ${action} interests`)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({
        ...pagination,
        page: newPage,
      })
    }
  }

  if (loading) return <Loader />

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Interest Management</h1>

        <div className="flex space-x-4">
          <select
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          {selectedInterests.length > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              Bulk Actions ({selectedInterests.length})
            </button>
          )}
        </div>
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
                onClick={() => handleBulkAction("approve")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Approve All
              </button>
              <button
                onClick={() => handleBulkAction("reject")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Reject All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="join mb-3 flex overflow-scroll hideScrollbar">
        <button className="btn btn-outline border-gray-200 join-item" onClick={handleSelectAll}>
          <SquareCheckBig className="w-5 h-5" /> Select All
        </button>
        <button className="btn btn-outline border-gray-200 join-item" onClick={() => setSelectedInterests([])}>
          <Square className="w-5 h-5" /> Unselect All
        </button>
        <button
          className="btn btn-outline border-gray-200 join-item"
          onClick={() => handleBulkAction("approve")}
          disabled={selectedInterests.length === 0}
        >
          <Check className="w-5 h-5" />
          Approve Selected
        </button>
        <button
          className="btn btn-outline border-gray-200 join-item"
          onClick={() => handleBulkAction("reject")}
          disabled={selectedInterests.length === 0}
        >
          <X className="w-5 h-5" />
          Reject Selected
        </button>
      </div>

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
                      checked={selectedInterests.length === interests.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 border-b text-left">Sender</th>
                  <th className="py-3 px-4 border-b text-left">Receiver</th>
                  <th className="py-3 px-4 border-b text-left">Listing</th>
                  <th className="py-3 px-4 border-b text-left">Status</th>
                  <th className="py-3 px-4 border-b text-left">Date</th>
                  <th className="py-3 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interests.map((interest) => (
                  <tr key={interest._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">
                      <input
                        type="checkbox"
                        checked={selectedInterests.includes(interest._id)}
                        onChange={() => handleSelectInterest(interest._id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4 border-b font-medium">
                      {interest.sender?.firstName} {interest.sender?.lastName}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {interest.receiver?.firstName} {interest.receiver?.lastName}
                    </td>
                    <td className="py-3 px-4 border-b">{interest.listing?.title || "Unknown Listing"}</td>
                    <td className="py-3 px-4 border-b capitalize">
                      <span
                        className={`
                          badge 
                          ${
                            interest.status === "accepted"
                              ? "badge-success"
                              : interest.status === "pending"
                                ? "badge-warning"
                                : "badge-error"
                          }
                          capitalize
                        `}
                      >
                        {interest.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b">{new Date(interest.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveInterest(interest._id)}
                          className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm transition duration-200"
                          disabled={interest.status === "accepted"}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectionReason("")
                            handleRejectInterest(interest._id)
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm transition duration-200"
                          disabled={interest.status === "rejected"}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  Previous
                </button>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-md">{pagination.page}</span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === pagination.pages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminInterests
