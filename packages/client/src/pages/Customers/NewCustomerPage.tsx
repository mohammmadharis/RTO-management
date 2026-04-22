import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Radio,
  RadioGroup, CircularProgress, Divider, Chip, Paper, Autocomplete, alpha,
  IconButton, Tooltip, Stepper, Step, StepLabel, StepContent,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Build as ServiceIcon,
  CurrencyRupee as RupeeIcon,
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { customersApi, servicesApi } from '../../api';
import { formatCurrency, rupeesToPaise, formatStatus } from '../../utils/helpers';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATE_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kakinada', 'Tirupati', 'Kadapa', 'Anantapur'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Dhubri'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem'],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh',
    'Gandhinagar', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Surendranagar', 'Bharuch',
    'Mehsana', 'Bhuj', 'Porbandar', 'Palanpur', 'Valsad', 'Gandhidham', 'Botad',
    'Amreli', 'Gondal', 'Jetpur', 'Veraval', 'Wankaner', 'Ankleshwar', 'Godhra',
    'Patan', 'Dahod', 'Kalol', 'Deesa', 'Upleta', 'Dwarka', 'Somnath',
    'Himmatnagar', 'Modasa', 'Idar', 'Visnagar', 'Unjha', 'Khambhat', 'Sidhpur',
    'Chhota Udaipur', 'Lunawada', 'Dabhoi', 'Petlad', 'Umreth', 'Dholka', 'Sanand',
    'Bavla', 'Viramgam', 'Mandvi', 'Mundra', 'Adipur', 'Rajula', 'Mahuva',
  ],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa'],
  'Himachal Pradesh': ['Shimla', 'Dharamsala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Hamirpur', 'Una', 'Kangra'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Vijayapura', 'Shimoga', 'Tumkur', 'Raichur', 'Bidar', 'Udupi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram', 'Kasaragod'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Chhindwara'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Thane', 'Amravati', 'Nanded', 'Sangli', 'Satara', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna', 'Ambernath', 'New Mumbai'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jeypore'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Batala', 'Pathankot', 'Moga', 'Firozpur'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sri Ganganagar', 'Sikar', 'Pali', 'Jhunjhunu', 'Barmer', 'Chittorgarh'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukkudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Mathura', 'Jhansi', 'Muzaffarnagar', 'Rampur', 'Shahjahanpur', 'Hapur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Mussoorie', 'Nainital'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Darjeeling', 'Jalpaiguri'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Rangat'],
  'Chandigarh': ['Chandigarh'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Daman', 'Diu', 'Silvassa'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Laxmi Nagar', 'Shahdara', 'Pitampura'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Sopore', 'Baramulla', 'Kathua', 'Udhampur'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Amini'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahé', 'Yanam'],
};

const INDIAN_STATES = Object.keys(STATE_CITIES).sort();

// Hierarchical: vehicleType → categories
const VEHICLE_TYPE_MAP: Record<string, string[]> = {
  'Two Wheeler': ['Motorcycle (Geared)', 'Scooter / Moped (Gearless)', 'Electric Two Wheeler'],
  'Three Wheeler': ['Auto Rickshaw (Passenger)', 'Auto Rickshaw (Goods)', 'E-Rickshaw', 'Tempo'],
  'Four Wheeler — Private': ['Hatchback', 'Sedan', 'SUV / MUV', 'Compact SUV', 'Electric Car'],
  'Four Wheeler — Commercial': ['Taxi / Cab', 'School Bus', 'Private Bus', 'Mini Bus', 'Tourist Vehicle', 'Ambulance', 'Police Vehicle'],
  'Light Commercial Vehicle (LCV)': ['Mini Truck / Pickup', 'Light Goods Vehicle', 'Van'],
  'Heavy Commercial Vehicle (HCV)': ['Truck (2 Axle)', 'Truck (3 Axle / Multi Axle)', 'Tipper', 'Tanker', 'Container Truck', 'Trailer'],
  'Agricultural / Special': ['Tractor', 'Power Tiller', 'Harvester', 'Crane / Construction Equipment'],
  'Other': ['Other'],
};

const FUEL_TYPES = [
  'Petrol', 'Diesel', 'CNG (Compressed Natural Gas)', 'LPG (Liquefied Petroleum Gas)',
  'Electric (EV)', 'Hybrid (Petrol + Electric)', 'Hybrid (Diesel + Electric)', 'Hydrogen', 'Other',
];

const MFG_YEARS = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => new Date().getFullYear() - i);

const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

// ─── Validation ───────────────────────────────────────────────────────────────

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VEHICLE_RE = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/;
const AADHAR_RE = /^\d{12}$/;
const PINCODE_RE = /^\d{6}$/;

function strip91(val: string) {
  const v = val.replace(/[\s-]/g, '');
  if (v.startsWith('+91')) return v.slice(3);
  if (v.startsWith('91') && v.length === 12) return v.slice(2);
  return v;
}

type FormErrors = Record<string, string>;

function validate(form: any): FormErrors {
  const e: FormErrors = {};

  // Section 1 — Customer
  if (!form.name.trim()) e.name = 'Full name is required';
  else if (form.name.trim().length < 2) e.name = 'Minimum 2 characters';

  const phone = strip91(form.phone);
  if (!phone) e.phone = 'Phone number is required';
  else if (!PHONE_RE.test(phone)) e.phone = 'Enter valid 10-digit mobile (starts with 6-9)';

  if (!form.sameAsPhone && form.whatsappNumber) {
    if (!PHONE_RE.test(strip91(form.whatsappNumber))) e.whatsappNumber = 'Enter valid 10-digit WhatsApp number';
  }

  if (form.alternatePhone && !PHONE_RE.test(strip91(form.alternatePhone)))
    e.alternatePhone = 'Enter valid 10-digit number';

  if (form.email && !EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address';

  if (form.pincode && !PINCODE_RE.test(form.pincode)) e.pincode = 'Pincode must be 6 digits';

  // Section 2 — Vehicle
  if (form.vehicleNumber) {
    const vn = form.vehicleNumber.replace(/\s/g, '').toUpperCase();
    if (!VEHICLE_RE.test(vn)) e.vehicleNumber = 'Format: GJ01AA1234';
  }
  if (form.aadharNumber && !AADHAR_RE.test(form.aadharNumber))
    e.aadharNumber = 'Aadhar must be exactly 12 digits';

  // Section 3 — Service
  if (form.serviceId) {
    if (!form.agreedFee || parseFloat(form.agreedFee) <= 0) e.agreedFee = 'Agreed fee must be > 0';
    if (!form.startDate) e.startDate = 'Start date is required';
  }

  // Section 4 — Payment
  if (form.serviceId && form.advanceAmount) {
    const adv = parseFloat(form.advanceAmount);
    const fee = parseFloat(form.agreedFee || '0');
    if (adv < 0) e.advanceAmount = 'Amount cannot be negative';
    if (adv > fee) e.advanceAmount = 'Advance cannot exceed agreed fee';
    if (!form.advancePaidDate) e.advancePaidDate = 'Date is required';
    if (['UPI', 'BANK_TRANSFER'].includes(form.paymentMethod) && !form.referenceNumber)
      e.referenceNumber = 'Transaction / reference number is required';
    if (form.paymentMethod === 'CHEQUE' && !form.chequeNumber) e.chequeNumber = 'Cheque number is required';
    if (['CHEQUE', 'BANK_TRANSFER'].includes(form.paymentMethod) && !form.bankName)
      e.bankName = 'Bank name is required';
  }

  return e;
}

// ─── Per-Step Validation ─────────────────────────────────────────────────────

function validateStep(step: number, form: any): FormErrors {
  const e: FormErrors = {};

  if (step === 0) {
    if (!form.name.trim()) e.name = 'Full name is required';
    else if (form.name.trim().length < 2) e.name = 'Minimum 2 characters';
    const phone = strip91(form.phone);
    if (!phone) e.phone = 'Phone number is required';
    else if (!PHONE_RE.test(phone)) e.phone = 'Enter valid 10-digit mobile (starts with 6-9)';
    if (!form.sameAsPhone && form.whatsappNumber) {
      if (!PHONE_RE.test(strip91(form.whatsappNumber))) e.whatsappNumber = 'Enter valid 10-digit WhatsApp number';
    }
    if (form.alternatePhone && !PHONE_RE.test(strip91(form.alternatePhone)))
      e.alternatePhone = 'Enter valid 10-digit number';
    if (form.email && !EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address';
    if (form.pincode && !PINCODE_RE.test(form.pincode)) e.pincode = 'Pincode must be 6 digits';
  }

  if (step === 1) {
    if (form.vehicleNumber) {
      const vn = form.vehicleNumber.replace(/\s/g, '').toUpperCase();
      if (!VEHICLE_RE.test(vn)) e.vehicleNumber = 'Format: GJ01AA1234';
    }
    if (form.aadharNumber && !AADHAR_RE.test(form.aadharNumber))
      e.aadharNumber = 'Aadhar must be exactly 12 digits';
  }

  if (step === 2) {
    if (form.serviceId) {
      if (!form.agreedFee || parseFloat(form.agreedFee) <= 0) e.agreedFee = 'Agreed fee must be > 0';
      if (!form.startDate) e.startDate = 'Start date is required';
    }
  }

  if (step === 3) {
    if (form.serviceId && form.advanceAmount) {
      const adv = parseFloat(form.advanceAmount);
      const fee = parseFloat(form.agreedFee || '0');
      if (adv < 0) e.advanceAmount = 'Amount cannot be negative';
      if (adv > fee) e.advanceAmount = 'Advance cannot exceed agreed fee';
      if (!form.advancePaidDate) e.advancePaidDate = 'Date is required';
      if (['UPI', 'BANK_TRANSFER'].includes(form.paymentMethod) && !form.referenceNumber)
        e.referenceNumber = 'Transaction / reference number is required';
      if (form.paymentMethod === 'CHEQUE' && !form.chequeNumber) e.chequeNumber = 'Cheque number is required';
      if (['CHEQUE', 'BANK_TRANSFER'].includes(form.paymentMethod) && !form.bankName)
        e.bankName = 'Bank name is required';
    }
  }

  return e;
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS = ['Customer Information', 'Vehicle Information', 'RTO Service', 'Payment'];

// ─── Main Component ───────────────────────────────────────────────────────────

const INIT_FORM = {
  // Section 1
  name: '', phone: '', whatsappNumber: '', sameAsPhone: true,
  alternatePhone: '', email: '', address: '', city: '', state: 'Gujarat', pincode: '',
  // Section 2
  vehicleNumber: '', vehicleType: '', vehicleCategory: '', vehicleBrand: '',
  vehicleModel: '', manufacturingYear: '', fuelType: '', engineNumber: '',
  chassisNumber: '', vehicleColour: '',
  // DL / Aadhar
  dlNumber: '', aadharNumber: '',
  // Section 3
  serviceId: '', agreedFee: '', startDate: new Date().toISOString().split('T')[0],
  expiryDate: '', reminderDays: 30, documentNumber: '', issuingAuthority: '', serviceNotes: '',
  // Section 4
  advanceAmount: '', paymentMethod: 'CASH', referenceNumber: '',
  chequeNumber: '', bankName: '', advancePaidDate: new Date().toISOString().split('T')[0],
  expectedDueDate: '',
};

const NewCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState<any>(INIT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeStep, setActiveStep] = useState(0);
  const cityOptions = useMemo(() => STATE_CITIES[form.state] || [], [form.state]);

  const setField = (field: string, value: any) => {
    setForm((f: any) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const { data: services } = useQuery({
    queryKey: ['services-all'],
    queryFn: async () => { const r = await servicesApi.list({ limit: 100 }); return r.data.data; },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => customersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      enqueueSnackbar('Customer created successfully!', { variant: 'success' });
      navigate('/customers');
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Error creating customer', { variant: 'error' }),
  });

  const selectedService = useMemo(
    () => (services || []).find((s: any) => s.id === form.serviceId),
    [services, form.serviceId]
  );

  // Live payment status
  const totalFee = parseFloat(form.agreedFee) || 0;
  const advancePaid = parseFloat(form.advanceAmount) || 0;
  const dueAmount = Math.max(0, totalFee - advancePaid);
  const paymentStatus = advancePaid === 0 ? 'PENDING' : dueAmount <= 0 ? 'PAID' : 'DUE';

  const statusColor: Record<string, 'error' | 'warning' | 'success'> = { PENDING: 'error', DUE: 'warning', PAID: 'success' };

  const handleNext = () => {
    const errs = validateStep(activeStep, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      enqueueSnackbar('Please fix the highlighted errors', { variant: 'warning' });
      return;
    }
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => {
    setActiveStep((s) => s - 1);
    setErrors({});
  };

  const handleSubmit = () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      enqueueSnackbar('Please fix the highlighted errors', { variant: 'warning' });
      // Scroll to first error
      const top = document.querySelector('[data-error="true"]');
      top?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const phone = strip91(form.phone);
    const whatsapp = form.sameAsPhone ? phone : strip91(form.whatsappNumber || form.phone);

    const payload: any = {
      name: form.name.trim(),
      phone,
      whatsappNumber: whatsapp,
      alternatePhone: form.alternatePhone ? strip91(form.alternatePhone) : undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      pincode: form.pincode || undefined,
      vehicleNumber: form.vehicleNumber ? form.vehicleNumber.replace(/\s/g, '').toUpperCase() : undefined,
      vehicleType: form.vehicleType || undefined,
      vehicleCategory: form.vehicleCategory || undefined,
      vehicleBrand: form.vehicleBrand || undefined,
      vehicleModel: form.vehicleModel || undefined,
      manufacturingYear: form.manufacturingYear ? parseInt(form.manufacturingYear) : undefined,
      fuelType: form.fuelType || undefined,
      engineNumber: form.engineNumber || undefined,
      chassisNumber: form.chassisNumber || undefined,
      vehicleColour: form.vehicleColour || undefined,
      dlNumber: form.dlNumber ? form.dlNumber.replace(/\s/g, '').toUpperCase() : undefined,
      aadharNumber: form.aadharNumber || undefined,
    };

    if (form.serviceId) {
      payload.service = {
        serviceId: form.serviceId,
        agreedFee: rupeesToPaise(parseFloat(form.agreedFee)),
        startDate: form.startDate,
        expiryDate: form.expiryDate || undefined,
        reminderDays: form.reminderDays,
        documentNumber: form.documentNumber || undefined,
        issuingAuthority: form.issuingAuthority || undefined,
        notes: form.serviceNotes || undefined,
        dueDate: dueAmount > 0 && form.expectedDueDate ? form.expectedDueDate : undefined,
      };

      if (form.advanceAmount && parseFloat(form.advanceAmount) > 0) {
        payload.payment = {
          amount: rupeesToPaise(parseFloat(form.advanceAmount)),
          paymentType: dueAmount <= 0 ? 'FINAL' : 'ADVANCE',
          paymentMethod: form.paymentMethod,
          paymentDate: form.advancePaidDate || new Date().toISOString().split('T')[0],
          referenceNumber: form.referenceNumber || form.chequeNumber || undefined,
          notes: form.bankName ? `Bank: ${form.bankName}` : undefined,
        };
      }
    }

    createMut.mutate(payload);
  };

  return (
    <Box className="fade-in" sx={{ maxWidth: 900, mx: 'auto', pb: 6 }}>
      {/* ── Page Header ── */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Tooltip title="Back to Customers">
          <IconButton onClick={() => navigate('/customers')} size="small" sx={{ bgcolor: 'action.hover' }}>
            <BackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h5" fontWeight={700}>Add New Customer</Typography>
          <Typography variant="body2" color="text.secondary">Fill in the details step by step</Typography>
        </Box>
      </Box>

      {/* ── Stepper ── */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 0 — Customer Information                           */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeStep === 0 && (
      <Box mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'primary.main', color: 'white', px: 2.5, py: 1.5, borderRadius: '8px 8px 0 0' }}>
          <PersonIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>Customer Information</Typography>
        </Box>
        <Card sx={{ borderRadius: '0 0 8px 8px', border: '1px solid', borderColor: 'divider', borderTop: 0 }}>
          <CardContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>
              {/* Full Name */}
              <Grid item xs={12} sm={6}>
                <TextField label="Full Name *" fullWidth value={form.name}
                  onChange={(e) => setField('name', e.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))}
                  error={!!errors.name} helperText={errors.name || 'Letters and spaces only'}
                  inputProps={{ 'data-error': !!errors.name }} />
              </Grid>

              {/* Mobile */}
              <Grid item xs={12} sm={6}>
                <TextField label="Mobile Number *" fullWidth value={form.phone}
                  onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  error={!!errors.phone} helperText={errors.phone || '10-digit mobile number'}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Typography variant="body2" color="text.secondary" sx={{ minWidth: 28 }}>+91</Typography></InputAdornment> }}
                  inputProps={{ maxLength: 10, inputMode: 'numeric' }} />
              </Grid>

              {/* WhatsApp */}
              <Grid item xs={12} sm={6}>
                <TextField label="WhatsApp Number *" fullWidth
                  disabled={form.sameAsPhone}
                  value={form.sameAsPhone ? form.phone : form.whatsappNumber}
                  onChange={(e) => setField('whatsappNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  error={!!errors.whatsappNumber} helperText={errors.whatsappNumber}
                  InputProps={{ startAdornment: <InputAdornment position="start"><WhatsAppIcon fontSize="small" sx={{ color: '#25d366' }} /></InputAdornment> }}
                  inputProps={{ maxLength: 10, inputMode: 'numeric' }} />
                <FormControlLabel
                  control={<Checkbox size="small" checked={form.sameAsPhone}
                    onChange={(e) => {
                      setField('sameAsPhone', e.target.checked);
                      if (e.target.checked) setErrors((er) => { const n = { ...er }; delete n.whatsappNumber; return n; });
                    }} />}
                  label={<Typography variant="caption">Same as Mobile</Typography>}
                  sx={{ mt: 0.5 }} />
              </Grid>

              {/* Alternate Phone */}
              <Grid item xs={12} sm={6}>
                <TextField label="Alternate Phone" fullWidth value={form.alternatePhone}
                  onChange={(e) => setField('alternatePhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  error={!!errors.alternatePhone} helperText={errors.alternatePhone}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Typography variant="body2" color="text.secondary" sx={{ minWidth: 28 }}>+91</Typography></InputAdornment> }}
                  inputProps={{ maxLength: 10, inputMode: 'numeric' }} />
              </Grid>

              {/* Email */}
              <Grid item xs={12} sm={6}>
                <TextField label="Email Address" fullWidth type="email" value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  error={!!errors.email} helperText={errors.email} />
              </Grid>

              {/* State FIRST — City options depend on selected state */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select value={form.state} label="State"
                    onChange={(e) => { setField('state', e.target.value); setField('city', ''); }}>
                    {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* City — filtered by selected state */}
              <Grid item xs={12} sm={6}>
                <Autocomplete freeSolo options={cityOptions} value={form.city}
                  onInputChange={(_, v) => setField('city', v)}
                  renderInput={(params) => <TextField {...params} label="City" fullWidth />} />
              </Grid>

              {/* Pincode */}
              <Grid item xs={12} sm={6}>
                <TextField label="Pincode" fullWidth value={form.pincode}
                  onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  error={!!errors.pincode} helperText={errors.pincode || '6-digit postal code'}
                  inputProps={{ maxLength: 6, inputMode: 'numeric' }} />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField label="Address" fullWidth multiline rows={2} value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  inputProps={{ maxLength: 250 }}
                  helperText={`${form.address.length}/250`} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Vehicle Information                            */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeStep === 1 && (
      <Box mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'primary.main', color: 'white', px: 2.5, py: 1.5, borderRadius: '8px 8px 0 0' }}>
          <CarIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>Vehicle Information</Typography>
        </Box>
        <Card sx={{ borderRadius: '0 0 8px 8px', border: '1px solid', borderColor: 'divider', borderTop: 0 }}>
          <CardContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>
              {/* Vehicle Number */}
              <Grid item xs={12} sm={6}>
                <TextField label="Vehicle Registration Number *" fullWidth value={form.vehicleNumber}
                  onChange={(e) => setField('vehicleNumber', e.target.value.toUpperCase().replace(/\s/g, ''))}
                  error={!!errors.vehicleNumber} helperText={errors.vehicleNumber || 'e.g. GJ01AA1234 — auto UPPERCASE'}
                  inputProps={{ maxLength: 11 }} />
              </Grid>

              {/* Vehicle Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select value={form.vehicleType} label="Vehicle Type"
                    onChange={(e) => { setField('vehicleType', e.target.value); setField('vehicleCategory', ''); }}>
                    {Object.keys(VEHICLE_TYPE_MAP).map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Vehicle Category (dependent on type) */}
              {form.vehicleType && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle Category</InputLabel>
                    <Select value={form.vehicleCategory} label="Vehicle Category"
                      onChange={(e) => setField('vehicleCategory', e.target.value)}>
                      {(VEHICLE_TYPE_MAP[form.vehicleType] || []).map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Brand */}
              <Grid item xs={12} sm={6}>
                <TextField label="Vehicle Brand / Make" fullWidth value={form.vehicleBrand}
                  onChange={(e) => setField('vehicleBrand', e.target.value)}
                  helperText="e.g. Honda, Maruti, Tata, Bajaj" />
              </Grid>

              {/* Model */}
              <Grid item xs={12} sm={6}>
                <TextField label="Vehicle Model" fullWidth value={form.vehicleModel}
                  onChange={(e) => setField('vehicleModel', e.target.value)}
                  helperText="e.g. Activa, Swift, Pulsar, Nexon" />
              </Grid>

              {/* Manufacturing Year */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Manufacturing Year</InputLabel>
                  <Select value={form.manufacturingYear} label="Manufacturing Year"
                    onChange={(e) => setField('manufacturingYear', e.target.value)}>
                    <MenuItem value=""><em>Select year</em></MenuItem>
                    {MFG_YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Fuel Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Fuel Type</InputLabel>
                  <Select value={form.fuelType} label="Fuel Type"
                    onChange={(e) => setField('fuelType', e.target.value)}>
                    <MenuItem value=""><em>Select fuel type</em></MenuItem>
                    {FUEL_TYPES.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Colour */}
              <Grid item xs={12} sm={6}>
                <TextField label="Vehicle Colour" fullWidth value={form.vehicleColour}
                  onChange={(e) => setField('vehicleColour', e.target.value)}
                  helperText="e.g. Red, White, Silver" />
              </Grid>

              {/* Engine Number */}
              <Grid item xs={12} sm={6}>
                <TextField label="Engine Number" fullWidth value={form.engineNumber}
                  onChange={(e) => setField('engineNumber', e.target.value.toUpperCase())}
                  helperText="Alphanumeric — optional" />
              </Grid>

              {/* Chassis Number */}
              <Grid item xs={12} sm={6}>
                <TextField label="Chassis Number" fullWidth value={form.chassisNumber}
                  onChange={(e) => setField('chassisNumber', e.target.value.toUpperCase())}
                  helperText="Alphanumeric — optional" />
              </Grid>

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">Owner Documents</Typography></Divider></Grid>

              {/* DL Number */}
              <Grid item xs={12} sm={6}>
                <TextField label="Driving Licence Number" fullWidth value={form.dlNumber}
                  onChange={(e) => setField('dlNumber', e.target.value.toUpperCase())}
                  helperText="e.g. GJ0120110012345"
                  inputProps={{ maxLength: 16 }} />
              </Grid>

              {/* Aadhar Number */}
              <Grid item xs={12} sm={6}>
                <TextField label="Aadhar Number" fullWidth value={form.aadharNumber}
                  onChange={(e) => setField('aadharNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  error={!!errors.aadharNumber} helperText={errors.aadharNumber || '12-digit Aadhar number'}
                  inputProps={{ maxLength: 12, inputMode: 'numeric' }} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 2 — RTO Service                                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeStep === 2 && (
      <Box mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'primary.main', color: 'white', px: 2.5, py: 1.5, borderRadius: '8px 8px 0 0' }}>
          <ServiceIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>RTO Service (Optional)</Typography>
        </Box>
        <Card sx={{ borderRadius: '0 0 8px 8px', border: '1px solid', borderColor: 'divider', borderTop: 0 }}>
          <CardContent sx={{ pt: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Select the service provided. Click a tile to select / deselect.
            </Typography>

            {/* Service tiles */}
            <Grid container spacing={1.5} mb={2.5}>
              {((services || []) as any[]).filter((s) => s.isActive).map((s: any) => (
                <Grid item xs={6} sm={4} md={3} key={s.id}>
                  <Paper variant="outlined"
                    sx={{
                      p: 1.5, cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
                      borderColor: form.serviceId === s.id ? 'primary.main' : 'divider',
                      borderWidth: form.serviceId === s.id ? 2 : 1,
                      bgcolor: form.serviceId === s.id ? alpha('#1565c0', 0.06) : 'transparent',
                      '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#1565c0', 0.03) },
                    }}
                    onClick={() => {
                      const newId = form.serviceId === s.id ? '' : s.id;
                      setForm((f: any) => ({
                        ...f,
                        serviceId: newId,
                        agreedFee: newId ? String(s.defaultFee / 100) : '',
                        advanceAmount: '',
                      }));
                      setErrors((er) => { const n = { ...er }; delete n.serviceId; delete n.agreedFee; return n; });
                    }}>
                    {form.serviceId === s.id && (
                      <CheckIcon sx={{ fontSize: 14, color: 'primary.main', float: 'right', mt: -0.5 }} />
                    )}
                    <Typography variant="body2" fontWeight={600} noWrap>{s.name}</Typography>
                    <Typography variant="caption" color="primary.main">{formatCurrency(s.defaultFee)}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {form.serviceId && (
              <Box>
                <Divider sx={{ mb: 2.5 }}><Typography variant="caption" color="text.secondary">Service Details</Typography></Divider>
                <Grid container spacing={2.5}>
                  {/* Agreed Fee */}
                  <Grid item xs={12} sm={4}>
                    <TextField label="Agreed Fee *" fullWidth type="number" value={form.agreedFee}
                      onChange={(e) => setField('agreedFee', e.target.value)}
                      error={!!errors.agreedFee} helperText={errors.agreedFee}
                      InputProps={{ startAdornment: <InputAdornment position="start"><RupeeIcon fontSize="small" /></InputAdornment> }} />
                  </Grid>

                  {/* Start Date */}
                  <Grid item xs={12} sm={4}>
                    <TextField label="Service Start Date *" fullWidth type="date" value={form.startDate}
                      onChange={(e) => setField('startDate', e.target.value)}
                      error={!!errors.startDate} helperText={errors.startDate}
                      InputLabelProps={{ shrink: true }} />
                  </Grid>

                  {/* Expiry Date */}
                  <Grid item xs={12} sm={4}>
                    <TextField label="Service Expiry Date" fullWidth type="date" value={form.expiryDate}
                      onChange={(e) => setField('expiryDate', e.target.value)}
                      helperText="Required for expiry-based services"
                      InputLabelProps={{ shrink: true }} />
                  </Grid>

                  {/* Document Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField label="Document / Reference Number" fullWidth value={form.documentNumber}
                      onChange={(e) => setField('documentNumber', e.target.value)}
                      helperText="Policy no., RC no., DL no., etc." />
                  </Grid>

                  {/* Issuing Authority */}
                  <Grid item xs={12} sm={6}>
                    <TextField label="Issuing Authority / Office" fullWidth value={form.issuingAuthority}
                      onChange={(e) => setField('issuingAuthority', e.target.value)}
                      helperText="e.g. RTO Ahmedabad, IRDAI" />
                  </Grid>

                  {/* Reminder Days */}
                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight={600} mb={0.5}>Reminder Alert Days</Typography>
                    <RadioGroup row value={String(form.reminderDays)}
                      onChange={(e) => setField('reminderDays', parseInt(e.target.value))}>
                      {[7, 15, 30].map((d) => (
                        <FormControlLabel key={d} value={String(d)}
                          control={<Radio size="small" />} label={`${d} days before expiry`} />
                      ))}
                    </RadioGroup>
                  </Grid>

                  {/* Service Notes */}
                  <Grid item xs={12}>
                    <TextField label="Notes / Remarks" fullWidth multiline rows={2} value={form.serviceNotes}
                      onChange={(e) => setField('serviceNotes', e.target.value)}
                      helperText="Internal agent notes (max 300 chars)"
                      inputProps={{ maxLength: 300 }} />
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* STEP 3 — Payment Information                            */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeStep === 3 && (
        <Box mb={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'primary.main', color: 'white', px: 2.5, py: 1.5, borderRadius: '8px 8px 0 0' }}>
            <RupeeIcon fontSize="small" />
            <Typography variant="subtitle1" fontWeight={700}>Payment Information</Typography>
          </Box>
          <Card sx={{ borderRadius: '0 0 8px 8px', border: '1px solid', borderColor: 'divider', borderTop: 0 }}>
            <CardContent sx={{ pt: 3 }}>
              {!form.serviceId ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">No service selected.</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Go back to Step 3 to select a service if payment details are required.
                  </Typography>
                </Box>
              ) : (
              <Grid container spacing={2.5}>
                {/* Total Service Amount */}
                <Grid item xs={12} sm={4}>
                  <TextField label="Total Service Amount *" fullWidth type="number" value={form.agreedFee}
                    onChange={(e) => { setField('agreedFee', e.target.value); setField('advanceAmount', ''); }}
                    error={!!errors.agreedFee}
                    InputProps={{ startAdornment: <InputAdornment position="start"><RupeeIcon fontSize="small" /></InputAdornment> }}
                    helperText="Auto-linked to agreed fee" />
                </Grid>

                {/* Advance / Partial Payment */}
                <Grid item xs={12} sm={4}>
                  <TextField label="Advance / Partial Payment" fullWidth type="number" value={form.advanceAmount}
                    onChange={(e) => setField('advanceAmount', e.target.value)}
                    error={!!errors.advanceAmount} helperText={errors.advanceAmount || 'Enter 0 if no advance'}
                    InputProps={{ startAdornment: <InputAdornment position="start"><RupeeIcon fontSize="small" /></InputAdornment> }} />
                </Grid>

                {/* Due Amount — auto-calculated */}
                <Grid item xs={12} sm={4}>
                  <TextField label="Due Amount" fullWidth value={dueAmount > 0 ? dueAmount.toFixed(2) : '0'}
                    InputProps={{
                      readOnly: true,
                      startAdornment: <InputAdornment position="start"><RupeeIcon fontSize="small" /></InputAdornment>,
                      endAdornment: <InputAdornment position="end">
                        <Chip size="small" label={paymentStatus}
                          color={statusColor[paymentStatus]} sx={{ fontWeight: 700, fontSize: 11 }} />
                      </InputAdornment>,
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: dueAmount > 0 ? alpha('#f44336', 0.05) : 'transparent' } }}
                    helperText="Auto-calculated: Total − Advance" />
                </Grid>

                {/* Payment Mode */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode (Advance) *</InputLabel>
                    <Select value={form.paymentMethod} label="Payment Mode (Advance) *"
                      onChange={(e) => setField('paymentMethod', e.target.value)}>
                      {PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>{formatStatus(m)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* UPI / Bank Transfer reference */}
                {['UPI', 'BANK_TRANSFER'].includes(form.paymentMethod) && (
                  <Grid item xs={12} sm={6}>
                    <TextField label="UPI Transaction ID / Reference No. *" fullWidth value={form.referenceNumber}
                      onChange={(e) => setField('referenceNumber', e.target.value)}
                      error={!!errors.referenceNumber} helperText={errors.referenceNumber} />
                  </Grid>
                )}

                {/* Cheque fields */}
                {form.paymentMethod === 'CHEQUE' && (
                  <Grid item xs={12} sm={6}>
                    <TextField label="Cheque Number *" fullWidth value={form.chequeNumber}
                      onChange={(e) => setField('chequeNumber', e.target.value)}
                      error={!!errors.chequeNumber} helperText={errors.chequeNumber} />
                  </Grid>
                )}

                {/* Bank name */}
                {['CHEQUE', 'BANK_TRANSFER'].includes(form.paymentMethod) && (
                  <Grid item xs={12} sm={6}>
                    <TextField label="Bank Name *" fullWidth value={form.bankName}
                      onChange={(e) => setField('bankName', e.target.value)}
                      error={!!errors.bankName} helperText={errors.bankName} />
                  </Grid>
                )}

                {/* Advance Paid Date */}
                <Grid item xs={12} sm={6}>
                  <TextField label="Advance Paid Date *" fullWidth type="date" value={form.advancePaidDate}
                    onChange={(e) => setField('advancePaidDate', e.target.value)}
                    error={!!errors.advancePaidDate} helperText={errors.advancePaidDate || 'Cannot be a future date'}
                    InputLabelProps={{ shrink: true }} />
                </Grid>

                {/* Expected Due Date (only if due > 0) */}
                {dueAmount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <TextField label="Expected Due Date" fullWidth type="date" value={form.expectedDueDate}
                      onChange={(e) => setField('expectedDueDate', e.target.value)}
                      helperText="When is the due amount expected?"
                      InputLabelProps={{ shrink: true }} />
                  </Grid>
                )}
              </Grid>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── Navigation Buttons ── */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mt={3}
        pt={2}
        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Button
          variant="outlined"
          startIcon={<PrevIcon />}
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Box display="flex" gap={2}>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/customers')}>
            Cancel
          </Button>
          {activeStep < STEPS.length - 1 ? (
            <Button variant="contained" endIcon={<NextIcon />} onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              startIcon={createMut.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={createMut.isPending}
              sx={{ px: 4 }}
            >
              {createMut.isPending ? 'Saving...' : 'Save & Submit'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NewCustomerPage;
