"use client"

import { useState, useEffect } from "react"
import { Check, CheckCheck, ChevronLeft, Square, SquareCheckBig, X } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

const ListingModeration = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  })
  const [selectedListings, setSelectedListings] = useState([])
  const [rejectionReason, setRejectionReason] = useState("")
  const [listingType, setListingType] = useState("all")
  const [listingStatus, setListingStatus] = useState("pending")
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [processingIds, setProcessingIds] = useState([]) // Track listings being processed

  useEffect(() => {
    fetchListings()
  }, [pagination.page, listingType, listingStatus])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const baseUrl = import.meta.env?.VITE_BASE_URL || ""

      let url = `${baseUrl}api/mod/listings?page=${pagination.page}&status=${listingStatus}`
      if (listingType !== "all") {
        url += `&type=${listingType}`
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data && response.data.success) {
        setListings(response.data.data?.listings || response.data.data || [])
        setPagination({
          page: pagination.page,
          pages: response.data.totalPages || response.data.data?.pagination?.pages || 1,
          total: response.data.data?.pagination?.total || response.data.total || 0,
        })
        setError(null)
      } else {
        setError("Failed to load listings")
        toast.error("Failed to fetch listings for moderation")
      }
    } catch (error) {
      console.error("Error fetching listings:", error)
      setError("Failed to load listings")
      toast.error(error.response?.data?.message || "Failed to fetch listings for moderation")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectListing = (id, type) => {
    const item = { id, type }

    if (selectedListings.some((selected) => selected.id === id)) {
      setSelectedListings(selectedListings.filter((selected) => selected.id !== id))
    } else {
      setSelectedListings([...selectedListings, item])
    }
  }

  const selectAllListings = () => {
    if (listings.length === 0) return

    const allItems = listings.map((listing) => ({
      id: listing._id,
      type: listing.listingType || listing.__t?.replace("Listing", "").toLowerCase() || "product",
    }))
    setSelectedListings(allItems)
  }

  const unselectAllListings = () => {
    setSelectedListings([])
  }

  const handleApproveListing = async (id, type) => {
    // Add to processing state
    setProcessingIds((prev) => [...prev, id])

    try {
      const token = localStorage.getItem("token")
      const baseUrl = import.meta.env?.VITE_BASE_URL || ""

      await axios.post(
        `${baseUrl}api/mod/listings/${id}/approve`,
        { listingId: id, listingType: type, action: "approve" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update local state
      setListings(listings.map((listing) => (listing._id === id ? { ...listing, status: "active" } : listing)))

      // Remove from selected listings if it was selected
      setSelectedListings(selectedListings.filter((item) => item.id !== id))

      toast.success("Listing approved successfully")

      // Refresh listings if in pending view
      if (listingStatus === "pending") {
        fetchListings()
      }
    } catch (error) {
      console.error("Error approving listing:", error)
      setError("Failed to approve listing")
      toast.error(error.response?.data?.message || "Failed to approve listing")
    } finally {
      // Remove from processing state
      setProcessingIds((prev) => prev.filter((itemId) => itemId !== id))
    }
  }

  const handleRejectListing = async (id, type) => {
    // Add to processing state
    setProcessingIds((prev) => [...prev, id])

    try {
      const token = localStorage.getItem("token")
      const baseUrl = import.meta.env?.VITE_BASE_URL || ""

      await axios.post(
        `${baseUrl}api/mod/listings/${id}/reject`,
        {
          listingId: id,
          listingType: type,
          action: "reject",
          reason: rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update local state
      setListings(listings.map((listing) => (listing._id === id ? { ...listing, status: "rejected" } : listing)))

      // Remove from selected listings if it was selected
      setSelectedListings(selectedListings.filter((item) => item.id !== id))

      toast.error("Listing rejected successfully")

      // Refresh listings if in pending view
      if (listingStatus === "pending") {
        fetchListings()
      }
    } catch (error) {
      console.error("Error rejecting listing:", error)
      setError("Failed to reject listing")
      toast.error(error.response?.data?.message || "Failed to reject listing")
    } finally {
      // Remove from processing state
      setProcessingIds((prev) => prev.filter((itemId) => itemId !== id))
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedListings.length === 0) {
      toast.warning("No listings selected")
      return
    }

    // Extract just the IDs from selectedListings
    const selectedIds = selectedListings.map((item) => item.id)
    setProcessingIds((prev) => [...prev, ...selectedIds])

    try {
      const token = localStorage.getItem("token")
      const baseUrl = import.meta.env?.VITE_BASE_URL || ""

      await axios.post(
        `${baseUrl}api/mod/listings/bulk-action`,
        {
          ids: selectedIds, // Send just the IDs array
          action,
          reason: rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Update local state
      setListings(listings.filter((listing) => !selectedIds.includes(listing._id)))
      setSelectedListings([])
      setShowBulkActions(false)

      if (action === "approve") {
        toast.success(`${selectedIds.length} listings approved successfully`)
      } else {
        toast.success(`${selectedIds.length} listings rejected successfully`)
      }

      // Refresh the listings
      fetchListings()
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      setError(`Failed to ${action} listings`)
      toast.error(error.response?.data?.message || `Failed to ${action} listings`)
    } finally {
      setProcessingIds((prev) => prev.filter((id) => !selectedIds.includes(id)))
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-500 text-center">{error}</div>
        <button
          onClick={fetchListings}
          className="mt-4 mx-auto block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Listing Moderation</h1>

        <div className="flex space-x-4">
          <select
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={listingType}
            onChange={(e) => {
              setListingType(e.target.value)
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
            value={listingStatus}
            onChange={(e) => {
              setListingStatus(e.target.value)
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
            onClick={selectAllListings}
          >
            <SquareCheckBig className="w-5 h-5 inline mr-1" /> Select All
          </button>
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition duration-200"
            onClick={unselectAllListings}
          >
            <Square className="w-5 h-5 inline mr-1" /> Unselect All
          </button>
        </div>

        {selectedListings.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              Bulk Actions ({selectedListings.length})
            </button>
            <button
              onClick={() => handleBulkAction("approve")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              <CheckCheck className="w-5 h-5 inline mr-1" />
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction("reject")}
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

      {listings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No listings found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-left">
                    <input
                      type="checkbox"
                      checked={selectedListings.length === listings.length && listings.length > 0}
                      onChange={selectedListings.length === listings.length ? unselectAllListings : selectAllListings}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 border-b text-left">Type</th>
                  <th className="py-3 px-4 border-b text-left">Title</th>
                  <th className="py-3 px-4 border-b text-left">User</th>
                  <th className="py-3 px-4 border-b text-left">Price/Salary</th>
                  <th className="py-3 px-4 border-b text-left">Location</th>
                  <th className="py-3 px-4 border-b text-left">Status</th>
                  <th className="py-3 px-4 border-b text-left">Date</th>
                  <th className="py-3 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => {
                  const listingType =
                    listing.listingType || listing.__t?.replace("Listing", "").toLowerCase() || "product"
                  return (
                    <tr key={listing._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">
                        <input
                          type="checkbox"
                          checked={selectedListings.some((item) => item.id === listing._id)}
                          onChange={() => handleSelectListing(listing._id, listingType)}
                          disabled={listing.status !== "pending" || processingIds.includes(listing._id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4 border-b capitalize">{listingType}</td>
                      <td className="py-3 px-4 border-b font-medium">{listing.title || listing.jobTitle}</td>
                      <td className="py-3 px-4 border-b">
                        {listing.user ? listing.user.name || listing.user.email || listing.user.firstName : "Unknown"}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {listing.price ? `₹${listing.price}` : listing.salary ? `₹${listing.salary}` : "N/A"}
                      </td>
                      <td className="py-3 px-4 border-b">{listing.location || listing.city || "N/A"}</td>
                      <td className="py-3 px-4 border-b">
                        <span
                          className={`capitalize font-medium ${
                            listing.status === "active"
                              ? "text-green-500"
                              : listing.status === "rejected"
                                ? "text-red-500"
                                : "text-yellow-500"
                          }`}
                        >
                          {listing.status || "pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b">{new Date(listing.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 border-b">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveListing(listing._id, listingType)}
                            disabled={listing.status === "active" || processingIds.includes(listing._id)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm transition duration-200 disabled:opacity-50"
                          >
                            {processingIds.includes(listing._id) && listing.status !== "active" ? (
                              <div className="w-4 h-4 inline-block border-2 border-t-transparent border-green-600 rounded-full animate-spin mr-1"></div>
                            ) : (
                              <Check className="w-4 h-4 inline mr-1" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectionReason("")
                              handleRejectListing(listing._id, listingType)
                            }}
                            disabled={listing.status === "rejected" || processingIds.includes(listing._id)}
                            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm transition duration-200 disabled:opacity-50"
                          >
                            {processingIds.includes(listing._id) && listing.status !== "rejected" ? (
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
                Showing {listings.length} of {pagination.total} listings
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
                  let pageNum
                  if (pagination.pages <= 5) {
                    pageNum = i + 1
                  } else {
                    const startPage = Math.max(1, pagination.page - 2)
                    const endPage = Math.min(pagination.pages, startPage + 4)
                    pageNum = startPage + i
                    if (pageNum > endPage) return null
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
                  )
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

export default ListingModeration
