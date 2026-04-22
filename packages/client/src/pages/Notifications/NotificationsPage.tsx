import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, TextField, FormControl, InputLabel,
  Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, alpha,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon, Sms as SmsIcon, Send as SendIcon, Notifications as BellIcon,
  CheckCircle as DeliveredIcon, Error as FailedIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { notificationsApi, customersApi } from '../../api';
import { formatDateTime, formatStatus } from '../../utils/helpers';

const NotificationsPage: React.FC = () => {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [channel, setChannel] = useState('');
  const [type, setType] = useState('');
  const [sendDialog, setSendDialog] = useState(false);
  const [sendForm, setSendForm] = useState({ customerId: '', channel: 'WHATSAPP', type: 'CUSTOM', messageBody: '' });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', channel, type],
    queryFn: async () => {
      const params: any = { limit: 200 };
      if (channel) params.channel = channel;
      if (type) params.type = type;
      const res = await notificationsApi.list(params);
      return res.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => { const res = await notificationsApi.getStats(); return res.data.data; },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => { const res = await customersApi.list({ limit: 500 }); return res.data.data; },
  });

  const sendMut = useMutation({
    mutationFn: (data: any) => notificationsApi.send(data),
    onSuccess: () => {
      enqueueSnackbar('Notification sent!', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notification-stats'] });
      setSendDialog(false);
    },
    onError: (err: any) => enqueueSnackbar(err.response?.data?.message || 'Failed to send', { variant: 'error' }),
  });

  const list = (notifications || []) as any[];

  const getChannelIcon = (ch: string) => ch === 'WHATSAPP' ? <WhatsAppIcon fontSize="small" sx={{ color: '#25d366' }} /> : <SmsIcon fontSize="small" color="primary" />;

  const getStatusChip = (status: string) => {
    const map: Record<string, { color: any; icon: React.ReactNode }> = {
      SENT: { color: 'success', icon: <DeliveredIcon fontSize="small" /> },
      DELIVERED: { color: 'success', icon: <DeliveredIcon fontSize="small" /> },
      QUEUED: { color: 'warning', icon: <BellIcon fontSize="small" /> },
      FAILED: { color: 'error', icon: <FailedIcon fontSize="small" /> },
    };
    const m = map[status] || { color: 'default', icon: null };
    return <Chip label={formatStatus(status)} size="small" color={m.color} icon={m.icon as any} />;
  };

  return (
    <Box className="fade-in">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">Notifications</Typography>
        <Button variant="contained" startIcon={<SendIcon />} onClick={() => setSendDialog(true)}>Send Notification</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Sent', val: stats?.total || 0, color: '#1565c0' },
          { label: 'Delivered', val: stats?.sent || 0, color: '#2e7d32' },
          { label: 'Queued', val: stats?.queued || 0, color: '#ed6c02' },
          { label: 'Failed', val: stats?.failed || 0, color: '#c62828' },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card className="stat-card-hover">
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.val}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Channel</InputLabel>
              <Select value={channel} label="Channel" onChange={(e) => setChannel(e.target.value)}>
                <MenuItem value="">All</MenuItem><MenuItem value="WHATSAPP">WhatsApp</MenuItem><MenuItem value="SMS">SMS</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select value={type} label="Type" onChange={(e) => setType(e.target.value)}>
                <MenuItem value="">All</MenuItem><MenuItem value="PAYMENT_REMINDER">Payment Reminder</MenuItem>
                <MenuItem value="EXPIRY_REMINDER">Expiry Reminder</MenuItem><MenuItem value="SERVICE_UPDATE">Service Update</MenuItem>
                <MenuItem value="REGISTRATION_CONFIRMATION">Registration</MenuItem><MenuItem value="CUSTOM">Custom</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>Customer</TableCell><TableCell>Channel</TableCell><TableCell>Type</TableCell>
              <TableCell>Message</TableCell><TableCell>Status</TableCell><TableCell>Sent At</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={30} /></TableCell></TableRow>
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No notifications found</Typography></TableCell></TableRow>
              ) : list.map((n: any) => (
                <TableRow key={n.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}>{n.customer?.name?.charAt(0)}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{n.customer?.name || '—'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Box display="flex" alignItems="center" gap={0.5}>{getChannelIcon(n.channel)}<Typography variant="body2">{n.channel}</Typography></Box></TableCell>
                  <TableCell><Chip label={formatStatus(n.type)} size="small" variant="outlined" /></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.messageBody}</Typography></TableCell>
                  <TableCell>{getStatusChip(n.status)}</TableCell>
                  <TableCell><Typography variant="body2">{formatDateTime(n.sentAt)}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select value={sendForm.customerId} label="Customer" onChange={(e) => setSendForm(f => ({ ...f, customerId: e.target.value }))}>
                {(customers || []).map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name} — {c.phone}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select value={sendForm.channel} label="Channel" onChange={(e) => setSendForm(f => ({ ...f, channel: e.target.value }))}>
                <MenuItem value="WHATSAPP">WhatsApp</MenuItem><MenuItem value="SMS">SMS</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={sendForm.type} label="Type" onChange={(e) => setSendForm(f => ({ ...f, type: e.target.value }))}>
                <MenuItem value="CUSTOM">Custom</MenuItem><MenuItem value="PAYMENT_REMINDER">Payment Reminder</MenuItem>
                <MenuItem value="EXPIRY_REMINDER">Expiry Reminder</MenuItem><MenuItem value="SERVICE_UPDATE">Service Update</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Message" fullWidth multiline rows={3} value={sendForm.messageBody} onChange={(e) => setSendForm(f => ({ ...f, messageBody: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSendDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={sendMut.isPending} onClick={() => {
            if (!sendForm.customerId || !sendForm.messageBody) { enqueueSnackbar('Customer and message required', { variant: 'warning' }); return; }
            sendMut.mutate(sendForm);
          }}>{sendMut.isPending ? <CircularProgress size={20} /> : 'Send'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;
