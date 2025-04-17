import React, { useState } from 'react'
import { IoClose } from "react-icons/io5";
import { Link, useNavigate } from 'react-router-dom';
import uploadFile from '../helpers/uploadFile';
import axios from 'axios'
import toast from 'react-hot-toast';
import OTPVerification from '../components/OTPVerification';

const RegisterPage = () => {
  const [data,setData] = useState({
    name : "",
    email : "",
    password : "",
    profile_pic : ""
  })
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: ""
  })
  const [uploadPhoto,setUploadPhoto] = useState("")
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const navigate = useNavigate()

  const validateField = (name, value) => {
    switch(name) {
      case 'name':
        if (!value.trim()) return "Name is required"
        if (!/^[a-zA-Z\s]{2,30}$/.test(value)) return "Name should be 2-30 characters long and contain only letters"
        return ""
      case 'email':
        if (!value.trim()) return "Email is required"
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) return "Please enter a valid email address"
        return ""
      case 'password':
        if (!value) return "Password is required"
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)) {
          return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        }
        return ""
      default:
        return ""
    }
  }

  const handleOnChange = (e)=>{
    const { name, value} = e.target

    if (name === 'email') {
      setIsEmailVerified(false)
      setShowOTPVerification(false)
    }

    setData((preve)=>{
      return{
          ...preve,
          [name] : value
      }
    })

    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleUploadPhoto = async(e)=>{
    const file = e.target.files[0]
    try {
      const uploadedData = await uploadFile(file)
      if(uploadedData?.url) {
        setUploadPhoto(URL.createObjectURL(file)) // For preview
        setData((prev)=>{
          return{
            ...prev,
            profile_pic : uploadedData.url
          }
        })
      } else {
        toast.error("Error uploading image")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
    }
  }

  const handleClearUploadPhoto = (e)=>{
    e.stopPropagation()
    e.preventDefault()
    setUploadPhoto(null)
  }

  const handleSubmit = async(e)=>{
    e.preventDefault()
    e.stopPropagation()

    if (!isEmailVerified) {
      toast.error("Please verify your email first")
      return
    }

    // Validate all fields before submission
    const newErrors = {
      name: validateField('name', data.name),
      email: validateField('email', data.email),
      password: validateField('password', data.password)
    }

    setErrors(newErrors)

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== "")) {
      toast.error("Please fix all errors before submitting")
      return
    }

    const URL = `${process.env.REACT_APP_BACKEND_URL}/api/register`

    try {
        const response = await axios.post(URL,data)
        console.log("response",response)

        toast.success(response.data.message)

        if(response.data.success){
            setData({
              name : "",
              email : "",
              password : "",
              profile_pic : ""
            })

            navigate('/email')
        }
    } catch (error) {
        toast.error(error?.response?.data?.message)
    }
  }

  const handleEmailBlur = () => {
    if (data.email && !errors.email) {
      setShowOTPVerification(true)
    }
  }

  return (
    <div className='mt-5'>
        <div className='bg-white w-full max-w-md  rounded overflow-hidden p-4 mx-auto'>
          <h3>Welcome to Chat app!</h3>

          <form className='grid gap-4 mt-5' onSubmit={handleSubmit}>
              <div className='flex flex-col gap-1'>
                <label htmlFor='name'>Name :</label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  placeholder='enter your name' 
                  className={`bg-slate-100 px-2 py-1 focus:outline-primary ${errors.name ? 'border-red-500 border' : ''}`}
                  value={data.name}
                  onChange={handleOnChange}
                  required
                />
                {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
              </div>

              <div className='flex flex-col gap-1'>
                <label htmlFor='email'>Email :</label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  placeholder='enter your email' 
                  className={`bg-slate-100 px-2 py-1 focus:outline-primary ${errors.email ? 'border-red-500 border' : ''}`}
                  value={data.email}
                  onChange={handleOnChange}
                  onBlur={handleEmailBlur}
                  required
                />
                {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
              </div>

              {showOTPVerification && (
                <OTPVerification 
                  email={data.email} 
                  onVerificationSuccess={() => setIsEmailVerified(true)} 
                />
              )}

              <div className='flex flex-col gap-1'>
                <label htmlFor='password'>Password :</label>
                <input
                  type='password'
                  id='password'
                  name='password'
                  placeholder='enter your password' 
                  className={`bg-slate-100 px-2 py-1 focus:outline-primary ${errors.password ? 'border-red-500 border' : ''}`}
                  value={data.password}
                  onChange={handleOnChange}
                  required
                />
                {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
              </div>

              <div className='flex flex-col gap-1'>
                <label htmlFor='profile_pic'>Profile Picture:</label>
                <div className='relative'>
                  <input
                    type='file'
                    id='profile_pic'
                    accept='image/*'
                    onChange={handleUploadPhoto}
                    className='bg-slate-100 px-2 py-1 focus:outline-primary w-full'
                  />
                  {uploadPhoto && (
                    <div className='mt-2 relative w-24 h-24'>
                      <img src={uploadPhoto} alt="Profile preview" className='w-full h-full object-cover rounded'/>
                      <button 
                        onClick={handleClearUploadPhoto}
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1'
                      >
                        <IoClose />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                className={`bg-primary text-white px-8 py-2 rounded ${!isEmailVerified ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'}`}
                type='submit'
                disabled={!isEmailVerified}
              >
                Register
              </button>

              <p>Already have account ? <Link to="/email" className='text-primary'>Login</Link></p>
          </form>
        </div>
    </div>
  )
}

export default RegisterPage
