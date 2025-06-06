"use client"

import Navbar from "../Navbar/Navbar"
import Footer from "../Footer/Footer"
import { useParams } from "react-router-dom"
import axios from "axios"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const host_url = import.meta.env.VITE_BASE_URL.replace(/\/+$/, "")


function EditProduct() {
  const { productId } = useParams()
  const [formData, setFormData] = useState({})
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const getServiceDetails = async () => {
      try {
        const response = await axios.get(`${host_url}/listings/product/${productId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        const data = response.data.data
        await getPincode(data.pincode)
        setFormData(data)
      } catch (err) {
        toast.error("Failed to load product data")
      }
    }
    getServiceDetails()
  }, [productId])

  const getPincode = async (pincode) => {
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`)
      const data = response.data[0]
      if (data.Status === "Success") {
        const postOffice = data.PostOffice[0]
        setState(postOffice.State)
        setCity(postOffice.District)
      }
    } catch (error) {
      console.error("Failed to fetch location:", error)
    }
  }

  const handleFormData = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdatedForm = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = `${host_url.replace(/\/+$/, "")}/listings/product/${productId}`

      const response = await axios.put(url, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      toast.success("Product updated successfully")
      console.log("Updated:", response.data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <div className="customContainer my-2">
          <h1 className="text-lg font-semibold">Edit your Product details</h1>
        </div>
        <div className="customContainer bg-white px-3 mb-5 rounded-lg shadow-md">
          <div className="max-w-4xl max-sm:max-w-lg mx-auto p-4">
            <div className="text-center mb-4">
              <h4 className="text-neutral-800 font-semibold text-xl">Edit</h4>
            </div>

            <form onSubmit={handleUpdatedForm}>
              <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                <div>
                  <label className="text-gray-600 text-sm mb-1 font-medium block">Title</label>
                  <input
                    name="title"
                    type="text"
                    value={formData.title || ""}
                    onChange={handleFormData}
                    className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-lightOrange transition-all"
                    placeholder="Enter Product title"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-1 font-medium block">Sub-Category of Ad</label>
                  <select
                    name="subCategory"
                    className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-lightOrange transition-all"
                    value={formData.subCategory || ""}
                    onChange={handleFormData}
                  >
                    <option value="">Select Sub-Category</option>
                    <option value="laptop">Laptop</option>
                    <option value="mobile">Mobile</option>
                    <option value="camera">Camera</option>
                    <option value="watch">Watch</option>
                    <option value="tv">TV</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-1 font-medium block">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    value={formData.quantity || ""}
                    onChange={handleFormData}
                    className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-lightOrange transition-all"
                    placeholder="Enter Product quantity"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">Pincode</label>
                  <input
                    name="pincode"
                    type="text"
                    value={formData.pincode || ""}
                    onChange={handleFormData}
                    className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-lightOrange transition-all"
                    placeholder="Enter Pincode"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-1 font-medium block">City</label>
                  <input
                    name="city"
                    type="text"
                    value={city}
                    disabled
                    className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded outline-lightOrange input-disabled"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-1 font-medium block">State</label>
                  <input
                    name="state"
                    type="text"
                    value={state}
                    disabled
                    className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded outline-lightOrange input-disabled"
                  />
                </div>
                <div className="lg:col-span-3">
                  <label className="text-gray-600 text-sm mb-1 font-medium block">Description</label>
                  <textarea
                    rows="4"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleFormData}
                    className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-lightOrange transition-all"
                  ></textarea>
                </div>
              </div>
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={saving}
                  className="mx-auto block py-3 px-6 font-medium text-sm tracking-wider rounded text-white bg-lightOrange duration-200 hover:bg-orange focus:outline-none disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default EditProduct
