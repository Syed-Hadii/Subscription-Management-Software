import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Alert,
} from '@material-tailwind/react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/configs/base-url';
import { useAuth } from '@/context/AuthContext';

export function SignIn() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    resetEmail: '',
    resetCode: '',
    newPassword: '',
  });
  const [mode, setMode] = useState('login'); // 'login', 'forgot', 'reset'
  const [message, setMessage] = useState({ text: '', type: '' }); // For success/error messages
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const { login } = useAuth();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (!result.success) {
      setMessage({ text: result.error, type: 'error' });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, {
        email: form.resetEmail,
      });
      setMessage({ text: response.data.msg, type: 'success' });
      setMode('reset');
    } catch (err) {
      setMessage({ text: err.response?.data?.msg || 'Failed to send reset code', type: 'error' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/auth/reset-password`, {
        email: form.resetEmail,
        code: form.resetCode,
        newPassword: form.newPassword,
      });
      setMessage({ text: response.data.msg, type: 'success' });
      setTimeout(() => setMode('login'), 1000);
    } catch (err) {
      setMessage({ text: err.response?.data?.msg || 'Failed to reset password', type: 'error' });
    }
  };

  return (
    <section className="m-8 flex gap-4">
      <div className="w-full lg:w-3/5 mt-24">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">
            {mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
          </Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            {mode === 'login' ? 'Enter your email and password to Sign In.' : 
             mode === 'forgot' ? 'Enter your email to receive a reset code.' : 
             'Enter the reset code and new password.'}
          </Typography>
        </div>
        {message.text && (
          <Alert color={message.type === 'success' ? 'green' : 'red'} className="mt-4">
            {message.text}
          </Alert>
        )}
        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={mode === 'login' ? handleLogin : mode === 'forgot' ? handleForgotPassword : handleResetPassword}>
          <div className="mb-1 flex flex-col gap-6">
            {mode !== 'reset' && (
              <>
                <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
                  Your email
                </Typography>
                <Input
                  size="lg"
                  name={mode === 'login' ? 'email' : 'resetEmail'}
                  value={mode === 'login' ? form.email : form.resetEmail}
                  onChange={handleChange}
                  placeholder="name@mail.com"
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                  labelProps={{
                    className: 'before:content-none after:content-none',
                  }}
                />
              </>
            )}
            {mode === 'login' && (
              <>
                <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
                  Password
                </Typography>
                <Input
                  type="password"
                  size="lg"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="********"
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                  labelProps={{
                    className: 'before:content-none after:content-none',
                  }}
                />
              </>
            )}
            {mode === 'reset' && (
              <>
                <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
                  Reset Code
                </Typography>
                <Input
                  size="lg"
                  name="resetCode"
                  value={form.resetCode}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                  labelProps={{
                    className: 'before:content-none after:content-none',
                  }}
                />
                <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
                  New Password
                </Typography>
                <Input
                  type="password"
                  size="lg"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="********"
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                  labelProps={{
                    className: 'before:content-none after:content-none',
                  }}
                />
              </>
            )}
          </div>
          {mode === 'login' && (
            <div className="flex items-center justify-between gap-2 mt-6">
              <Typography variant="small" className="font-medium text-gray-900">
                <a href="#" onClick={() => setMode('forgot')}>
                  Forgot Password
                </a>
              </Typography>
            </div>
          )}
          <Button className="mt-6" fullWidth type="submit">
            {mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Send Reset Code' : 'Reset Password'}
          </Button>
          {mode !== 'login' && (
            <Button variant="text" className="mt-4" onClick={() => setMode('login')}>
              Back to Sign In
            </Button>
          )}
        </form>
      </div>
      <div className="w-2/5 h-full hidden lg:block">
        <img
          src="/img/pattern.png"
          className="h-full w-full object-cover rounded-3xl"
          alt="Background"
        />
      </div>
    </section>
  );
}

export default SignIn;