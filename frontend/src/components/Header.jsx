import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useLocation } from "react-router-dom";
import ProfileMenu from "./Profile/ProfileMenu"; // Import ProfileMenu

export default function Header() {
  const location = useLocation();
  const [value, setValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    switch (location.pathname) {
      // case "/mcqs-blanks":
      // case "/quiz":
      //   setValue(1);
      //   break;
      // case "/long-short-questions":
      // case "/question":
      //   setValue(2);
      //   break;
      // case "/paper":
      //   setValue(3);
      //   break;
      // case "/analytics":
      //   setValue(4);
      //   break;
      case "/assistant":
        setValue(1);
        break;
      case "/history":
        setValue(2);
        break;
      case "/export":
        setValue(3);
        break;
      default:
        setValue(0);
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { label: "Home", path: "/" },
    // { label: "MCQs/Blanks", path: "/quiz" },
    // { label: "Long & Short Questions", path: "/question" },
    // { label: "Paper Generation", path: "/paper" },
    // { label: "Analytics", path: "/analytics" },
    { label: "Assistant", path: "/assistant" },
    { label: "History", path: "/history" },
    { label: "Export", path: "/export" },
  ];

  return (
    <AppBar sx={{ background: "rgb(83, 167, 235)" }} className="MuiAppBar-root">
      <Toolbar
        sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <QuizIcon sx={{ mr: 2 }} />
          {!isMobile ? (
            <Tabs
              textColor="inherit"
              value={value}
              onChange={(e, newValue) => setValue(newValue)}
              indicatorColor="secondary"
            >
              {menuItems.map((item, index) => (
                <Tab
                  key={index}
                  label={item.label}
                  component={Link}
                  to={item.path}
                />
              ))}
            </Tabs>
          ) : (
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
        <Box>
          <ProfileMenu />
        </Box>
      </Toolbar>
      <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
        <List>
          {menuItems.map((item, index) => (
            <ListItem
              button
              key={index}
              component={Link}
              to={item.path}
              onClick={handleDrawerToggle}
            >
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </AppBar>
  );
}
