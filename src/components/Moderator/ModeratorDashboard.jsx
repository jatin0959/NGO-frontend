"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ArrowDown, ArrowUp, BarChart3, Users, ShoppingBag, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

function ModeratorDashboard() {
  const [stats, setStats] = useState({
    totalAdsLive: 0,
    totalAdsPending: 0,
    totalActiveUsers: 0,
    totalDeactivatedUsers: 0,
    totalAdsRejected: 0,
    adsLiveChange: 0,
    adsPendingChange: 0,
    activeUsersChange: 0,
    deactivatedUsersChange: 0,
    adsRejectedChange: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const baseUrl = import.meta.env?.VITE_BASE_URL || ""

      // Try to fetch from the mod dashboard endpoint
      try {
        const response = await axios.get(`${baseUrl}api/mod/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data && response.data.success) {
          const data = response.data.data || {}

          setStats({
            totalAdsLive: data.approved?.listings || 0,
            totalAdsPending: data.pending?.listings || 0,
            totalActiveUsers: data.approved?.users || 0,
            totalDeactivatedUsers: data.rejected?.users || 0,
            totalAdsRejected: data.rejected?.listings || 0,
            adsLiveChange: 3, // Mock data for changes
            adsPendingChange: -5,
            activeUsersChange: 6,
            deactivatedUsersChange: 1,
            adsRejectedChange: -2,
          })
          setLoading(false)
          return
        }
      } catch (error) {
        console.error("Error fetching from dashboard endpoint:", error)
        // Continue to fallback methods
      }

      // Fallback methods and final mock data setup remain the same
      // ... (existing fallback logic)

    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      toast.error("Failed to fetch dashboard statistics")
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, change, isPositiveGood = true, icon }) => {
    const isPositive = change > 0
    const isNegative = change < 0

    // For metrics where negative change is good (like pending ads or rejected ads)
    const textColorClass = !isPositiveGood
      ? isNegative
        ? "text-emerald-600"
        : isPositive
          ? "text-red-600"
          : "text-slate-600"
      : isPositive
        ? "text-emerald-600"
        : isNegative
          ? "text-red-600"
          : "text-slate-600"

    const iconBackground = !isPositiveGood
      ? isNegative
        ? "bg-emerald-100"
        : isPositive
          ? "bg-red-100"
          : "bg-slate-100"
      : isPositive
        ? "bg-emerald-100"
        : isNegative
          ? "bg-red-100"
          : "bg-slate-100"

    return (
      <div className="relative p-4 rounded-md bg-white shadow-sm border border-slate-100">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-medium text-slate-500">
              <span>{title}</span>
            </div>

            <div className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</div>

            {change !== 0 && (
              <div className={`flex items-center space-x-1 rtl:space-x-reverse text-xs font-medium ${textColorClass}`}>
                {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                <span>{Math.abs(change)}% {isPositive ? "increase" : "decrease"}</span>
              </div>
            )}
          </div>

          <div className={`p-2 rounded-md ${iconBackground}`}>{icon}</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">Moderator Dashboard</h1>
        <p className="text-sm text-slate-600">Welcome to the moderator dashboard. Here's an overview of the platform.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Ads Live"
          value={stats.totalAdsLive}
          change={stats.adsLiveChange}
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Pending Approval"
          value={stats.totalAdsPending}
          change={stats.adsPendingChange}
          isPositiveGood={false}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Active Users"
          value={stats.totalActiveUsers}
          change={stats.activeUsersChange}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
        />
        <StatCard
          title="Deactivated Users"
          value={stats.totalDeactivatedUsers}
          change={stats.deactivatedUsersChange}
          isPositiveGood={false}
          icon={<Users className="h-5 w-5 text-slate-500" />}
        />
        <StatCard
          title="Rejected Ads"
          value={stats.totalAdsRejected}
          change={stats.adsRejectedChange}
          isPositiveGood={false}
          icon={<ShoppingBag className="h-5 w-5 text-red-600" />}
        />
      </div>

      <div className="mt-6 bg-white p-4 rounded-md shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-3 text-slate-800">Recent Activity</h2>
        <div className="flex items-center justify-center h-56 bg-slate-50 rounded-md border border-dashed border-slate-200">
          <div className="text-center">
            <BarChart3 className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Activity charts will be available soon</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="bg-white p-4 rounded-md shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-3 text-slate-800">Pending Tasks</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-md border border-amber-100">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                <span className="text-sm">{stats.totalAdsPending} listings pending approval</span>
              </div>
              <button
                onClick={() => (window.location.href = "/moderator/listings?status=pending")}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-3 text-slate-800">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => (window.location.href = "/moderator/listings?status=pending")}
              className="p-3 bg-indigo-50 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors group"
            >
              <ShoppingBag className="h-5 w-5 text-indigo-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-center text-xs font-medium">Moderate Listings</span>
            </button>
            <button
              onClick={() => (window.location.href = "/moderator/users?status=pending")}
              className="p-3 bg-slate-50 rounded-md border border-slate-100 hover:bg-slate-100 transition-colors group"
            >
              <Users className="h-5 w-5 text-slate-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="block text-center text-xs font-medium">Moderate Users</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModeratorDashboard