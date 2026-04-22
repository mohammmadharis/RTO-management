import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { enqueueSnackbar('Enter email and password', { variant: 'warning' }); return; }
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.user, res.data.accessToken);
      enqueueSnackbar(`Welcome back, ${res.data.user.name}!`, { variant: 'success' });
      navigate('/');
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.error || 'Login failed', { variant: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Box className="login-bg" display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ width: 420, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, background: 'linear-gradient(135deg, #1565c0, #1e88e5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight={900} color="white">RP</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700}>RTO Patel Service</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Box>
          <form onSubmit={handleLogin}>
            <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email"
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }} />
            <TextField label="Password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)}
              type={showPw ? 'text' : 'password'} autoComplete="current-password"
              InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPw(!showPw)}>{showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3, py: 1.3 }} disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
