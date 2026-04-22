import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Avatar, alpha, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Paper, CircularProgress } from '@mui/material';
import { People as PeopleIcon, Assignment as ServiceIcon, CurrencyRupee as RupeeIcon, Warning as WarningIcon, Notifications as BellIcon, TrendingUp as TrendingIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi } from '../../api';
import { formatCurrency, formatDate, daysUntil } from '../../utils/helpers';

const COLORS = ['#1565c0', '#2e7d32', '#ed6c02', '#9c27b0', '#00838f', '#c62828'];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: async () => { const res = await dashboardApi.getSummary(); return res.data.data; } });
  if (isLoading) return <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>;

  const stats = [
    { label: 'Total Customers', value: data?.totalCustomers ?? 0, color: '#1565c0', icon: <PeopleIcon /> },
    { label: 'Active Services', value: data?.activeServices ?? 0, color: '#2e7d32', icon: <ServiceIcon /> },
    { label: 'Monthly Revenue', value: formatCurrency(data?.monthlyRevenue ?? 0), color: '#ed6c02', icon: <RupeeIcon /> },
    { label: 'Outstanding Dues', value: formatCurrency(data?.outstandingDues ?? 0), color: '#c62828', icon: <WarningIcon /> },
    { label: "Today's Messages", value: data?.todaysNotifications?.length ?? 0, color: '#7c4dff', icon: <BellIcon /> },
  ];

  const revenueData = (data?.revenueChart || []).map((r: any) => ({
    month: new Date(r.month).toLocaleString('default', { month: 'short' }),
    revenue: Number(r.revenue) / 100,
  }));

  const serviceData = (data?.serviceDistribution || []).map((s: any) => ({ name: s.name, value: Number(s.count) }));

  return (
    <Box className="fade-in">
      <Typography variant="h4" mb={3}>Dashboard</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s, i) => (
          <Grid item xs={12} sm={6} md={4} lg key={i}>
            <Card className="stat-card-hover">
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">{s.label}</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(s.color, 0.1), color: s.color, width: 44, height: 44 }}>{s.icon}</Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Revenue (Last 12 Months)</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v: number) => `Rs ${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#1565c0" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Service Distribution</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {serviceData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Legend /><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Expiring Services</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Customer</TableCell><TableCell>Service</TableCell><TableCell>Expiry</TableCell><TableCell>Days Left</TableCell></TableRow></TableHead>
                  <TableBody>
                    {(data?.expiringServices || []).slice(0, 10).map((cs: any) => { const days = daysUntil(cs.expiryDate); return (
                      <TableRow key={cs.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${cs.customer?.id}`)}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha('#1565c0', 0.1), color: '#1565c0' }}>{cs.customer?.name?.charAt(0)}</Avatar>
                            <Box><Typography variant="body2" fontWeight={600}>{cs.customer?.name}</Typography>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>{cs.customer?.customerCode}</Typography></Box>
                          </Box>
                        </TableCell>
                        <TableCell>{cs.service?.name}</TableCell>
                        <TableCell>{formatDate(cs.expiryDate)}</TableCell>
                        <TableCell><Chip label={`${days}d`} size="small" color={days <= 7 ? 'error' : days <= 15 ? 'warning' : 'info'} /></TableCell>
                      </TableRow>
                    ); })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Recent Activity</Typography>
              {(data?.recentActivity || []).slice(0, 8).map((a: any, i: number) => (
                <Box key={i} className="activity-item" display="flex" alignItems="center" gap={1.5} py={1} sx={{ borderBottom: i < 7 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(a.type === 'payment' ? '#2e7d32' : '#1565c0', 0.1), color: a.type === 'payment' ? '#2e7d32' : '#1565c0' }}>
                    {a.type === 'payment' ? <RupeeIcon fontSize="small" /> : <ServiceIcon fontSize="small" />}
                  </Avatar>
                  <Box flex={1}><Typography variant="body2">{a.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(a.date)}</Typography></Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {data?.todaysNotifications?.length > 0 && (
        <Card sx={{ mt: 2.5 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Today's Messages</Typography>
            <Grid container spacing={1.5}>
              {data.todaysNotifications.map((n: any) => (
                <Grid item xs={12} sm={6} md={4} key={n.id}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>{n.customer?.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.messageBody}</Typography>
                    <Chip label={n.channel} size="small" sx={{ mt: 0.5 }} color={n.channel === 'WHATSAPP' ? 'success' : 'primary'} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DashboardPage;
