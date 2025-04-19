import React, { useEffect, useState } from 'react'
import { IoChatbubbleEllipses } from "react-icons/io5";
import { FaUserPlus } from "react-icons/fa";
import { NavLink, useNavigate } from 'react-router-dom';
import { BiLogOut } from "react-icons/bi";
import { MdCampaign } from "react-icons/md";
import Avatar from './Avatar'
import { useDispatch, useSelector } from 'react-redux';
import EditUserDetails from './EditUserDetails';
import Divider from './Divider';
import { FaUsers } from "react-icons/fa";
import SearchUser from './SearchUser';
import { FaImage } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa6";
import { logout } from '../redux/userSlice';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = () => {
    const user = useSelector(state => state?.user)
    const [editUserOpen,setEditUserOpen] = useState(false)
    const [allUser,setAllUser] = useState([])
    const [openSearchUser,setOpenSearchUser] = useState(false)
    const [openCreateGroup, setOpenCreateGroup] = useState(false)
    const [groups, setGroups] = useState([]);
    const socketConnection = useSelector(state => state?.user?.socketConnection)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    useEffect(()=>{
        // Fetch groups for the sidebar
        const fetchGroups = () => {
            fetch('/api/groups', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            })
                .then(r => r.json())
                .then(res => {
                    if (res.success) setGroups(res.groups);
                });
        };
        fetchGroups();

        if(socketConnection){
            socketConnection.emit('sidebar',user._id)
            
            socketConnection.on('conversation',(data)=>{
                console.log('conversation',data)
                
                const conversationUserData = data.map((conversationUser,index)=>{
                    if(conversationUser?.sender?._id === conversationUser?.receiver?._id){
                        return{
                            ...conversationUser,
                            userDetails : conversationUser?.sender
                        }
                    }
                    else if(conversationUser?.receiver?._id !== user?._id){
                        return{
                            ...conversationUser,
                            userDetails : conversationUser.receiver
                        }
                    }else{
                        return{
                            ...conversationUser,
                            userDetails : conversationUser.sender
                        }
                    }
                })

                setAllUser(conversationUserData)
            })
        }
    },[socketConnection,user])

    const handleLogout = ()=>{
        dispatch(logout())
        navigate("/login")
        localStorage.clear()
    }

  return (
    <div className='w-full h-full grid grid-cols-[64px,340px,1fr] bg-white'>
            <div className='bg-slate-100 w-16 h-full rounded-tr-lg rounded-br-lg py-5 text-slate-600 flex flex-col justify-between'>
                <div>
                    <NavLink to="/" className={({isActive})=>`w-16 h-16 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded ${isActive && "bg-slate-200"}`} title='chat'>
                        <IoChatbubbleEllipses
                            size={20}
                        />
                    </NavLink>

                    {user?.role !== 'admin' && (
                        <NavLink to="/broadcast" className={({isActive})=>`w-16 h-16 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded ${isActive && "bg-slate-200"}`} title='Broadcast'>
                            <MdCampaign
                                size={20}
                            />
                        </NavLink>
                    )}

                    <div title='add friend' onClick={()=>setOpenSearchUser(true)} className='w-16 h-16 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded' >
                        <FaUserPlus size={20}/>
                    </div>
                    {/* Group chat create button */}
                    <div title='Create group' onClick={()=>setOpenCreateGroup(true)} className='w-16 h-16 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded'>
                        <FaUsers size={20}/>
                    </div>
                </div>

                <div className='flex flex-col items-center'>
                    <button className='mx-auto' title={user?.name} onClick={()=>setEditUserOpen(true)}>
                        <Avatar
                            width={40}
                            height={40}
                            name={user?.name}
                            imageUrl={user?.profile_pic}
                            userId={user?._id}
                        />
                    </button>
                    <button title='logout' className='w-16 h-16 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded' onClick={handleLogout}>
                        <span className='-ml-2'>
                            <BiLogOut size={20}/>
                        </span>
                    </button>
                </div>
            </div>

            <div className='w-[340px] min-w-[300px] max-w-[400px] bg-slate-50 h-full'>
                <div className='h-16 flex items-center'>
                    <h2 className='text-xl font-bold p-4 text-slate-800'>Message</h2>
                </div>
                <div className='bg-slate-200 p-[0.5px]'></div>

                <div className=' h-[calc(100vh-65px)] overflow-x-hidden overflow-y-auto scrollbar'>


                    {
                        allUser.length === 0 && (
                            <div className='mt-12'>
                                <div className='flex justify-center items-center my-4 text-slate-500'>
                                    <FaUsers size={50}/>
                                </div>
                                <p className='text-lg text-center text-slate-400'>Explore users to start a conversation with.</p>    
                            </div>
                        )
                    }

                    {
                        // Merge groups and allUser, sort by recent message timestamp
                        [...(groups||[]), ...allUser].sort((a, b) => {
                            // Get last message time for group or user
                            const aTime = a.lastMsg?.createdAt || a.updatedAt || a.createdAt || 0;
                            const bTime = b.lastMsg?.createdAt || b.updatedAt || b.createdAt || 0;
                            return new Date(bTime) - new Date(aTime);
                        }).map((item, index) => {
                            // If it's a group (has members property)
                            if (item.members) {
                                return (
                                    <NavLink to={`/group/${item._id}`} key={item._id} className='flex items-center gap-2 py-3 px-2 border border-transparent hover:border-primary rounded hover:bg-slate-100 cursor-pointer'>
                                        <Avatar name={item.name} width={40} height={40} />
                                        <div>
                                            <h3 className='text-ellipsis line-clamp-1 font-semibold text-base'>{item.name}</h3>
                                            <div className='text-slate-500 text-xs'>Members: {item.members && item.members.map(m => m.name).join(', ')}</div>
                                            {item.lastMsg && <div className='text-xs text-slate-400 truncate'>{item.lastMsg.text || (item.lastMsg.imageUrl ? 'Image' : item.lastMsg.videoUrl ? 'Video' : '')}</div>}
                                        </div>
                                    </NavLink>
                                );
                            }
                            // Special handling for broadcast
                            if (item._id === 'broadcast') {
                                return (
                                    <NavLink to="/broadcast" key="broadcast" className='flex items-center gap-2 py-3 px-2 border border-transparent hover:border-primary rounded hover:bg-slate-100 cursor-pointer'>
                                        <div className="w-[40px] h-[40px] bg-primary text-white rounded-full flex items-center justify-center">
                                            <MdCampaign size={25} />
                                        </div>
                                        <div>
                                            <h3 className='text-ellipsis line-clamp-1 font-semibold text-base'>Broadcast Messages</h3>
                                            <div className='text-slate-500 text-xs flex items-center gap-1'>
                                                <div className='flex items-center gap-1'>
                                                    {
                                                        item?.lastMsg?.imageUrl && (
                                                            <div className='flex items-center gap-1'>
                                                                <span><FaImage/></span>
                                                                {!item?.lastMsg?.text && <span>Image</span>  } 
                                                            </div>
                                                        )
                                                    }
                                                    {
                                                        item?.lastMsg?.videoUrl && (
                                                            <div className='flex items-center gap-1'>
                                                                <span><FaVideo/></span>
                                                                {!item?.lastMsg?.text && <span>Video</span>}
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                                <p className='text-ellipsis line-clamp-1'>{item?.lastMsg?.text}</p>
                                            </div>
                                        </div>
                                    </NavLink>
                                )
                            }
                            // Regular one-to-one conversation
                            return(
                                <NavLink to={"/"+item?.userDetails?._id} key={item?._id} className='flex items-center gap-2 py-3 px-2 border border-transparent hover:border-primary rounded hover:bg-slate-100 cursor-pointer'>
                                    <div>
                                        <Avatar
                                            imageUrl={item?.userDetails?.profile_pic}
                                            name={item?.userDetails?.name}
                                            width={40}
                                            height={40}
                                        />    
                                    </div>
                                    <div>
                                        <h3 className='text-ellipsis line-clamp-1 font-semibold text-base'>{item?.userDetails?.name}</h3>
                                        <div className='text-slate-500 text-xs flex items-center gap-1'>
                                            <div className='flex items-center gap-1'>
                                                {
                                                    item?.lastMsg?.imageUrl && (
                                                        <div className='flex items-center gap-1'>
                                                            <span><FaImage/></span>
                                                            {!item?.lastMsg?.text && <span>Image</span>  } 
                                                        </div>
                                                    )
                                                }
                                                {
                                                    item?.lastMsg?.videoUrl && (
                                                        <div className='flex items-center gap-1'>
                                                            <span><FaVideo/></span>
                                                            {!item?.lastMsg?.text && <span>Video</span>}
                                                        </div>
                                                    )
                                                }
                                            </div>
                                            <p className='text-ellipsis line-clamp-1'>{item?.lastMsg?.text}</p>
                                        </div>
                                    </div>
                                    {
                                        Boolean(item?.unseenMsg) && (
                                            <p className='text-xs w-6 h-6 flex justify-center items-center ml-auto p-1 bg-primary text-white font-semibold rounded-full'>{item?.unseenMsg}</p>
                                        )
                                    }

                                </NavLink>
                            )
                        })
                    }
                </div>
            </div>

            {/**edit user details*/}
            {
                editUserOpen && (
                    <EditUserDetails onClose={()=>setEditUserOpen(false)} user={user}/>
                )
            }

            {/**search user */}
            {
                openSearchUser && (
                    <SearchUser onClose={()=>setOpenSearchUser(false)}/>
                )
            }

            {/* Create group modal */}
            {openCreateGroup && (
                <CreateGroupModal open={openCreateGroup} onClose={()=>{
                    setOpenCreateGroup(false);
                    // Refresh group list after closing modal
                    fetch('/api/groups', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    })
                        .then(r => r.json())
                        .then(res => {
                            if (res.success) setGroups(res.groups);
                        });
                    // Refresh conversations
                    if(socketConnection && user?._id) {
                        socketConnection.emit('sidebar', user._id);
                    }
                }} onGroupCreated={() => {
                    // Refresh group list after creation
                    fetch('/api/groups', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    })
                        .then(r => r.json())
                        .then(res => {
                            if (res.success) setGroups(res.groups);
                        });
                    // Refresh conversations
                    if(socketConnection && user?._id) {
                        socketConnection.emit('sidebar', user._id);
                    }
                }} />
            )}

    </div>
  )
}

export default Sidebar
