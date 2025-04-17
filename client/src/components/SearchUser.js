import React, { useEffect, useState } from 'react'
import { IoSearchOutline } from "react-icons/io5";
import Loading from './Loading';
import UserSearchCard from './UserSearchCard';
import toast from 'react-hot-toast'
import axios from 'axios';
import { IoClose } from "react-icons/io5";

const SearchUser = ({onClose}) => {
    const [searchUser, setSearchUser] = useState([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")

    const handleSearchUser = async (searchTerm = "") => {
        const URL = `${process.env.REACT_APP_BACKEND_URL}/api/search-user`
        try {
            setLoading(true)
            const token = localStorage.getItem('token');
            const response = await axios({
                method: 'post',
                url: URL,
                data: { search: searchTerm },
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            setSearchUser(response.data.data)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error fetching users')
            setSearchUser([])
        } finally {
            setLoading(false)
        }
    }

    // Load all users when component mounts
    useEffect(() => {
        handleSearchUser()
    }, [])

    // Search when input changes
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearchUser(search)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    return (
        <div className='fixed top-0 bottom-0 left-0 right-0 bg-slate-700 bg-opacity-40 p-2 z-10'>
            <div className='w-full max-w-lg mx-auto mt-10'>
                <div className='bg-white rounded-lg overflow-hidden'>
                    {/* Header */}
                    <div className='p-4 border-b flex justify-between items-center'>
                        <h2 className='text-lg font-semibold'>Users</h2>
                        <button 
                            onClick={onClose}
                            className='text-gray-500 hover:text-gray-700'
                        >
                            <IoClose size={24} />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className='p-4 border-b'>
                        <div className='bg-gray-100 rounded-lg flex items-center'>
                            <input 
                                type='text'
                                placeholder='Search by name or email...'
                                className='flex-1 bg-transparent p-3 outline-none'
                                onChange={(e) => setSearch(e.target.value)}
                                value={search}
                            />
                            <div className='px-3'>
                                <IoSearchOutline size={20} className='text-gray-500' />
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className='max-h-[400px] overflow-y-auto'>
                        {loading ? (
                            <div className='p-4 flex justify-center'>
                                <Loading />
                            </div>
                        ) : searchUser.length > 0 ? (
                            <div className='p-2 space-y-2'>
                                {searchUser.map((user) => (
                                    <UserSearchCard key={user._id} user={user} onClose={onClose} />
                                ))}
                            </div>
                        ) : (
                            <div className='p-4 text-center text-gray-500'>
                                {search ? 'No users found' : 'No users available'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchUser
