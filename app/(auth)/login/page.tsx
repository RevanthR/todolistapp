'use client';

import { useState } from 'react';
import OtpInput from '@/components/OtpInput';

type Step = 'phone' | 'otp' | 'name';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  async function handleSendOTP() {
    setError('');
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep('otp');
    } else {
      setError(data.error ?? 'Failed to send OTP');
    }
  }

  async function handleVerifyOTP() {
    setError('');
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      if (data.isNewUser) {
        setStep('name');
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      setError(data.error ?? 'Invalid OTP');
    }
  }

  async function handleSetName() {
    setError('');
    if (name.trim().length < 2) {
      setError('Enter your name (at least 2 characters)');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      setError('Failed to save your name. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Grow Together</h1>
        <p className="text-sm text-gray-500 mt-1">Weekly progress tracker for friend groups</p>
      </div>

      <div className="w-full max-w-sm">
        {step === 'phone' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile number</label>
              <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden focus-within:border-indigo-500 transition-colors">
                <span className="bg-gray-50 px-3 flex items-center text-gray-500 text-sm font-medium border-r border-gray-200">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  className="flex-1 px-3 py-3.5 text-gray-900 focus:outline-none text-base bg-white"
                  autoComplete="tel-national"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-opacity active:scale-95"
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                OTP sent to <span className="font-semibold">+91 {phone}</span>
              </p>
              <button
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="text-sm text-indigo-600 font-medium"
              >
                Change number
              </button>
            </div>
            {devOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800">
                <span className="font-medium">Dev mode OTP: </span>
                <span className="font-mono font-bold tracking-widest">{devOtp}</span>
              </div>
            )}
            <OtpInput value={otp} onChange={setOtp} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-opacity active:scale-95"
            >
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full text-sm text-gray-500 font-medium py-2"
            >
              Resend OTP
            </button>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-500 mb-5">
                Welcome! 👋 What should your friends call you?
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your name</label>
              <input
                type="text"
                placeholder="e.g. Ravi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetName()}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-900 text-base"
                autoFocus
                autoComplete="name"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSetName}
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-opacity active:scale-95"
            >
              {loading ? 'Saving…' : "Let's go →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
