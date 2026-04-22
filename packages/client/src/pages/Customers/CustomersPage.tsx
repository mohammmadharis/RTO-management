import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, TextField, InputAdornment, Avatar, alpha,
  CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Visibility as ViewIcon, Upload as UploadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api';
import { formatCurrency } from '../../utils/helpers';

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => { const res = await customersApi.list({ search, limit: 200 }); return res.data.data; },
  });

  const list = (customers || []) as any[];

  const getPaymentChip = (c: any) => {
    const svc = c.services?.[0];
    if (!svc) return <Chip label="No Service" size="small" />;
    const paid = (svc.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
    const due = svc.agreedFee - paid;
    if (due <= 0) return <Chip label="PAID" size="small" color="success" />;
    if (paid > 0) return <Chip label="DUE" size="small" color="warning" />;
    return <Chip label="PENDING" size="small" color="error" />;
  };


  return (
    <Box className="fade-in">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">Customers</Typography>
        <Box display="flex" gap={1.5}>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => navigate('/customers/import')}>
            Bulk Import
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/customers/new')}>
            Add Customer
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 1.5 }}>
          <TextField fullWidth size="small" placeholder="Search by name, phone, code, vehicle..." value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>Code</TableCell><TableCell>Customer</TableCell><TableCell>Phone</TableCell>
              <TableCell>Vehicle</TableCell><TableCell>Service</TableCell><TableCell>Payment</TableCell>
              <TableCell>Due</TableCell><TableCell>City</TableCell><TableCell align="center">Action</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No customers found</Typography></TableCell></TableRow>
              ) : list.map((c: any) => {
                const svc = c.services?.[0];
                const paid = svc ? (svc.payments || []).reduce((s: number, p: any) => s + p.amount, 0) : 0;
                const due = svc ? svc.agreedFee - paid : 0;
                return (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>{c.customerCode}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}>{c.name?.charAt(0)?.toUpperCase()}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{c.phone}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{c.vehicleNumber || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{svc?.service?.name || '—'}</Typography></TableCell>
                    <TableCell>{getPaymentChip(c)}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={due > 0 ? 700 : 400} color={due > 0 ? 'error.main' : 'text.secondary'}>{due > 0 ? formatCurrency(due) : '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.city || '—'}</Typography></TableCell>
                    <TableCell align="center">
                      <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/customers/${c.id}`)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default CustomersPage;
