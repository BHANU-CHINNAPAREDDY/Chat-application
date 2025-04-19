import React, { useState } from 'react';
import Modal from './Modal'; // You may need to create this or use a library/modal pattern
import { useSelector } from 'react-redux';

const CreateGroupModal = ({ open, onClose, onGroupCreated }) => {
  const user = useSelector(state => state.user);
  const socketConnection = useSelector(state => state.user.socketConnection);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open) {
      // Fetch all users except self (for group creation)
      fetch('/api/groups/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(async r => {
          if (!r.ok) {
            const text = await r.text();
            setError('Failed to fetch users: ' + text);
            console.error('User fetch failed:', text);
            setAllUsers([]);
            return;
          }
          return r.json();
        })
        .then(res => {
          if (res && res.success && Array.isArray(res.users)) {
            console.log('Fetched users:', res.users);
setAllUsers(res.users.filter(u =>
  u._id !== user._id &&
  !u.isAdmin &&
  !(u.email && u.email.toLowerCase().includes('admin')) &&
  !(u.name && u.name.toLowerCase().includes('admin'))
));
          } else if (res && res.message) {
            setError('Failed to fetch users: ' + res.message);
            setAllUsers([]);
          }
        })
        .catch(err => {
          setError('Failed to fetch users.');
          setAllUsers([]);
          console.error('User fetch error:', err);
        });
    }
  }, [open, user._id]);

  const handleCreate = () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      setError('Please enter group name and select users');
      return;
    }
    setLoading(true);
    fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ name: groupName, memberIds: selectedUsers }),
    })
      .then(r => r.json())
      .then(res => {
        setLoading(false);
        if (res.success) {
          onGroupCreated(res.group);
          onClose();
        } else {
          setError(res.message || 'Group creation failed');
        }
      });
  };

  if (!open) return null;
  return (
    <Modal onClose={onClose}>
      <div className="p-0 w-full max-w-full">
        <h2 className="font-bold text-lg mb-4">Create Group</h2>
        <input
          className="border rounded px-2 py-1 w-full mb-2"
          placeholder="Group name"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
        />
        <div className="mb-2">
          <div className="font-semibold text-sm mb-1">Add Members</div>
          <div className="max-h-[260px] overflow-y-auto border rounded p-2 w-full">
            {allUsers.map(u => (
              <label key={u._id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(u._id)}
                  onChange={e => {
                    if (e.target.checked) setSelectedUsers([...selectedUsers, u._id]);
                    else setSelectedUsers(selectedUsers.filter(id => id !== u._id));
                  }}
                />
                <span>{u.name} ({u.email})</span>
              </label>
            ))}
          </div>
        </div>
        {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleCreate} disabled={loading}>Create</button>
          <button className="px-4 py-1 border rounded" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;
