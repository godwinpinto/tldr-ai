import React, { useState, useEffect } from 'react';
import { Button, Input, Spinner } from '@nextui-org/react';
import { useNavigate } from 'react-router-dom';
import { getUrl } from '../utils';

const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    if (storedName) {
      navigate('/chat'); // Redirect to ChatPage if name is present
    }
  }, [navigate]);

  const handleSubmit = async () => {
    if (name.trim()) {
      setLoading(true); // Show loader

      try {
        const response = await fetch(getUrl('/api/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_name: name }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        localStorage.setItem('name', name);
        localStorage.setItem('user_id', data.user_id); // Store user_id in localStorage

        navigate('/chat'); // Redirect to ChatPage
      } catch (error) {
        console.error('Error:', error);
        // Optionally handle the error (e.g., show an alert or message to the user)
      } finally {
        setLoading(false); // Hide loader
      }
    }
  };

  return (
    <div className="h-lvh w-lvw flex flex-col justify-center items-center text-slate-50 bg-[#3B3B3B] px-4">
      <Input
        key="outside"
        type="text"
        label="Your Name"
        labelPlacement="outside"
        placeholder="Enter your name"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />

      <Button onClick={handleSubmit} color="warning" className='w-full mt-4'>
        {loading ? <Spinner /> : 'Login'}
      </Button>
    </div>
  );
};

export default LoginPage;
