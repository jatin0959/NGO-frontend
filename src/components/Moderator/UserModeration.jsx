"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Loader from "../Loader/Loader"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const BASE_URL = import.meta.env.VITE_BASE_URL.replace(/\/$/, "")

const UserModeration = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  })
  const [selectedUsers, setSelectedUsers] = useState([])
  const [rejectionReason, setRejectionReason] = useState("")
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [pagination.page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
  
      // Construct the URL properly
      const url = new URL(`api/mod/users`, BASE_URL)
      url.searchParams.append('page', pagination.page)
      url.searchParams.append('status', 'pending')
  
      const response = await axios.get(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
  
      setUsers(response.data.data.users)
      setPagination(response.data.data.pagination)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to load users")
      setLoading(false)
      toast.error("Failed to load users", {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }
  const handleSelectUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((userId) => userId !== id))
    } else {
      setSelectedUsers([...selectedUsers, id])
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((user) => user._id))
    }
  }

  const handleApproveUser = async (id) => {
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `${BASE_URL}api/mod/users/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Show success notification
      toast.success("User approved successfully!", {
        position: "top-right",
        autoClose: 3000,
      })

      // Remove the approved user from the list
      setUsers(users.filter((user) => user._id !== id))
      setSelectedUsers(selectedUsers.filter((userId) => userId !== id))

      // Update pagination
      setPagination({
        ...pagination,
        total: pagination.total - 1,
      })
    } catch (error) {
      console.error("Error approving user:", error)
      toast.error("Failed to approve user", {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  const handleRejectUser = async (id, reason = "") => {
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `${BASE_URL}api/mod/users/reject/${id}`,
        {
          reason: reason || rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Show success notification
      toast.success("User rejected successfully!", {
        position: "top-right",
        autoClose: 3000,
      })

      // Remove the rejected user from the list
      setUsers(users.filter((user) => user._id !== id))
      setSelectedUsers(selectedUsers.filter((userId) => userId !== id))

      // Update pagination
      setPagination({
        ...pagination,
        total: pagination.total - 1,
      })

      // Reset modal state
      setShowRejectModal(false)
      setRejectionReason("")
    } catch (error) {
      console.error("Error rejecting user:", error)
      toast.error("Failed to reject user", {
        position: "top-right",
        autoClose: 3000,
      })
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.warning("No users selected", {
        position: "top-right",
        autoClose: 3000,
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `${BASE_URL}api/mod/users/bulk-approve-reject`,
        {
          ids: selectedUsers,
          action,
          reason: rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Show success notification
      toast.success(
        `${selectedUsers.length} users ${action === "approve" ? "approved" : "rejected"} successfully!`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      )

      // Remove the processed users from the list
      setUsers(users.filter((user) => !selectedUsers.includes(user._id)))
      setSelectedUsers([])

      // Update pagination
      setPagination({
        ...pagination,
        total: pagination.total - selectedUsers.length,
      })

      setShowBulkActions(false)
      setRejectionReason("")

      // Refresh the user list
      fetchUsers()
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      toast.error(`Failed to ${action} users`, {
        position: "top-right",
        autoClose: 3000,
      })
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

  const openRejectModal = (userId) => {
    setCurrentUserId(userId)
    setShowRejectModal(true)
  }

  if (loading) return <Loader />

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Toast Container for notifications */}
      <ToastContainer />

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reject User</h2>
            <p className="mb-4">Please provide a reason for rejection (optional):</p>
            <textarea
              className="w-full border rounded-md p-2 mb-4"
              rows="3"
              placeholder="Rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason("")
                }}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectUser(currentUserId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Moderation</h1>

        {selectedUsers.length > 0 && (
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
          >
            Bulk Actions ({selectedUsers.length})
          </button>
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

      {error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No users pending moderation</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 border-b text-left">Name</th>
                  <th className="py-3 px-4 border-b text-left">Email</th>
                  <th className="py-3 px-4 border-b text-left">Joined</th>
                  <th className="py-3 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4 border-b font-medium">{user.name}</td>
                    <td className="py-3 px-4 border-b">{user.email}</td>
                    <td className="py-3 px-4 border-b">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveUser(user._id)}
                          className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm transition duration-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(user._id)}
                          className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm transition duration-200"
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
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              Showing {users.length} of {pagination.total} users
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
        </>
      )}
    </div>
  )
}

export default UserModeration