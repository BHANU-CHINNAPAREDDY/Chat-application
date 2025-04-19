import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { FaAngleLeft } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { FaImage } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa6";
import { MdCampaign } from "react-icons/md";
import uploadFile from '../helpers/uploadFile';
import { IoClose } from "react-icons/io5";
import Loading from '../components/Loading';
import backgroundImage from '../assets/wallapaper.jpeg'
import { IoMdSend } from "react-icons/io";
import moment from 'moment'

const BroadcastPage = () => {
  const socketConnection = useSelector(state => state?.user?.socketConnection)
  const user = useSelector(state => state?.user)
  const [openImageVideoUpload,setOpenImageVideoUpload] = useState(false)
  const [message,setMessage] = useState({
    text: "",
    imageUrl: "",
    videoUrl: ""
  })
  const [loading,setLoading] = useState(false)
  const [allMessage,setAllMessage] = useState([])
  const currentMessage = useRef(null)

  useEffect(()=>{
      if(currentMessage.current){
          currentMessage.current.scrollIntoView({behavior: 'smooth', block: 'end'})
      }
  },[allMessage])

  useEffect(() => {
    if(socketConnection) {
      socketConnection.emit('broadcast-page')
      
      socketConnection.on('broadcast-messages', (data) => {
        setAllMessage(data)
      })
    }
  }, [socketConnection])

  const handleUploadImageVideoOpen = ()=>{
    setOpenImageVideoUpload(preve => !preve)
  }

  const handleUploadImage = async(e)=>{
    const file = e.target.files[0]

    setLoading(true)
    const uploadPhoto = await uploadFile(file)
    setLoading(false)
    setOpenImageVideoUpload(false)

    setMessage(preve => {
      return{
        ...preve,
        imageUrl: uploadPhoto.url
      }
    })
  }

  const handleClearUploadImage = ()=>{
    setMessage(preve => {
      return{
        ...preve,
        imageUrl: ""
      }
    })
  }

  const handleUploadVideo = async(e)=>{
    const file = e.target.files[0]

    setLoading(true)
    const uploadPhoto = await uploadFile(file)
    setLoading(false)
    setOpenImageVideoUpload(false)

    setMessage(preve => {
      return{
        ...preve,
        videoUrl: uploadPhoto.url
      }
    })
  }

  const handleClearUploadVideo = ()=>{
    setMessage(preve => {
      return{
        ...preve,
        videoUrl: ""
      }
    })
  }

  const handleOnChange = (e)=>{
    const { value } = e.target

    setMessage(preve => {
      return{
        ...preve,
        text: value
      }
    })
  }

  const handleSendMessage = (e)=>{
    e.preventDefault()

    if(message.text || message.imageUrl || message.videoUrl){
      if(socketConnection){
        socketConnection.emit('new-broadcast-message', {
          text: message.text,
          imageUrl: message.imageUrl,
          videoUrl: message.videoUrl,
          sender: user?._id
        })
        setMessage({
          text: "",
          imageUrl: "",
          videoUrl: ""
        })
      }
    }
  }

  return (
    <div style={{ backgroundImage: `url(${backgroundImage})`}} className='bg-no-repeat bg-cover'>
          <header className='sticky top-0 h-16 bg-white flex items-center gap-4 px-4 shadow'>
  <Link to="/" className='flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 mr-2'>
    <FaAngleLeft size={25} />
  </Link>
  <div className="w-[50px] h-[50px] bg-primary text-white rounded-full flex items-center justify-center">
    <MdCampaign size={30} />
  </div>
  <div className='flex flex-col flex-1 min-w-0'>
    <h3 className='font-semibold text-lg my-0 text-ellipsis line-clamp-1'>Broadcast Messages</h3>
    <p className='-my-2 text-sm text-slate-400'>Messages visible to all users</p>
  </div>
</header>

          {/***show all message */}
          <section className='h-[calc(100vh-128px)] overflow-x-hidden overflow-y-scroll scrollbar relative bg-slate-200 bg-opacity-50'>
                  {/**all message show here */}
                  <div className='flex flex-col gap-2 py-2 mx-2' ref={currentMessage}>
                    {
                      allMessage.map((msg,index)=>{
                        return(
                           <div key={msg._id} className={`max-w-xs p-2 rounded-lg ${user._id === msg?.sender?._id ? 'bg-[#d9fdd3] ml-auto' : 'bg-white'}`}>
                             <div className="flex items-center gap-2 mb-1">
                               <Avatar name={msg?.sender?.name} imageUrl={msg?.sender?.profile_pic} width={24} height={24} />
                               <span className="font-semibold text-xs">{msg?.sender?.name}</span>
                             </div>
                             {msg.imageUrl && <div className="mb-1"><FaImage className="inline mr-1" /> <img src={msg.imageUrl} alt="broadcast-img" className="w-full h-full object-scale-down" /></div>}
                             {msg.videoUrl && <div className="mb-1"><FaVideo className="inline mr-1" /> <video src={msg.videoUrl} controls className="w-full h-full object-scale-down" /></div>}
                             <div>{msg.text}</div>
                             <div className="text-xs text-gray-400 mt-1">{moment(msg?.createdAt).format('hh:mm A')}</div>
                           </div>
                        )
                      })
                    }
                  </div>
          </section>

          {/**chat input */}
          <div className='sticky bottom-0 bg-white'>
                {
                    (message?.imageUrl || message?.videoUrl) && (
                        <div className='p-2'>
                            <div className='relative w-fit'>
                                {
                                    message?.imageUrl && (
                                        <>
                                            <img 
                                                src={message?.imageUrl}
                                                className='w-[100px] h-[100px] object-scale-down'
                                                alt="broadcast"
                                            />
                                            <button onClick={handleClearUploadImage} className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full'>
                                                <IoClose/>
                                            </button>
                                        </>
                                    )
                                }
                                {
                                    message?.videoUrl && (
                                        <>
                                            <video className='w-[100px] h-[100px]'>
                                                <source src={message?.videoUrl} />
                                            </video>
                                            <button onClick={handleClearUploadVideo} className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full'>
                                                <IoClose/>
                                            </button>
                                        </>
                                    )
                                }
                            </div>
                        </div>
                    )
                }
                <form onSubmit={handleSendMessage} className='flex items-center gap-2 p-2'>
                    <div className='relative'>
                        <button type='button' onClick={handleUploadImageVideoOpen} className='w-10 h-10 flex justify-center items-center hover:bg-slate-100 rounded-full'>
                            <FaPlus/>
                        </button>
                        {
                            openImageVideoUpload && (
                                <div className='absolute bottom-full left-0 bg-white shadow rounded p-2 flex flex-col gap-2'>
                                    <div>
                                        <input type='file' accept='image/*' id='image' className='hidden' onChange={handleUploadImage}/>
                                        <label htmlFor='image' className='w-8 h-8 flex justify-center items-center hover:bg-slate-100 rounded cursor-pointer'>
                                            <FaImage/>
                                        </label>
                                    </div>
                                    <div>
                                        <input type='file' accept='video/*' id='video' className='hidden' onChange={handleUploadVideo}/>
                                        <label htmlFor='video' className='w-8 h-8 flex justify-center items-center hover:bg-slate-100 rounded cursor-pointer'>
                                            <FaVideo/>
                                        </label>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                    <div className='flex-1'>
                        <input 
                            type='text'
                            placeholder='Type your message...'
                            className='w-full bg-slate-100 rounded p-2 outline-none'
                            value={message.text}
                            onChange={handleOnChange}
                        />
                    </div>
                    <button type='submit' className='w-10 h-10 flex justify-center items-center bg-primary text-white rounded-full'>
                        <IoMdSend/>
                    </button>
                </form>
          </div>

          {/**loading */}
          {
            loading && <Loading/>
          }
    </div>
  )
}

export default BroadcastPage
