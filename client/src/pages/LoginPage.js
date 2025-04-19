import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PiUserCircle } from 'react-icons/pi';
import { useDispatch } from 'react-redux';
import { setToken } from '../redux/userSlice';

const LoginPage = () => {
  const [data, setData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Step 1: Validate email and get userId
      const emailRes = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/email`,
        { email: data.email }
      );
      if (!emailRes.data.success) {
        toast.error(emailRes.data.message || 'Invalid email');
        setLoading(false);
        return;
      }
      const userId = emailRes.data.data?._id;
      // Step 2: Validate password
      const passRes = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/password`,
        { userId, password: data.password },
        { withCredentials: true }
      );
      if (passRes.data.success) {
        dispatch(setToken(passRes.data.token));
        localStorage.setItem('token', passRes.data.token);
        localStorage.setItem('isAdmin', passRes.data.isAdmin === true);
        toast.success(passRes.data.message);
        setData({ email: '', password: '' });
        if (passRes.data.isAdmin === true) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        toast.error(passRes.data.message || 'Login failed');
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'Login failed, please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5">
      <div className="bg-white w-full max-w-md rounded overflow-hidden p-4 mx-auto">
        <div className="w-fit mx-auto mb-2">
          <PiUserCircle size={80} />
        </div>
        <h3>Welcome to Chat app!</h3>
        <form className="grid gap-4 mt-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="email">Email :</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="enter your email"
              className="bg-slate-100 px-2 py-1 focus:outline-primary"
              value={data.email}
              onChange={handleOnChange}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password">Password :</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="enter your password"
              className="bg-slate-100 px-2 py-1 focus:outline-primary"
              value={data.password}
              onChange={handleOnChange}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-lg px-4 py-1 hover:bg-secondary rounded mt-2 font-bold text-white leading-relaxed tracking-wide"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="my-3 text-center">
          <Link to={"/forgot-password"} className="hover:text-primary font-semibold">
            Forgot password ?
          </Link>
        </p>
        <p className="my-3 text-center">
          New User ?{' '}
          <Link to={"/register"} className="hover:text-primary font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
