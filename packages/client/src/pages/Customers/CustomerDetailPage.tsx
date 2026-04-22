import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Avatar, alpha, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, CircularProgress, IconButton, Tooltip, Divider, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { ArrowBack as BackIcon, Add as AddIcon, CurrencyRupee as RupeeIcon, Phone as PhoneIcon, WhatsApp as WhatsAppIcon, Email as EmailIcon, Home as HomeIcon, DirectionsCar as CarIcon, Assignment as ServiceIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { customersApi, customerServicesApi, paymentsApi, servicesApi } from '../../api';
import { formatCurrency, formatDate, rupeesToPaise, paiseToRupees, formatStatus, daysUntil } from '../../utils/helpers';

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box display="flex" alignItems="center" gap={1.5} py={0.8}>
    <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
    <Box><Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography></Box>
  </Box>
);

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [assignOpen, setAssignOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedCs, setSelectedCs] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ serviceId: '', agreedFee: '', startDate: new Date().toISOString().split('T')[0], expiryDate: '', reminderDays: 15 });
  const [payForm, setPayForm] = useState({ amount: '', paymentType: 'PARTIAL', paymentMethod: 'CASH', paymentDate: new Date().toISOString().split('T')[0], referenceNumber: '' });

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => { const res = await customersApi.getById(id!); return res.data.data; },
    enabled: !!id,
  });

  const { data: services } = useQuery({
    queryKey: ['services-all'],
    queryFn: async () => { const res = await servicesApi.list({ limit: 100 }); return res.data.data; },
  });

  const assignMut = useMutation({
    mutationFn: (data: any) => customerServicesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', id] }); setAssignOpen(false); enqueueSnackbar('Service assigned!', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Error', { variant: 'error' }),
  });

  const payMut = useMutation({
    mutationFn: (data: any) => paymentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer', id] }); setPayOpen(false); enqueueSnackbar('Payment recorded!', { variant: 'success' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Error', { variant: 'error' }),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>;
  if (!customer) return <Typography color="error" p={3}>Customer not found</Typography>;

  const c = customer as any;
  const custServices = c.services || [];
  const totalAgreed = custServices.reduce((s: number, cs: any) => s + cs.agreedFee, 0);
  const totalPaid = custServices.reduce((s: number, cs: any) => s + (cs.payments || []).reduce((ps: number, p: any) => ps + p.amount, 0), 0);
  const totalDue = totalAgreed - totalPaid;

  return (
    <Box className="fade-in">
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <IconButton onClick={() => navigate('/customers')}><BackIcon /></IconButton>
        <Typography variant="h4">Customer Details</Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ width: 56, height: 56, fontSize: 22, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}>{c.name?.charAt(0)?.toUpperCase()}</Avatar>
                <Box><Typography variant="h6" fontWeight={700}>{c.name}</Typography>
                  <Chip label={c.customerCode} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} color="primary" /></Box>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={c.phone} />
              <InfoRow icon={<WhatsAppIcon fontSize="small" />} label="WhatsApp" value={c.whatsappNumber} />
              <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={c.email} />
              <InfoRow icon={<HomeIcon fontSize="small" />} label="Address" value={[c.address, c.city].filter(Boolean).join(', ')} />
              <Divider sx={{ my: 1.5 }} />
              <InfoRow icon={<CarIcon fontSize="small" />} label="Vehicle" value={`${c.vehicleNumber || '—'} (${c.vehicleType})`} />
              {c.vehicleBrand && <InfoRow icon={<CarIcon fontSize="small" />} label="Brand / Model" value={`${c.vehicleBrand} ${c.vehicleModel || ''}`} />}
              {c.dlNumber && <InfoRow icon={<ServiceIcon fontSize="small" />} label="DL Number" value={c.dlNumber} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {[
              { label: 'Total Agreed', val: formatCurrency(totalAgreed), color: '#1565c0' },
              { label: 'Total Paid', val: formatCurrency(totalPaid), color: '#2e7d32' },
              { label: 'Total Due', val: formatCurrency(totalDue), color: totalDue > 0 ? '#c62828' : '#2e7d32' },
            ].map((s, i) => (
              <Grid item xs={4} key={i}>
                <Card className="stat-card-hover"><CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.val}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="h6">Services</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => { setAssignForm({ serviceId: '', agreedFee: '', startDate: new Date().toISOString().split('T')[0], expiryDate: '', reminderDays: 15 }); setAssignOpen(true); }}>Assign Service</Button>
          </Box>

          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Service</TableCell><TableCell>Status</TableCell><TableCell>Fee</TableCell>
                  <TableCell>Paid</TableCell><TableCell>Due</TableCell><TableCell>Expiry</TableCell>
                  <TableCell>Reminder</TableCell><TableCell align="center">Action</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {custServices.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><Typography color="text.secondary">No services assigned</Typography></TableCell></TableRow>
                  ) : custServices.map((cs: any) => {
                    const paid = (cs.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
                    const due = cs.agreedFee - paid;
                    const days = cs.expiryDate ? daysUntil(cs.expiryDate) : null;
                    return (
                      <React.Fragment key={cs.id}>
                        <TableRow hover>
                          <TableCell><Typography fontWeight={600}>{cs.service?.name}</Typography></TableCell>
                          <TableCell><Chip label={formatStatus(cs.status)} size="small" color={cs.status === 'COMPLETED' ? 'success' : cs.status === 'IN_PROGRESS' ? 'info' : 'default'} /></TableCell>
                          <TableCell>{formatCurrency(cs.agreedFee)}</TableCell>
                          <TableCell><Typography color="success.main" fontWeight={600}>{formatCurrency(paid)}</Typography></TableCell>
                          <TableCell><Typography color={due > 0 ? 'error.main' : 'success.main'} fontWeight={700}>{formatCurrency(due)}</Typography></TableCell>
                          <TableCell>{formatDate(cs.expiryDate)}</TableCell>
                          <TableCell>{cs.reminderDays ? `${cs.reminderDays}d` : '—'}</TableCell>
                          <TableCell align="center">
                            <Button size="small" variant="outlined" onClick={() => { setSelectedCs(cs); setPayForm({ amount: '', paymentType: 'PARTIAL', paymentMethod: 'CASH', paymentDate: new Date().toISOString().split('T')[0], referenceNumber: '' }); setPayOpen(true); }}>Pay</Button>
                          </TableCell>
                        </TableRow>
                        {(cs.payments || []).length > 0 && (
                          <TableRow><TableCell colSpan={8} sx={{ py: 0, px: 2, bgcolor: alpha('#1565c0', 0.02) }}>
                            <Box sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, my: 1 }}>
                              {cs.payments.map((p: any) => (
                                <Box key={p.id} display="flex" justifyContent="space-between" py={0.5}>
                                  <Typography variant="caption">{formatDate(p.paymentDate)} — {formatStatus(p.paymentMethod)}{p.referenceNumber ? ` (${p.referenceNumber})` : ''}</Typography>
                                  <Typography variant="caption" fontWeight={700} color="success.main">{formatCurrency(p.amount)}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </TableCell></TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Service</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth><InputLabel>Service</InputLabel>
              <Select value={assignForm.serviceId} label="Service" onChange={(e) => {
                const svc = (services || []).find((s: any) => s.id === e.target.value) as any;
                // Auto-calculate expiry date from validityDays
                let expiryDate = '';
                if (svc?.hasExpiry && svc?.validityDays) {
                  const d = new Date(assignForm.startDate);
                  d.setDate(d.getDate() + svc.validityDays);
                  expiryDate = d.toISOString().split('T')[0];
                }
                setAssignForm(f => ({ ...f, serviceId: e.target.value, agreedFee: svc ? String(paiseToRupees(svc.defaultFee)) : '', expiryDate }));
              }}>
                {(services || []).filter((s: any) => s.isActive).map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name} — {formatCurrency(s.defaultFee)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Agreed Fee" fullWidth value={assignForm.agreedFee} onChange={(e) => setAssignForm(f => ({ ...f, agreedFee: e.target.value }))} type="number"
              InputProps={{ startAdornment: <InputAdornment position="start"><RupeeIcon fontSize="small" /></InputAdornment> }} />
            <TextField label="Start Date" fullWidth type="date" value={assignForm.startDate} onChange={(e) => {
              const start = e.target.value;
              const svc = (services || []).find((s: any) => s.id === assignForm.serviceId) as any;
              let expiryDate = assignForm.expiryDate;
              if (svc?.hasExpiry && svc?.validityDays) {
                const d = new Date(start);
                d.setDate(d.getDate() + svc.validityDays);
                expiryDate = d.toISOString().split('T')[0];
              }
              setAssignForm(f => ({ ...f, startDate: start, expiryDate }));
            }} InputLabelProps={{ shrink: true }} />
            <TextField label="Expiry Date" fullWidth type="date" value={assignForm.expiryDate} onChange={(e) => setAssignForm(f => ({ ...f, expiryDate: e.target.value }))} InputLabelProps={{ shrink: true }}
              helperText={assignForm.expiryDate ? '' : 'Leave blank if service does not expire'} />
            <Box><Typography variant="body2" mb={0.5}>Reminder Days</Typography>
              <RadioGroup row value={String(assignForm.reminderDays)} onChange={(e) => setAssignForm(f => ({ ...f, reminderDays: parseInt(e.target.value) }))}>
                {[7, 15, 30].map(d => <FormControlLabel key={d} value={String(d)} control={<Radio size="small" />} label={`${d} days`} />)}
              </RadioGroup></Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={assignMut.isPending} onClick={() => {
            if (!assignForm.serviceId) { enqueueSnackbar('Select a service', { variant: 'warning' }); return; }
            assignMut.mutate({ customerId: id, serviceId: assignForm.serviceId, agreedFee: rupeesToPaise(parseFloat(assignForm.agreedFee) || 0), startDate: assignForm.startDate, expiryDate: assignForm.expiryDate || null, reminderDays: assignForm.reminderDays });
          }}>{assignMut.isPending ? <CircularProgress size={20} /> : 'Assign'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment — {selectedCs?.service?.name}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField label="Amount" fullWidth value={payForm.amount} onChange={(e) => setPayForm(f => ({ ...f, amount: e.target.value }))} type="number"
              InputProps={{ startAdornment: <InputAdornment position="start"><RupeeIcon fontSize="small" /></InputAdornment> }} />
            <FormControl fullWidth><InputLabel>Type</InputLabel>
              <Select value={payForm.paymentType} label="Type" onChange={(e) => setPayForm(f => ({ ...f, paymentType: e.target.value }))}>
                <MenuItem value="ADVANCE">Advance</MenuItem><MenuItem value="PARTIAL">Partial</MenuItem><MenuItem value="FINAL">Full Payment</MenuItem><MenuItem value="REFUND">Refund</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth><InputLabel>Method</InputLabel>
              <Select value={payForm.paymentMethod} label="Method" onChange={(e) => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'].map(m => <MenuItem key={m} value={m}>{formatStatus(m)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Payment Date" fullWidth type="date" value={payForm.paymentDate} onChange={(e) => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Reference No." fullWidth value={payForm.referenceNumber} onChange={(e) => setPayForm(f => ({ ...f, referenceNumber: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={payMut.isPending} onClick={() => {
            if (!payForm.amount) { enqueueSnackbar('Enter amount', { variant: 'warning' }); return; }
            payMut.mutate({ customerServiceId: selectedCs?.id, amount: rupeesToPaise(parseFloat(payForm.amount)), paymentType: payForm.paymentType, paymentMethod: payForm.paymentMethod, paymentDate: payForm.paymentDate, referenceNumber: payForm.referenceNumber || undefined });
          }}>{payMut.isPending ? <CircularProgress size={20} /> : 'Record Payment'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetailPage;
