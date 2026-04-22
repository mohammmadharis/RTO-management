import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, alpha, TextField, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, IconButton, Tooltip, CircularProgress, Divider,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { usersApi, authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

const SettingsPage: React.FC = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [userDialog, setUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'STAFF', password: '', isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) setProfile({ name: currentUser.name, email: currentUser.email, phone: (currentUser as any).phone || '' });
  }, [currentUser]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const res = await usersApi.list(); return res.data.data; },
    enabled: currentUser?.role === 'ADMIN',
  });

  const saveProfile = async () => {
    setSaving(true);
    try {
      await usersApi.update(currentUser!.id, { name: profile.name, phone: profile.phone });
      const meRes = await authApi.me();
      setAuth(meRes.data.data, useAuthStore.getState().accessToken!);
      enqueueSnackbar('Profile updated', { variant: 'success' });
    } catch (e: any) { enqueueSnackbar(e.response?.data?.error || 'Error', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const userMut = useMutation({
    mutationFn: (data: any) => editingUser ? usersApi.update(editingUser.id, data) : usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setUserDialog(false); enqueueSnackbar(editingUser ? 'User updated' : 'User created', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Error', { variant: 'error' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); enqueueSnackbar('User deleted', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Error', { variant: 'error' }),
  });

  const openAddUser = () => { setEditingUser(null); setUserForm({ name: '', email: '', phone: '', role: 'STAFF', password: '', isActive: true }); setUserDialog(true); };
  const openEditUser = (u: any) => { setEditingUser(u); setUserForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: '', isActive: u.isActive }); setUserDialog(true); };

  return (
    <Box className="fade-in">
      <Typography variant="h4" mb={3}>Settings</Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                <Avatar sx={{ width: 64, height: 64, fontSize: 26, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}>
                  {currentUser?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{currentUser?.name}</Typography>
                  <Chip label={currentUser?.role} size="small" color={currentUser?.role === 'ADMIN' ? 'primary' : 'default'} />
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField label="Name" fullWidth value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
                <TextField label="Email" fullWidth value={profile.email} disabled />
                <TextField label="Phone" fullWidth value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} />
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} onClick={saveProfile} disabled={saving}>
                  Save Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {currentUser?.role === 'ADMIN' && (
          <Grid item xs={12} md={7}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="h6">User Management</Typography>
              <Button size="small" startIcon={<PersonAddIcon />} onClick={openAddUser}>Add User</Button>
            </Box>
            <Card>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow>
                    <TableCell>User</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell>
                    <TableCell>Active</TableCell><TableCell align="center">Actions</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                    ) : (users || []).map((u: any) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}>{u.name?.charAt(0)?.toUpperCase()}</Avatar>
                            <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                        <TableCell><Chip label={u.role} size="small" color={u.role === 'ADMIN' ? 'primary' : 'default'} /></TableCell>
                        <TableCell><Chip label={u.isActive ? 'Active' : 'Inactive'} size="small" color={u.isActive ? 'success' : 'default'} /></TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditUser(u)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          {u.id !== currentUser?.id && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => { if (window.confirm('Delete user "' + u.name + '"?')) deleteMut.mutate(u.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField label="Name" fullWidth required value={userForm.name} onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label="Email" fullWidth required value={userForm.email} onChange={(e) => setUserForm(f => ({ ...f, email: e.target.value }))} type="email" disabled={!!editingUser} />
            <TextField label="Phone" fullWidth value={userForm.phone} onChange={(e) => setUserForm(f => ({ ...f, phone: e.target.value }))} />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={userForm.role} label="Role" onChange={(e) => setUserForm(f => ({ ...f, role: e.target.value }))}>
                <MenuItem value="ADMIN">Admin</MenuItem><MenuItem value="STAFF">Staff</MenuItem>
              </Select>
            </FormControl>
            <TextField label={editingUser ? 'New Password (leave blank to keep)' : 'Password'} fullWidth value={userForm.password}
              onChange={(e) => setUserForm(f => ({ ...f, password: e.target.value }))} type="password" required={!editingUser} />
            <FormControlLabel control={<Switch checked={userForm.isActive} onChange={(e) => setUserForm(f => ({ ...f, isActive: e.target.checked }))} />} label="Active" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={userMut.isPending} onClick={() => {
            if (!userForm.name || !userForm.email) { enqueueSnackbar('Name and email required', { variant: 'warning' }); return; }
            if (!editingUser && !userForm.password) { enqueueSnackbar('Password required', { variant: 'warning' }); return; }
            const payload: any = { name: userForm.name, phone: userForm.phone || undefined, role: userForm.role, isActive: userForm.isActive };
            if (!editingUser) { payload.email = userForm.email; }
            if (userForm.password) { payload.password = userForm.password; }
            userMut.mutate(payload);
          }}>{userMut.isPending ? <CircularProgress size={20} /> : editingUser ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
