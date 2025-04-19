import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/userSlice';

const AdminDashboard = () => {
    const [users, setUsers] = useState({
        pending: [],
        approved: [],
        rejected: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        fetchUsers();
        // Set up polling for updates every 10 seconds
        const interval = setInterval(fetchUsers, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios({
                method: 'get',
                url: `${process.env.REACT_APP_BACKEND_URL}/api/admin/users`,
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUsers(response.data);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error('Access denied. Admin only.');
                navigate('/');
            } else {
                toast.error('Error fetching users');
                console.error('Error:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await axios({
                method: 'get',
                url: `${process.env.REACT_APP_BACKEND_URL}/api/logout`,
                withCredentials: true
            });
            
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('isAdmin');
            
            // Update Redux state
            dispatch(logout());
            
            // Redirect to login
            navigate('/login');
            
            toast.success('Signed out successfully');
        } catch (error) {
            console.error('Signout error:', error);
            toast.error('Error signing out');
        }
    };

    const handleUserAction = async (userId, action) => {
        try {
            const response = await axios({
                method: 'post',
                url: `${process.env.REACT_APP_BACKEND_URL}/api/admin/update-user-status`,
                data: { userId, action },
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            toast.success(response.data.message);
            setUsers(response.data.users); // Update users state with new data
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating user status');
            console.error('Error:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await axios({
                method: 'delete',
                url: `${process.env.REACT_APP_BACKEND_URL}/api/admin/user/${userId}`,
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            toast.success(response.data.message);
            setUsers(response.data.users);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error deleting user');
            console.error('Error:', error);
        }
    };

    const UserTable = ({ users, title, showActions = false }) => (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            {users.length === 0 ? (
                <p>No {title.toLowerCase()}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-6 py-3 text-left">Name</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                {showActions && <th className="px-6 py-3 text-left">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id} className="border-b">
                                    <td className="px-6 py-4">{user.name}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            user.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    {showActions && (
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleUserAction(user._id, 'approved')}
                                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleUserAction(user._id, 'rejected')}
                                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3zm11.707 4.707a1 1 0 0 0-1.414-1.414L10 9.586 6.707 6.293a1 1 0 0 0-1.414 1.414L8.586 11l-3.293 3.293a1 1 0 1 0 1.414 1.414L10 12.414l3.293 3.293a1 1 0 0 0 1.414-1.414L11.414 11l3.293-3.293z" clipRule="evenodd" />
                    </svg>
                    Sign Out
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
                <UserTable users={users.pending} title="Pending Users" showActions={true} />
                <UserTable users={users.approved} title="Approved Users" />
                <UserTable users={users.rejected} title="Rejected Users" showActions={true} />
            </div>
        </div>
    );
};

export default AdminDashboard;
