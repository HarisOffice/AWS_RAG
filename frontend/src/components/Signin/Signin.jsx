import React from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const providers = [{ id: 'credentials', name: 'Email and password' }];

// Custom sign-in function
const signIn = async (provider, formData) => {
  const email = formData?.get('email');
  const password = formData?.get('password');

  try {
    // Make a POST request to your FastAPI backend
    const response = await fetch('https://ai.myedbox.com/api/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save the user to localStorage
      localStorage.setItem('user', JSON.stringify({ email, name: data.name }));
      return { type: 'CredentialsSignin' }; // Success response
    } else {
      return { type: 'CredentialsSignin', error: data.detail || 'Invalid credentials' }; // Error response
    }
  } catch (error) {
    console.error(error);
    return { type: 'CredentialsSignin', error: 'An error occurred during sign-in' };
  }
};

export default function Signin() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <AppProvider theme={theme}>
      <SignInPage
        signIn={async (provider, formData) => {
          const response = await signIn(provider, formData);
          if (response.type === 'CredentialsSignin' && !response.error) {
            // Redirect on successful login
            navigate('/');
          } else {
            // Handle errors (display them to the user, for example)
            console.error(response.error || 'Unknown error during sign-in');
          }
        }}
        providers={providers}
      />
    </AppProvider>
  );
}
