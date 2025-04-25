"use client"

import { useState, useEffect } from "react"
import { Bell, ExternalLink } from "lucide-react"
import NotificationItem from "./NotificationItem"
import { toast } from "sonner"
import { useAuth } from "../../contexts/authContext"
import { Link } from "react-router-dom"

function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { api } = useAuth()

  const fetchNotifications = async () => {
    if (!localStorage.getItem("token")) return
    setLoading(true)
    setError(null)

    try {
      const response = await api.get("api/notifications")
      if (response.data && response.data.data) {
        setNotifications(response.data.data.slice(0, 5))
      } else {
        setNotifications([])
      }
    } catch (error) {
      setError("Failed to load notifications")
      if (error.response?.status === 401) toast.error("Please login again")
      else toast.error("Error loading notifications")
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    if (!localStorage.getItem("token")) return

    try {
      const response = await api.get("api/notifications/count")
      setUnreadCount(response.data?.count || 0)
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.put("api/notifications/mark-read", { notificationIds: [notificationId] })
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id)
    if (unreadIds.length === 0) return

    try {
      await api.put("api/notifications/mark-read", { notificationIds: unreadIds })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success("Marked all as read")
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="drawer drawer-end w-auto">
      <input id="notification-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        <label
          htmlFor="notification-drawer"
          className="btn btn-ghost btn-circle drawer-button"
          onClick={fetchNotifications}
        >
          <div className="indicator">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="bg-lightOrange border-lightOrange badge badge-xs badge-primary indicator-item">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </label>
      </div>
      <div className="drawer-side z-50">
        <label htmlFor="notification-drawer" className="drawer-overlay"></label>
        <div className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
          <div className="flex justify-between items-center border-b pb-2 mb-2">
            <h2 className="font-semibold text-lg">Notifications</h2>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-500 hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-100px)]">
            {loading ? (
              <div className="flex justify-center py-6">
                <l-tail-chase size="30" speed="1.75" color="#FA812F"></l-tail-chase>
              </div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-6">No notifications</div>
            ) : (
              <>
                {notifications.map((n) => (
                  <NotificationItem key={n._id} notification={n} onMarkAsRead={markAsRead} />
                ))}
                <div className="text-center mt-4 border-t pt-4">
                  <Link
                    to="/notifications"
                    className="text-lightOrange hover:underline flex items-center justify-center gap-1"
                  >
                    View all
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationCenter
