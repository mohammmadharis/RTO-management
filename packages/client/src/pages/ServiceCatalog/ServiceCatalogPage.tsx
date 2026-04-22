import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, IconButton, Avatar, alpha, Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Category as CategoryIcon, CurrencyRupee as RupeeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { servicesApi } from '../../api';
import { formatCurrency, rupeesToPaise, paiseToRupees } from '../../utils/helpers';

const ServiceCatalogPage: React.FC = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', defaultFee: '', hasExpiry: true, validityDays: '365', isActive: true });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', search],
    queryFn: async () => { const res = await servicesApi.list({ search }); return res.data.data; },
  });

  const saveMut = useMutation({
    mutationFn: (data: any) => editing ? servicesApi.update(editing.id, data) : servicesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setOpen(false); enqueueSnackbar(editing ? 'Service updated' : 'Service created', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Error', { variant: 'error' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => servicesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); enqueueSnackbar('Service deleted', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Error', { variant: 'error' }),
  });

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', defaultFee: '', hasExpiry: true, validityDays: '365', isActive: true }); setOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ name: s.name, description: s.description || '', defaultFee: String(paiseToRupees(s.defaultFee)), hasExpiry: s.hasExpiry, validityDays: String(s.validityDays || 365), isActive: s.isActive }); setOpen(true); };
  const handleSave = () => {
    if (!form.name || !form.defaultFee) { enqueueSnackbar('Name and fee are required', { variant: 'warning' }); return; }
    saveMut.mutate({ name: form.name, description: form.description || undefined, defaultFee: rupeesToPaise(parseFloat(form.defaultFee)), hasExpiry: form.hasExpiry, validityDays: form.hasExpiry ? parseInt(form.validityDays) || 365 : null, isActive: form.isActive });
  };

  const list = (services || []) as any[];

  return (
    <Box className="fade-in">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Service Catalog</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Service</Button>
      </Box>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 1.5 }}>
          <TextField fullWidth size="small" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell><TableCell>Description</TableCell><TableCell>Default Fee</TableCell>
                <TableCell>Expiry</TableCell><TableCell>Validity</TableCell><TableCell>Status</TableCell><TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No services found</Typography></TableCell></TableRow>
              ) : list.map((s: any) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}><CategoryIcon fontSize="small" /></Avatar>
                      <Typography fontWeight={600}>{s.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description || '—'}</Typography></TableCell>
                  <TableCell><Typography fontWeight={700}>{formatCurrency(s.defaultFee)}</Typography></TableCell>
                  <TableCell><Chip label={s.hasExpiry ? 'Yes' : 'No'} size="small" color={s.hasExpiry ? 'info' : 'default'} /></TableCell>
                  <TableCell>{s.hasExpiry ? s.validityDays + ' days' : '—'}</TableCell>
                  <TableCell><Chip label={s.isActive ? 'Active' : 'Inactive'} size="small" color={s.isActive ? 'success' : 'default'} /></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => { if (window.confirm('Delete "' + s.name + '"?')) deleteMut.mutate(s.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField label="Service Name" fullWidth required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label="Description" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            <TextField label="Default Fee" fullWidth required value={form.defaultFee} onChange={(e) => setForm(f => ({ ...f, defaultFee: e.target.value }))} type="number"
              InputProps={{ startAdornment: <InputAdornment position="start"><RupeeIcon fontSize="small" /></InputAdornment> }} />
            <FormControlLabel control={<Switch checked={form.hasExpiry} onChange={(e) => setForm(f => ({ ...f, hasExpiry: e.target.checked }))} />} label="Has Expiry" />
            {form.hasExpiry && <TextField label="Validity (Days)" fullWidth value={form.validityDays} onChange={(e) => setForm(f => ({ ...f, validityDays: e.target.value }))} type="number" />}
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />} label="Active" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saveMut.isPending}>
            {saveMut.isPending ? <CircularProgress size={20} /> : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceCatalogPage;
