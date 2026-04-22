import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment, Avatar, alpha, CircularProgress, FormControl, InputLabel, Select, MenuItem, TablePagination } from '@mui/material';
import { Search as SearchIcon, Assignment as ServiceIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customerServicesApi } from '../../api';
import { formatCurrency, formatDate, formatStatus, daysUntil } from '../../utils/helpers';

const CustomerServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Per-tab pagination state
  const [page0, setPage0] = useState(0);
  const [page1, setPage1] = useState(0);
  const [page2, setPage2] = useState(0);
  const [rowsPerPage0, setRowsPerPage0] = useState(10);
  const [rowsPerPage1, setRowsPerPage1] = useState(10);
  const [rowsPerPage2, setRowsPerPage2] = useState(10);

  const pages = [page0, page1, page2];
  const rowsPerPages = [rowsPerPage0, rowsPerPage1, rowsPerPage2];
  const setPages = [setPage0, setPage1, setPage2];
  const setRowsPerPages = [setRowsPerPage0, setRowsPerPage1, setRowsPerPage2];

  const { data: allServices, isLoading: loadingAll } = useQuery({
    queryKey: ['customer-services', search, status],
    queryFn: async () => { const res = await customerServicesApi.list({ search, status: status || undefined, limit: 200 }); return res.data.data; },
  });

  const { data: expiringServices, isLoading: loadingExp } = useQuery({
    queryKey: ['expiring-services'],
    queryFn: async () => { const res = await customerServicesApi.getExpiring(30); return res.data.data; },
  });

  const isLoading = tab === 0 ? loadingAll : loadingExp;
  const fullList = tab === 0
    ? (allServices || []) as any[]
    : tab === 1
      ? ((expiringServices || []) as any[]).filter((cs: any) => daysUntil(cs.expiryDate) > 0)
      : ((expiringServices || []) as any[]).filter((cs: any) => daysUntil(cs.expiryDate) <= 0);

  const page = pages[tab];
  const rowsPerPage = rowsPerPages[tab];
  const list = fullList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const renderTable = () => (
    <>
    <TableContainer>
      <Table>
        <TableHead><TableRow>
          <TableCell>Customer</TableCell><TableCell>Service</TableCell><TableCell>Status</TableCell>
          <TableCell>Fee</TableCell><TableCell>Paid</TableCell><TableCell>Due</TableCell>
          <TableCell>Expiry</TableCell><TableCell>Days Left</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
          ) : list.length === 0 ? (
            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No services found</Typography></TableCell></TableRow>
          ) : list.map((cs: any) => {
            const paid = (cs.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
            const due = cs.agreedFee - paid;
            const days = cs.expiryDate ? daysUntil(cs.expiryDate) : null;
            return (
              <TableRow key={cs.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${cs.customer?.id}`)}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}>{cs.customer?.name?.charAt(0)}</Avatar>
                    <Box><Typography variant="body2" fontWeight={600}>{cs.customer?.name}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>{cs.customer?.customerCode}</Typography></Box>
                  </Box>
                </TableCell>
                <TableCell>{cs.service?.name}</TableCell>
                <TableCell><Chip label={formatStatus(cs.status)} size="small" color={cs.status === 'COMPLETED' ? 'success' : cs.status === 'IN_PROGRESS' ? 'info' : 'default'} /></TableCell>
                <TableCell>{formatCurrency(cs.agreedFee)}</TableCell>
                <TableCell><Typography color="success.main" fontWeight={600}>{formatCurrency(paid)}</Typography></TableCell>
                <TableCell><Typography color={due > 0 ? 'error.main' : 'success.main'} fontWeight={700}>{formatCurrency(due)}</Typography></TableCell>
                <TableCell>{formatDate(cs.expiryDate)}</TableCell>
                <TableCell>{days !== null ? <Chip label={`${days}d`} size="small" color={days <= 0 ? 'error' : days <= 7 ? 'warning' : 'info'} /> : '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component="div"
      count={fullList.length}
      page={page}
      onPageChange={(_, newPage) => setPages[tab](newPage)}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(e) => {
        setRowsPerPages[tab](parseInt(e.target.value, 10));
        setPages[tab](0);
      }}
      rowsPerPageOptions={[5, 10, 25, 50]}
    />
    </>
  );

  return (
    <Box className="fade-in">
      <Typography variant="h4" mb={3}>Customer Services</Typography>
      <Card sx={{ mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); }} sx={{ px: 2 }}>
          <Tab label="All Services" /><Tab label="Expiring Soon" /><Tab label="Overdue" />
        </Tabs>
      </Card>
      {tab === 0 && (
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Box display="flex" gap={2}>
              <TextField fullWidth size="small" placeholder="Search..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage0(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage0(0); }}>
                  <MenuItem value="">All</MenuItem><MenuItem value="PENDING">Pending</MenuItem><MenuItem value="IN_PROGRESS">In Progress</MenuItem><MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      )}
      <Card>{renderTable()}</Card>
    </Box>
  );
};

export default CustomerServicesPage;
