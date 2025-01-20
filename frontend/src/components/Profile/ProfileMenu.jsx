import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, Avatar, Box } from '@mui/material';
import LogoutButton from '../Logout/LogoutButton'; // Import your LogoutButton component

export default function ProfileMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  // Open the menu when avatar is clicked
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  // Close the menu
  const handleClose = () => {
    setOpen(false);
  };

  // Focus management: return focus to the avatar when menu is closed
  useEffect(() => {
    if (!open) {
      const avatarElement = document.getElementById('avatar-id');
      if (avatarElement) {
        avatarElement.focus(); // Ensure focus returns to avatar when the menu is closed
      }
    }
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Avatar that triggers the menu */}
      <Avatar
        id="avatar-id"
        alt="User Avatar"
        sx={{
          cursor: 'pointer',
          width: 40,
          height: 40,
        }}
        onClick={handleClick}
        tabIndex={0}  // Ensure it is focusable
      >{user ? user.name.charAt(0).toUpperCase() : ""}</Avatar>

      {/* Menu component for dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right', // Align menu to the right of the avatar
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right', // Ensure the menu opens to the right
        }}
        MenuListProps={{
          sx: {
            padding: 0,
          },
        }}
        PaperProps={{
          sx: {
            pointerEvents: open ? 'auto' : 'none', // Prevent interaction when menu is closed
            visibility: open ? 'visible' : 'hidden', // Hide when closed
          },
          inert: open ? undefined : 'true', // Inert when menu is closed
        }}
        disableAutoFocusItem={true}
        disableScrollLock={true}
      >
        {/* MenuItem containing LogoutButton */}
        <MenuItem onClick={handleClose}>
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <LogoutButton />
          </Box>
        </MenuItem>
      </Menu>
    </div>
  );
}
