"use client"

import { useState, useEffect } from "react"
import { Bell, Trash2, CheckCheck, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "../contexts/authContext"
import { formatDistanceToNow } from "date-fns"

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { api } = useAuth()

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get("api/notifications")
      console.log("Notifications API response:", response.data)

      if (response.data && response.data.data) {
        setNotifications(response.data.data)
      } else {
        setNotifications([])
        console.warn("No notifications found in response")
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("Failed to load notifications")
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((notification) => !notification.read).map((notification) => notification._id)

    if (unreadIds.length === 0) {
      toast.info("No unread notifications")
      return
    }

    try {
      await api.put("api/notifications/mark-read", { notificationIds: unreadIds })
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark notifications as read")
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.put("api/notifications/mark-read", { notificationIds: [notificationId] })
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const cleanupNotifications = async () => {
    try {
      await api.delete("api/notifications/cleanup")
      toast.success("Old notifications cleaned up")
      fetchNotifications()
    } catch (error) {
      console.error("Error cleaning up notifications:", error)
      toast.error("Failed to clean up notifications")
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case "interest_matched":
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <Bell className="h-5 w-5 text-green-500" />
          </div>
        )
      case "service_request":
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <Bell className="h-5 w-5 text-blue-500" />
          </div>
        )
      case "profile_matched":
        return (
          <div className="bg-purple-100 p-2 rounded-full">
            <Bell className="h-5 w-5 text-purple-500" />
          </div>
        )
      case "ad_approved":
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <Bell className="h-5 w-5 text-green-500" />
          </div>
        )
      case "ad_rejected":
        return (
          <div className="bg-red-100 p-2 rounded-full">
            <Bell className="h-5 w-5 text-red-500" />
          </div>
        )
      case "product_interest":
        return (
          <div className="bg-orange-100 p-2 rounded-full">
            <Bell className="h-5 w-5 text-orange-500" />
          </div>
        )
      case "job_interest":
        return (
          <div className="bg-indigo-100 p-2 rounded-full">
            <Bell className="h-5 w-5 text-indigo-500" />
          </div>
        )
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <Bell className="h-5 w-5 text-gray-500" />
          </div>
        )
    }
  }

  const getRedirectUrl = (notification) => {
    const { relatedItem, relatedItemType } = notification || {}

    if (!relatedItem) return "#"

    if (relatedItemType === "product") return `/productDetail/${relatedItem._id}`
    if (relatedItemType === "service") return `/serviceDetail/${relatedItem._id}`
    if (relatedItemType === "job") return `/jobDetail/${relatedItem._id}`
    if (relatedItemType === "matrimony") return `/matrimonyProfile/${relatedItem._id}`
    return "#"
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className="pt-24 pb-10 min-h-screen bg-gray-50">
      <div className="customContainer">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Link to="/" className="btn btn-ghost btn-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-lightOrange text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="btn btn-sm btn-outline flex items-center gap-1">
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </button>
              )}
              {notifications.length > 10 && (
                <button
                  onClick={cleanupNotifications}
                  className="btn btn-sm btn-outline btn-error flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Clean up old
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <l-tail-chase size="40" speed="1.75" color="#FA812F"></l-tail-chase>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button onClick={fetchNotifications} className="mt-2 text-sm text-lightOrange hover:underline">
                Try again
              </button>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`py-4 px-2 flex items-start gap-4 ${!notification.read ? "bg-blue-50" : ""}`}
                >
                  <div className="flex-shrink-0">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">
                        {notification.title ||
                          (notification.type
                            ? notification.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                            : "Notification")}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {notification.createdAt
                          ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                          : "Just now"}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <div className="mt-2 flex justify-between">
                      <Link
                        to={getRedirectUrl(notification)}
                        className="text-sm text-lightOrange hover:underline"
                        onClick={() => !notification.read && markAsRead(notification._id)}
                      >
                        View details
                      </Link>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500">No notifications yet</h3>
              <p className="text-gray-400 mt-1">When you get notifications, they'll show up here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Notifications
