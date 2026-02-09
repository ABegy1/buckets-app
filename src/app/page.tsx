'use client';

import React from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

const HomePage = () => {
  const router = useRouter();

  return (
    <Box sx={{ width: 420, mx: 'auto', mt: 10, p: 4, borderRadius: 3, boxShadow: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
        Buckets
      </Typography>
      <Typography variant="body1" color="textSecondary" textAlign="center" gutterBottom>
        Authentication is disabled for this domain. Choose where you want to go.
      </Typography>

      <Stack spacing={2} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => router.push('/Standings')}>
          Open Standings
        </Button>
        <Button variant="outlined" onClick={() => router.push('/Admin')}>
          Open Admin Dashboard
        </Button>
        <Button variant="outlined" onClick={() => router.push('/SeasonSetup')}>
          Open Season Setup
        </Button>
      </Stack>
    </Box>
  );
};

export default HomePage;
