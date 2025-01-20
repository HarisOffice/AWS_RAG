import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user'); // Clear the user's data from localStorage
    navigate('/signin'); // Redirect to sign-in page
  };

  return (
    <button className='MuiButtonBase-root MuiTab-root MuiTab-textColorInherit css-veleun-MuiButtonBase-root-MuiTab-root border-l-red-50 logout' onClick={handleLogout}>Log Out</button>
  );
}

export default LogoutButton;
