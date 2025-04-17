import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import Loading from '../components/Loading'

const ForgotPassword = () => {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/forgot-password`, {
                email
            })
            toast.success("Reset link sent to your email")
            navigate('/email')
        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='h-screen flex justify-center items-center bg-slate-100'>
            <div className='bg-white p-8 rounded-lg shadow-md w-96'>
                <h2 className='text-2xl font-bold mb-6 text-center'>Forgot Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2'>
                            Email Address
                        </label>
                        <input
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='w-full p-3 border rounded focus:outline-none focus:border-blue-500'
                            placeholder='Enter your email'
                            required
                        />
                    </div>
                    <button
                        type='submit'
                        disabled={loading}
                        className='w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400'
                    >
                        {loading ? <Loading /> : 'Send Reset Link'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ForgotPassword
