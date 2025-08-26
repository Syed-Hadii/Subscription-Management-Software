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
  const [mode, setMode] = useState('login'); 
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (!result.success) {
      setMessage({ text: result.error, type: 'error' });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`http://93.127.216.35:5000/auth/forgot-password`, {
        email: form.resetEmail,
      });
      setMessage({ text: response.data.msg, type: 'success' });
      setMode('reset');
    } catch (err) {
      setMessage({
        text: err.response?.data?.msg || 'Failed to send reset code',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`http://93.127.216.35:5000/auth/reset-password`, {
        email: form.resetEmail,
        code: form.resetCode,
        newPassword: form.newPassword,
      });
      setMessage({ text: response.data.msg, type: 'success' });
      setTimeout(() => setMode('login'), 1000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.msg || 'Failed to reset password',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="m-8 flex gap-4">
      <div className="w-full lg:w-3/5 mt-24">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">
            {mode === 'login'
              ? 'Sign In'
              : mode === 'forgot'
              ? 'Forgot Password'
              : 'Reset Password'}
          </Typography>
          <Typography
            variant="paragraph"
            color="blue-gray"
            className="text-lg font-normal"
          >
            {mode === 'login'
              ? 'Enter your email and password to Sign In.'
              : mode === 'forgot'
              ? 'Enter your email to receive a reset code.'
              : 'Enter the reset code and new password.'}
          </Typography>
        </div>
        {message.text && (
          <Alert
            color={message.type === 'success' ? 'green' : 'red'}
            className="mt-4"
          >
            {message.text}
          </Alert>
        )}
        <form
          className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2"
          onSubmit={
            mode === 'login'
              ? handleLogin
              : mode === 'forgot'
              ? handleForgotPassword
              : handleResetPassword
          }
        >
          <div className="mb-1 flex flex-col gap-6">
            {mode !== 'reset' && (
              <>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="-mb-3 font-medium"
                >
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
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="-mb-3 font-medium"
                >
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
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="-mb-3 font-medium"
                >
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
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="-mb-3 font-medium"
                >
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

          {/* 🔥 Button with loading spinner */}
          <Button className="mt-6 flex items-center justify-center" fullWidth type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <span>Processing...</span>
              </div>
            ) : mode === 'login'
              ? 'Sign In'
              : mode === 'forgot'
              ? 'Send Reset Code'
              : 'Reset Password'}
          </Button>

          {mode !== 'login' && (
            <Button
              variant="text"
              className="mt-4"
              onClick={() => setMode('login')}
            >
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
