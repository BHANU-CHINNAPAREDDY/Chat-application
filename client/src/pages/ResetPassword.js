import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import Loading from '../components/Loading'

const ResetPassword = () => {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState({
        password: "",
        confirmPassword: ""
    })
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { token } = useParams()

    const validatePassword = (value) => {
        if (!value) return "Password is required"
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)) {
            return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        }
        return ""
    }

    const handlePasswordChange = (e) => {
        const value = e.target.value
        setPassword(value)
        setErrors(prev => ({
            ...prev,
            password: validatePassword(value)
        }))
    }

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value
        setConfirmPassword(value)
        setErrors(prev => ({
            ...prev,
            confirmPassword: value !== password ? "Passwords don't match" : ""
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const passwordError = validatePassword(password)
        if (passwordError) {
            toast.error(passwordError)
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords don't match")
            return
        }

        try {
            setLoading(true)
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/reset-password`, {
                token,
                password
            })
            toast.success("Password reset successful")
            navigate('/')
        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='h-screen flex justify-center items-center bg-slate-100'>
            <div className='bg-white p-8 rounded-lg shadow-md w-96'>
                <h2 className='text-2xl font-bold mb-6 text-center'>Reset Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <label className='block text-gray-700 text-sm font-bold mb-2'>
                            New Password
                        </label>
                        <input
                            type='password'
                            value={password}
                            onChange={handlePasswordChange}
                            className='w-full p-3 border rounded focus:outline-none focus:border-blue-500'
                            placeholder='Enter new password'
                            required
                        />
                        {errors.password && (
                            <p className='text-red-500 text-sm mt-1'>{errors.password}</p>
                        )}
                    </div>
                    <div className='mb-6'>
                        <label className='block text-gray-700 text-sm font-bold mb-2'>
                            Confirm Password
                        </label>
                        <input
                            type='password'
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            className='w-full p-3 border rounded focus:outline-none focus:border-blue-500'
                            placeholder='Confirm new password'
                            required
                        />
                        {errors.confirmPassword && (
                            <p className='text-red-500 text-sm mt-1'>{errors.confirmPassword}</p>
                        )}
                    </div>
                    <button
                        type='submit'
                        disabled={loading}
                        className='w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400'
                    >
                        {loading ? <Loading /> : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword
