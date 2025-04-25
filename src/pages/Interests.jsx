"use client"

import { useAuth } from "../contexts/authContext"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar/Navbar"
import Footer from "../components/Footer/Footer"

const BASE_URL = import.meta.env.VITE_BASE_URL.replace(/\/+$/, "")

function Interests() {
  const { userInterests } = useAuth()

  return (
    <>
      <Navbar />
      <main>
        <div className="customContainer my-2">
          <h1 className="text-lg font-semibold">Your Interests</h1>
        </div>
        <div className="customContainer bg-white p-3 mb-5 rounded-lg shadow-md grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
          {userInterests?.length > 0 ? (
            userInterests.map((interest) => {
              const listing = interest.listing
              const imagePath = listing?.files?.[0] || listing?.images?.[0]
              const image = imagePath ? `${BASE_URL}${imagePath.startsWith("/") ? imagePath : "/" + imagePath}` : "/placeholder.svg"

              const detailUrl = `/${listing?.__t === "ProductListing" ? "productDetail" : "serviceDetail"}/${listing._id}`

              return (
                <div key={interest._id} className="border border-lightOrange rounded-lg overflow-hidden">
                  <div className="h-[160px] bg-gray-100 overflow-hidden">
                    <img src={image} alt="listing" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold truncate">{listing?.title || "No Title"}</p>
                    <p className="text-sm mb-1">
                      Status: <span className="font-medium capitalize">{interest.status || "pending"}</span>
                    </p>
                    <p className="text-xs">Your interest has not been accepted yet.</p>
                  </div>
                  <Link
                    to={detailUrl}
                    className="bg-lightOrange hover:bg-orange duration-200 text-white font-medium text-sm py-2 block text-center"
                  >
                    Read more
                  </Link>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              You have not shown interest in any listing yet.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Interests
