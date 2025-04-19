import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Avatar from '../components/Avatar';
import { FaImage, FaVideo, FaPlus, FaAngleLeft } from 'react-icons/fa6';
import { IoMdSend } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router-dom';
import backgroundImage from '../assets/wallapaper.jpeg';
import uploadFile from '../helpers/uploadFile';

const GroupChatPage = () => {
  const { groupId } = useParams();
  const user = useSelector(state => state.user);
  const socketConnection = useSelector(state => state.user.socketConnection);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState({ text: '', imageUrl: '', videoUrl: '' });
  const [openImageVideoUpload, setOpenImageVideoUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const currentMessage = useRef(null);

  useEffect(() => {
    if (socketConnection && groupId) {
      socketConnection.emit('get-group-messages', groupId, (res) => {
        if (res.success) setMessages(res.messages);
      });
      socketConnection.on('group-message', ({ groupId: incomingGroupId, message }) => {
        if (incomingGroupId === groupId) {
          setMessages(prev => {
            // Prevent duplicate temp messages
            const filtered = prev.filter(m => !(m._id.startsWith('temp-') && m.text === message.text && m.msgByUserId._id === message.msgByUserId._id));
            return [...filtered, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          });
        }
      });
      // Fetch group details via REST
      fetch(`/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) setGroup(res.group);
        });
      return () => {
        socketConnection.off('group-message');
      };
    }
  }, [socketConnection, groupId]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!message.text && !message.imageUrl && !message.videoUrl) return;
    setSending(true);
    // Optimistically add the message
    const tempMsg = {
      _id: 'temp-' + Date.now(),
      msgByUserId: user,
      text: message.text,
      imageUrl: message.imageUrl,
      videoUrl: message.videoUrl,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    socketConnection.emit('group-message', { groupId, text: message.text, imageUrl: message.imageUrl, videoUrl: message.videoUrl }, (res) => {
      setSending(false);
      if (res.success) {
        setMessage({ text: '', imageUrl: '', videoUrl: '' });
      }
    });
  };

  if (!group) return <div className="p-6">Loading group...</div>;

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 h-16 bg-white flex items-center gap-4 px-4 shadow">
  <button onClick={() => navigate('/')} className='flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 mr-2'>
    <FaAngleLeft size={25} />
  </button>
  <Avatar name={group.name} width={48} height={48} />
  <div className='flex flex-col flex-1 min-w-0'>
    <h2 className="font-bold text-lg">{group.name}</h2>
    <div className="text-xs text-gray-500">Members: {group.members.map(m => m.name).join(', ')}</div>
  </div>
</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ backgroundImage: `url(${require('../assets/wallapaper.jpeg')})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 'calc(100vh - 64px - 64px)' }}>
        {messages.map(msg => (
          <div key={msg._id} className={`flex ${msg.msgByUserId._id === user._id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs p-2 rounded-lg ${msg.msgByUserId._id === user._id ? 'bg-[#d9fdd3]' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={msg.msgByUserId.name} imageUrl={msg.msgByUserId.profile_pic} width={24} height={24} />
                <span className="font-semibold text-xs">{msg.msgByUserId.name}</span>
              </div>
              {msg.imageUrl && <div className="mb-1"><FaImage className="inline mr-1" /> <img src={msg.imageUrl} alt="img" className="w-full h-full object-scale-down" /></div>}
              {msg.videoUrl && <div className="mb-1"><FaVideo className="inline mr-1" /> <video src={msg.videoUrl} controls className="w-full h-full object-scale-down" /></div>}
              <div>{msg.text}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Upload image/video preview */}
      {message.imageUrl && (
        <div className="w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden z-20">
          <div className="w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600" onClick={() => setMessage(prev => ({ ...prev, imageUrl: '' }))}>
            <IoClose size={30} />
          </div>
          <div className="bg-white p-3">
            <img src={message.imageUrl} alt="preview" className="aspect-square w-full h-full max-w-sm m-2 object-scale-down" />
          </div>
        </div>
      )}
      {message.videoUrl && (
        <div className="w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden z-20">
          <div className="w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600" onClick={() => setMessage(prev => ({ ...prev, videoUrl: '' }))}>
            <IoClose size={30} />
          </div>
          <div className="bg-white p-3">
            <video
              src={message.videoUrl}
              className="aspect-square w-full h-full max-w-sm m-2 object-scale-down"
              controls
              muted
              autoPlay
            />
          </div>
        </div>
      )}
      {loading && (
        <div className="w-full h-full flex sticky bottom-0 justify-center items-center z-20">
          <span>Uploading...</span>
        </div>
      )}
      <section className="h-16 bg-white flex items-center px-4 sticky bottom-0 z-10">
        <div className="relative">
          <button onClick={() => setOpenImageVideoUpload(prev => !prev)} className="flex justify-center items-center w-11 h-11 rounded-full hover:bg-primary hover:text-white">
            <FaPlus size={20} />
          </button>
          {/* video and image */}
          {openImageVideoUpload && (
            <div className="bg-white shadow rounded absolute bottom-14 w-36 p-2 z-30">
              <form>
                <label htmlFor="uploadImage" className="flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer">
                  <div className="text-primary">
                    <FaImage size={18} />
                  </div>
                  <p>Image</p>
                </label>
                <label htmlFor="uploadVideo" className="flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer">
                  <div className="text-purple-500">
                    <FaVideo size={18} />
                  </div>
                  <p>Video</p>
                </label>
                <input
                  type="file"
                  id="uploadImage"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setLoading(true);
                    const uploadPhoto = await uploadFile(file);
                    setLoading(false);
                    setOpenImageVideoUpload(false);
                    setMessage(prev => ({ ...prev, imageUrl: uploadPhoto.url }));
                  }}
                  className="hidden"
                />
                <input
                  type="file"
                  id="uploadVideo"
                  accept="video/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setLoading(true);
                    const uploadPhoto = await uploadFile(file);
                    setLoading(false);
                    setOpenImageVideoUpload(false);
                    setMessage(prev => ({ ...prev, videoUrl: uploadPhoto.url }));
                  }}
                  className="hidden"
                />
              </form>
            </div>
          )}
        </div>
        {/* input box */}
        <form className="h-full w-full flex gap-2" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type here message..."
            className="py-1 px-4 outline-none w-full h-full"
            value={message.text}
            onChange={e => setMessage(prev => ({ ...prev, text: e.target.value }))}
            disabled={sending}
          />
          <button className="text-primary hover:text-secondary" disabled={sending}>
            <IoMdSend size={28} />
          </button>
        </form>
      </section>
    </div>
  );
};

export default GroupChatPage;
