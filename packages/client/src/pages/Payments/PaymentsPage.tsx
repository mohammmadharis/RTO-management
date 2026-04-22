import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, TextField,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, Avatar, alpha,
} from '@mui/material';
import {
  Search as SearchIcon, CurrencyRupee as RupeeIcon, TrendingUp as TrendingIcon,
  AccountBalance as BankIcon, Payment as PaymentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { paymentsApi } from '../../api';
import { formatCurrency, formatDate, formatStatus } from '../../utils/helpers';

const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', search, method, dateFrom, dateTo],
    queryFn: async () => {
      const params: any = { limit: 200 };
      if (search) params.search = search;
      if (method) params.paymentMethod = method;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await paymentsApi.list(params);
      return res.data.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: async () => { const res = await paymentsApi.getSummary(); return res.data.data; },
  });

  const list = (payments || []) as any[];
  const totalAmount = list.reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <Box className="fade-in">
      <Typography variant="h4" mb={3}>Payments</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Collected', val: formatCurrency(summary?.totalCollected || 0), color: '#1565c0', icon: <RupeeIcon /> },
          { label: 'This Month', val: formatCurrency(summary?.thisMonth || 0), color: '#2e7d32', icon: <TrendingIcon /> },
          { label: 'Cash', val: formatCurrency(summary?.byCash || 0), color: '#ed6c02', icon: <PaymentIcon /> },
          { label: 'Digital', val: formatCurrency(summary?.byDigital || 0), color: '#7c4dff', icon: <BankIcon /> },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card className="stat-card-hover">
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">{s.label}</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.val}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(s.color, 0.1), color: s.color }}>{s.icon}</Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Method</InputLabel>
                <Select value={method} label="Method" onChange={(e) => setMethod(e.target.value)}>
                  <MenuItem value="">All</MenuItem><MenuItem value="CASH">Cash</MenuItem><MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem><MenuItem value="CHEQUE">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell><TableCell>Service</TableCell><TableCell>Amount</TableCell>
                <TableCell>Type</TableCell><TableCell>Method</TableCell><TableCell>Date</TableCell><TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No payments found</Typography></TableCell></TableRow>
              ) : list.map((p: any) => (
                <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => {
                  const custId = p.customerService?.customer?.id || p.customerService?.customerId;
                  if (custId) navigate('/customers/' + custId);
                }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}>
                        {p.customerService?.customer?.name?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.customerService?.customer?.name || 'N/A'}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>{p.customerService?.customer?.customerCode}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{p.customerService?.service?.name || '—'}</TableCell>
                  <TableCell><Typography fontWeight={700} color="success.main">{formatCurrency(p.amount)}</Typography></TableCell>
                  <TableCell><Chip label={formatStatus(p.paymentType)} size="small" /></TableCell>
                  <TableCell>
                    <Chip label={formatStatus(p.paymentMethod)} size="small" variant="outlined"
                      color={p.paymentMethod === 'CASH' ? 'warning' : p.paymentMethod === 'UPI' ? 'info' : 'default'} />
                  </TableCell>
                  <TableCell>{formatDate(p.paymentDate)}</TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{p.referenceNumber || '—'}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {list.length > 0 && (
          <Box display="flex" justifyContent="flex-end" p={2} sx={{ borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Showing Total: <Typography component="span" color="success.main" fontWeight={800}>{formatCurrency(totalAmount)}</Typography>
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default PaymentsPage;
