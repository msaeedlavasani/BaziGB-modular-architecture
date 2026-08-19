'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading, register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated -> go home (also runs after a successful signup,
  // since register() logs the user in immediately).
  useEffect(() => {
    if (user && !isLoading) router.replace('/');
  }, [user, isLoading, router]);

  function validate(): FormErrors {
    const errors: FormErrors = {};
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address';
    }

    if (!trimmedUsername) {
      errors.username = 'Username is required';
    } else if (trimmedUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await register(email.trim(), username.trim(), password);
      router.replace('/');
    } catch (error: unknown) {
      setServerError(
        error instanceof Error ? error.message : 'Registration failed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={48} thickness={4} color="primary" />
        <Typography color="text.secondary">Checking your session...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {serverError && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
          {serverError}
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={handleSubmit}
        noValidate
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: 'rgba(11, 22, 34, 0.6)',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
            Email
          </Typography>
          <TextField
            fullWidth
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
            variant="outlined"
            size="small"
            InputProps={{
              sx: {
                sx: {
                  bgcolor: 'rgba(3, 10, 21, 0.6)',
                  borderRadius: 2,
                },
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
            Username
          </Typography>
          <TextField
            fullWidth
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. boardmaster"
            error={!!fieldErrors.username}
            helperText={fieldErrors.username}
            variant="outlined"
            size="small"
            InputProps={{
              sx: {
                sx: {
                  bgcolor: 'rgba(3, 10, 21, 0.6)',
                  borderRadius: 2,
                },
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
            Password
          </Typography>
          <TextField
            fullWidth
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
            variant="outlined"
            size="small"
            InputProps={{
              sx: {
                sx: {
                  bgcolor: 'rgba(3, 10, 21, 0.6)',
                  borderRadius: 2,
                },
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
            Confirm Password
          </Typography>
          <TextField
            fullWidth
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            error={!!fieldErrors.confirmPassword}
            helperText={fieldErrors.confirmPassword}
            variant="outlined"
            size="small"
            InputProps={{
              sx: {
                sx: {
                  bgcolor: 'rgba(3, 10, 21, 0.6)',
                  borderRadius: 2,
                },
              },
            }}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          disabled={submitting}
          variant="contained"
          size="large"
          sx={{
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
            background: '#F5A306',
            '&:hover': {
              background: '#B25D16',
            },
          }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
        </Button>
      </Paper>

      <Typography variant="body2" align="center" color="text.secondary">
        Already have an account?{' '}
        <MuiLink
          component={Link}
          href="/login"
          underline="hover"
          sx={{ fontWeight: 600 }}
          color="primary.light"
        >
          Sign in
        </MuiLink>
      </Typography>
    </Box>
  );
}
