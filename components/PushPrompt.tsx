'use client';

import { useEffect, useState } from 'react';

export default function PushPrompt() {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'default') return;
    // Show prompt after 3 seconds
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  async function enable() {
    setSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setShow(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      setShow(false);
    } catch (err) {
      console.error('Push subscribe error:', err);
    }
    setSubscribing(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto bg-white rounded-2xl shadow-lg border border-indigo-100 p-4 z-40">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Stay in the loop</p>
          <p className="text-xs text-gray-500 mt-0.5">Get notified when group members complete their goals</p>
        </div>
        <button onClick={() => setShow(false)} className="text-gray-300 hover:text-gray-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={enable}
          disabled={subscribing}
          className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
        >
          {subscribing ? 'Enabling…' : 'Enable notifications'}
        </button>
        <button
          onClick={() => setShow(false)}
          className="px-4 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-xl"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
