import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const OTPVerification = ({ email, onVerificationSuccess }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleSendOTP = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/send-otp`, {
                email
            });
            setUserId(response.data.userId);
            toast.success('OTP sent to your email');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            toast.error('Please enter OTP');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/verify-email`, {
                userId,
                otp
            });
            
            if (response.data.success) {
                toast.success('Email verified successfully');
                setIsVerified(true); 
                onVerificationSuccess();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            setLoading(true);
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/resend-otp`, {
                userId
            });
            toast.success('New OTP sent to your email');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
                <label htmlFor="otp">Verification Code:</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="otp"
                        maxLength="6"
                        className="bg-slate-100 px-2 py-1 focus:outline-primary w-full"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={isVerified}
                    />
                    {!userId && (
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={loading || isVerified}
                            className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/90 disabled:bg-gray-400"
                        >
                            Send OTP
                        </button>
                    )}
                </div>
            </div>
            
            {userId && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={loading || !otp || isVerified}
                        className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/90 disabled:bg-gray-400 flex-1"
                    >
                        Verify OTP
                    </button>
                    <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading || isVerified}
                        className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600 disabled:bg-gray-400"
                    >
                        Resend
                    </button>
                </div>
            )}
        </div>
    );
};

export default OTPVerification;
