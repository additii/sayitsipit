import React, { useState } from 'react';

export default function SayItSipItApp() {
  const [transcript, setTranscript] = useState('');
  const [order, setOrder] = useState(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speech = recognition ? new recognition() : null;

  const handleListen = () => {
    if (!speech) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    setOrder(null);
    setTranscript('');
    setListening(true);
    setError(null);

    speech.start();

    speech.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setTranscript(speechResult);
      fetchOrder(speechResult);
    };

    speech.onend = () => {
      setListening(false);
    };
  };

  const fetchOrder = async (spokenText) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: spokenText })
      });
      const data = await response.json();
      if (response.ok) {
        setOrder(data.drink);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to backend.');
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Say it. Sip it! ☕</h1>

      <button
        onClick={handleListen}
        disabled={listening}
        className="bg-green-600 text-white px-6 py-3 rounded-full shadow-md hover:bg-green-700"
      >
        {listening ? 'Listening...' : 'Speak Your Order'}
      </button>

      {transcript && (
        <p className="mt-4 text-gray-700">🎙️ You said: <strong>{transcript}</strong></p>
      )}

      {order && (
        <div className="mt-6 bg-gray-50 p-4 rounded shadow-md w-full max-w-md">
          <h2 className="text-xl font-semibold">Your Order:</h2>
          <ul className="mt-2 space-y-1">
            <li><strong>Name:</strong> {order.name}</li>
            <li><strong>Category:</strong> {order.category}</li>
            <li><strong>Calories:</strong> {order.calories}</li>
            <li><strong>Sugar:</strong> {order.sugar}</li>
            <li><strong>Caffeine:</strong> {order.caffeine}</li>
            <li><strong>Fat:</strong> {order.fat}</li>
            <li><strong>Ingredients:</strong> {order.ingredients}</li>
          </ul>
        </div>
      )}

      {error && <p className="mt-4 text-red-600">❌ {error}</p>}
    </div>
  );
}
