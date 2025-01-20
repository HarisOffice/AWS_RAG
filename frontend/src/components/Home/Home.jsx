import React from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { QuizOutlined, MenuBook, History } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh', // Full viewport height
        textAlign: 'center', // Center text
        px: 2, // Add padding for smaller screens
      }}
    >
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          bgcolor: 'transparent',
          width: '100%',
          maxWidth: 800, // Limit the width for better readability
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Your All-in-One Exam Preparation Assistant
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Generate custom papers, access past questions, and master your subjects with our
          comprehensive question bank and intelligent paper generator.
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/quiz')}
              startIcon={<QuizOutlined />}
            >
              Start Practice
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" size="large" onClick={() => navigate('/question')}>
              Explore Questions
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Features Grid */}
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <QuizOutlined sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              MCQs & Fill-in-the-Blanks
            </Typography>
            <Typography color="text.secondary">
              Comprehensive collection of multiple-choice questions and fill-in-the-blank exercises
              across various subjects.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <MenuBook sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Short & Long Questions
            </Typography>
            <Typography color="text.secondary">
              Curated collection of short and long-form questions to help you master conceptual
              understanding.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <History sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Past Papers Access
            </Typography>
            <Typography color="text.secondary">
              Access to previous years' papers to understand exam patterns and prepare effectively.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
