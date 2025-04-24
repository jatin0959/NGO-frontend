"use client"

import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, Home } from "lucide-react"
import Navbar from "../components/Navbar/Navbar"
import SignupBanner from "../components/SignupBanner/SignupBanner"
import Footer from "../components/Footer/Footer"
import { useAuth } from "../contexts/authContext"
import ProductCard from "../components/ProductCard/ProductCard"

const BASE_IMAGE_URL = "http://localhost:3002" // Updated base URL

function Products() {
  const { productsList } = useAuth()

  // Only show approved/active products
  const approvedProducts = productsList.filter(product => product.status === "active")

  return (
    <>
      <Navbar />
      <main>
        {/* Banner */}
        <div className="relative lg:h-[280px] md:h-[240px] sm:h-[220px] h-[180px]">
          <div className="bg-cover bg-center h-full"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black to-transparent" />
          <div className="absolute top-1/2 left-[10%] -translate-y-1/2">
            <h1 className="text-4xl text-white">Products</h1>
            <nav aria-label="Breadcrumb">
              <ol className="flex justify-start items-center gap-1 mt-1 text-sm text-gray-300">
                <li>
                  <Link to="/" className="block transition hover:text-lightOrange">
                    <Home className="h-4 w-4" />
                  </Link>
                </li>
                <li className="rtl:rotate-180">
                  <ChevronRight className="h-4 w-4" />
                </li>
                <li>
                  <p className="block transition hover:text-lightOrange">Products</p>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Product Grid */}
        <div className="customContainer my-10">
          <div className="flex lg:flex-row md:flex-row flex-col justify-between items-start lg:items-center md:items-center mb-4">
            <h2 className="text-xl font-semibold">Products near you</h2>
            <p className="text-xs text-gray-500">Showing {approvedProducts.length} results</p>
          </div>

          <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 place-items-center gap-4 mb-8">
            {approvedProducts.length > 0 ? (
              approvedProducts.map((product, index) => {
                const imageUrl =
                  product.images?.length > 0
                    ? `${BASE_IMAGE_URL}${product.images[0]}`
                    : "/fallback.jpg"

                return <ProductCard key={index} product={{ ...product, imageUrl }} />
              })
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">No approved products available at the moment</p>
              </div>
            )}
          </div>

          {/* Static Pagination */}
          {approvedProducts.length > 0 && (
            <div className="flex justify-center">
              <div className="inline-flex justify-center gap-1">
                <button className="inline-flex size-8 items-center justify-center rounded border bg-white hover:bg-lightOrange hover:text-white text-gray-900 duration-200">
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <input
                  type="number"
                  className="h-8 w-12 rounded border bg-white p-0 text-center text-xs font-medium text-gray-900"
                  min="1"
                  value="1"
                  id="PaginationPage"
                  readOnly
                />

                <button className="inline-flex size-8 items-center justify-center rounded border bg-white hover:bg-lightOrange hover:text-white text-gray-900 duration-200">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <SignupBanner />
      </main>
      <Footer />
    </>
  )
}

export default Products
