import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                // Verify admin status by making a request to admin/users endpoint
                await axios({
                    method: 'get',
                    url: `${process.env.REACT_APP_BACKEND_URL}/api/admin/users`,
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // If the request succeeds, user is authenticated as admin
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Admin authentication error:', error);
                if (error.response?.status === 403) {
                    toast.error('Access denied. Admin only.');
                } else {
                    toast.error('Authentication failed. Please log in again.');
                    // Clear invalid token
                    localStorage.removeItem('token');
                    localStorage.removeItem('isAdmin');
                }
            } finally {
                setIsLoading(false);
            }
        };

        verifyAdmin();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
