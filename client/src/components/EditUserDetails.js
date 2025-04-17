import React, { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'
import uploadFile from '../helpers/uploadFile'
import Divider from './Divider'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { setUser } from '../redux/userSlice'

const EditUserDetails = ({onClose,user}) => {
    const [loading, setLoading] = useState(false);
    const [data,setData] = useState({
        name: user?.name || '', 
        profile_pic: user?.profile_pic || ''
    })
    const uploadPhotoRef = useRef()
    const dispatch = useDispatch()

    useEffect(()=>{
        setData((prev)=>{
            return{
                ...prev,
                name: user?.name || '', 
                profile_pic: user?.profile_pic || ''
            }
        })
    },[user])

    const handleOnChange = (e)=>{
        const { name, value } = e.target
        setData((prev)=>{
            return{
                ...prev,
                [name] : value
            }
        })
    }

    const handleOpenUploadPhoto = (e)=>{
        e.preventDefault()
        e.stopPropagation()
        uploadPhotoRef.current.click()
    }

    const handleUploadPhoto = async(e)=>{
        const file = e.target.files[0]
        if (!file) return;
        
        setLoading(true);
        try {
            const uploadedData = await uploadFile(file)
            if (uploadedData?.url) {
                setData((prev)=>({
                    ...prev,
                    profile_pic: uploadedData.url
                }))
            } else {
                toast.error('Error uploading photo')
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Error uploading photo');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async(e)=>{
        e.preventDefault()
        e.stopPropagation()

        if (!data.name.trim()) {
            toast.error('Name is required');
            return;
        }

        if (data.name.trim().length < 2 || data.name.trim().length > 50) {
            toast.error('Name must be between 2 and 50 characters');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const URL = `${process.env.REACT_APP_BACKEND_URL}/api/update-user` 
            const response = await axios({
                method: 'post',
                url: URL,
                data: data,
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if(response.data.success){
                dispatch(setUser(response.data.data))
                toast.success(response.data.message || 'Profile updated successfully')
                onClose()
            } else {
                throw new Error(response.data.message || 'Error updating user details')
            }
        } catch (error) {
            console.error('Error updating user details:', error);
            toast.error(error?.response?.data?.message || error.message || 'Error updating user details')
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='fixed inset-0 bg-black/60 z-50 flex justify-center items-center'>
            <div className='bg-white w-full max-w-md rounded-lg p-4'>
                <div className='flex justify-between items-center'>
                    <h2 className='text-xl font-semibold'>Edit Profile</h2>
                    <button 
                        onClick={onClose}
                        className='text-gray-500 hover:text-gray-700'
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>
                <Divider/>
                <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
                    <div className='flex justify-center'>
                        <div className='relative'>
                            <Avatar
                                width={100}
                                height={100}
                                name={data.name}
                                imageUrl={data.profile_pic}
                            />
                            <button
                                type="button"
                                onClick={handleOpenUploadPhoto}
                                disabled={loading}
                                className='absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-secondary disabled:opacity-50'
                            >
                                📷
                            </button>
                        </div>
                    </div>

                    <input
                        type='file'
                        className='hidden'
                        accept='image/*'
                        ref={uploadPhotoRef}
                        onChange={handleUploadPhoto}
                    />

                    <div className='space-y-2'>
                        <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                            Name
                        </label>
                        <input
                            type='text'
                            id='name'
                            name='name'
                            value={data.name}
                            onChange={handleOnChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary'
                            required
                            disabled={loading}
                            minLength={2}
                            maxLength={50}
                        />
                    </div>

                    <div className='flex justify-end space-x-2'>
                        <button
                            type='button'
                            onClick={onClose}
                            disabled={loading}
                            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={loading}
                            className={`px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default React.memo(EditUserDetails)
