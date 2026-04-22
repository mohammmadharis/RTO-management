import React, { useState, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Alert, AlertTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, IconButton, Tooltip, Divider, Paper,
  TablePagination, CircularProgress, alpha, Stack,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CloudUpload as UploadIcon,
  CheckCircle as OkIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Delete as ClearIcon,
  FileUpload as FileIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import * as XLSX from 'xlsx';
import { customersApi } from '../../api';

// ─── Expected columns (label → field key) ──────────────────────────────────

const COLUMN_MAP: Record<string, string> = {
  'Name': 'name',
  'Phone': 'phone',
  'WhatsApp': 'whatsappNumber',
  'Alternate Phone': 'alternatePhone',
  'Email': 'email',
  'Address': 'address',
  'City': 'city',
  'State': 'state',
  'Pincode': 'pincode',
  'Vehicle Number': 'vehicleNumber',
  'Vehicle Type': 'vehicleType',
  'Vehicle Category': 'vehicleCategory',
  'Vehicle Brand': 'vehicleBrand',
  'Vehicle Model': 'vehicleModel',
  'Manufacturing Year': 'manufacturingYear',
  'Fuel Type': 'fuelType',
  'Engine Number': 'engineNumber',
  'Chassis Number': 'chassisNumber',
  'Vehicle Colour': 'vehicleColour',
  'DL Number': 'dlNumber',
  'Aadhar Number': 'aadharNumber',
  'Notes': 'notes',
};

const REQUIRED_COLS = ['name', 'phone'];
const TEMPLATE_HEADERS = Object.keys(COLUMN_MAP);

// ─── Download template helper ────────────────────────────────────────────────

function downloadTemplate() {
  const sampleRows = [
    ['Ramesh Patel', '9876543210', '9876543210', '', 'ramesh@email.com', '101 Main Road', 'Ahmedabad', 'Gujarat', '380001', 'GJ01AA1234', 'Four Wheeler — Private', 'SUV / MUV', 'Maruti', 'Brezza', '2022', 'Petrol', '', '', 'White', '', '', ''],
    ['Suresh Shah', '9123456789', '', '9000000001', '', 'Near Temple', 'Surat', 'Gujarat', '395003', 'GJ05BB5678', 'Two Wheeler', 'Motorcycle (Geared)', 'Honda', 'Shine', '2021', 'Petrol', '', '', 'Black', '', '', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...sampleRows]);
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  XLSX.writeFile(wb, 'customer_import_template.xlsx');
}

// ─── Parse file → rows ───────────────────────────────────────────────────────

function parseFile(file: File): Promise<{ rows: any[]; parseError?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (raw.length < 2) {
          resolve({ rows: [], parseError: 'File is empty or has only a header row.' });
          return;
        }

        // Normalise header: trim + lowercase for case-insensitive matching
        const headers: string[] = (raw[0] as string[]).map((h) => String(h).trim());

        // Build column index map
        const colIndex: Record<string, number> = {};
        for (const [label, field] of Object.entries(COLUMN_MAP)) {
          const idx = headers.findIndex(
            (h) => h.toLowerCase() === label.toLowerCase() || h.toLowerCase() === field.toLowerCase(),
          );
          if (idx !== -1) colIndex[field] = idx;
        }

        const missingRequired = REQUIRED_COLS.filter((f) => colIndex[f] === undefined);
        if (missingRequired.length > 0) {
          resolve({
            rows: [],
            parseError: `Required column(s) not found: ${missingRequired.join(', ')}. Check your headers.`,
          });
          return;
        }

        const rows = raw
          .slice(1)
          .filter((r) => r.some((cell) => String(cell).trim() !== ''))
          .map((r) => {
            const obj: Record<string, any> = {};
            for (const [field, idx] of Object.entries(colIndex)) {
              obj[field] = r[idx] !== undefined ? String(r[idx]).trim() : '';
            }
            return obj;
          });

        resolve({ rows });
      } catch (err: any) {
        resolve({ rows: [], parseError: `Failed to parse file: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ─── Result row type ─────────────────────────────────────────────────────────

interface ImportResult {
  row: number;
  status: 'success' | 'error';
  customerCode?: string;
  name?: string;
  error?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const BulkImportPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string>('');
  const [previewPage, setPreviewPage] = useState(0);
  const [resultPage, setResultPage] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importDone, setImportDone] = useState(false);

  // preview cols: show first 6 important columns for space
  const previewCols = ['name', 'phone', 'city', 'state', 'vehicleNumber', 'vehicleType'];
  const previewRowsPerPage = 10;
  const resultRowsPerPage = 10;

  const importMut = useMutation({
    mutationFn: (rows: any[]) => customersApi.bulkImport(rows),
    onSuccess: (res) => {
      const { succeeded, failed, results: r } = res.data;
      setResults(r);
      setImportDone(true);
      qc.invalidateQueries({ queryKey: ['customers'] });
      enqueueSnackbar(`Import done: ${succeeded} added, ${failed} failed`, {
        variant: failed === 0 ? 'success' : 'warning',
      });
    },
    onError: (e: any) => {
      enqueueSnackbar(e.response?.data?.error || 'Import failed', { variant: 'error' });
    },
  });

  const handleFileSelect = async (f: File) => {
    setFile(f);
    setParsedRows([]);
    setParseError('');
    setResults([]);
    setImportDone(false);
    setPreviewPage(0);
    setResultPage(0);

    const { rows, parseError: pe } = await parseFile(f);
    if (pe) {
      setParseError(pe);
      return;
    }
    if (rows.length === 0) {
      setParseError('No data rows found in the file.');
      return;
    }
    if (rows.length > 3000) {
      setParseError(`Too many rows (${rows.length}). Maximum 3000 per import. Split your file.`);
      return;
    }
    setParsedRows(rows);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setParseError('');
    setResults([]);
    setImportDone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadResults = () => {
    const rows = results.map((r) => ({
      Row: r.row,
      Status: r.status.toUpperCase(),
      Name: r.name || '',
      'Customer Code': r.customerCode || '',
      Error: r.error || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 10 }, { wch: 25 }, { wch: 14 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Results');
    XLSX.writeFile(wb, 'import_results.xlsx');
  };

  const succeeded = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error').length;
  const progress = parsedRows.length > 0 ? Math.round((succeeded + failed) / parsedRows.length * 100) : 0;

  return (
    <Box className="fade-in" sx={{ maxWidth: 1100, mx: 'auto', pb: 6 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Tooltip title="Back to Customers">
          <IconButton onClick={() => navigate('/customers')} size="small" sx={{ bgcolor: 'action.hover' }}>
            <BackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>Bulk Import Customers</Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a CSV or Excel file to import up to 3,000 customers at once
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadTemplate} size="small">
          Download Template
        </Button>
      </Box>

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>How to import</AlertTitle>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>Download the template above and fill in your customer data.</li>
          <li><strong>Name</strong> and <strong>Phone</strong> columns are required. All others are optional.</li>
          <li>Phone numbers must be 10-digit Indian mobile numbers (starts with 6–9).</li>
          <li>Duplicate phone numbers will be skipped automatically.</li>
          <li>Upload the completed file (CSV or Excel .xlsx / .xls).</li>
        </ol>
      </Alert>

      {/* Upload Zone */}
      {!file && (
        <Card
          sx={{
            mb: 3, border: '2px dashed', borderColor: 'primary.main',
            bgcolor: alpha('#1565c0', 0.03), cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: alpha('#1565c0', 0.07) },
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <UploadIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2, opacity: 0.8 }} />
            <Typography variant="h6" fontWeight={600} mb={1}>
              Drag & drop your file here, or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports .xlsx, .xls, .csv — max 3,000 rows
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </CardContent>
        </Card>
      )}

      {/* File selected indicator */}
      {file && !importDone && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <FileIcon color="primary" />
              <Box flex={1}>
                <Typography fontWeight={600}>{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                  {parsedRows.length > 0 && ` • ${parsedRows.length} rows ready to import`}
                </Typography>
              </Box>
              <Button startIcon={<CancelIcon />} color="error" onClick={handleReset} size="small">
                Remove
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Parse error */}
      {parseError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Could not read file</AlertTitle>
          {parseError}
        </Alert>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && !importDone && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Preview — {parsedRows.length} rows
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Showing key columns. All columns in your file will be imported.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={importMut.isPending ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                onClick={() => importMut.mutate(parsedRows)}
                disabled={importMut.isPending}
                sx={{ px: 3 }}
              >
                {importMut.isPending ? `Importing ${parsedRows.length} rows...` : `Import ${parsedRows.length} Customers`}
              </Button>
            </Box>
            {importMut.isPending && (
              <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />
            )}
          </CardContent>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Name *</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone *</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vehicle No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vehicle Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedRows
                  .slice(previewPage * previewRowsPerPage, (previewPage + 1) * previewRowsPerPage)
                  .map((row, i) => {
                    const absIdx = previewPage * previewRowsPerPage + i + 1;
                    const hasName = !!row.name;
                    const hasPhone = !!row.phone;
                    const rowError = !hasName || !hasPhone;
                    return (
                      <TableRow
                        key={absIdx}
                        sx={{ bgcolor: rowError ? alpha('#f44336', 0.05) : 'inherit' }}
                      >
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{absIdx}</Typography>
                        </TableCell>
                        <TableCell>
                          {!hasName
                            ? <Typography variant="body2" color="error.main" fontStyle="italic">missing</Typography>
                            : <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                          }
                        </TableCell>
                        <TableCell>
                          {!hasPhone
                            ? <Typography variant="body2" color="error.main" fontStyle="italic">missing</Typography>
                            : <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{row.phone}</Typography>
                          }
                        </TableCell>
                        <TableCell><Typography variant="body2">{row.city || '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{row.state || '—'}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {row.vehicleNumber || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2">{row.vehicleType || '—'}</Typography></TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={parsedRows.length}
            page={previewPage}
            onPageChange={(_, p) => setPreviewPage(p)}
            rowsPerPage={previewRowsPerPage}
            rowsPerPageOptions={[previewRowsPerPage]}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count} rows`}
          />
        </Card>
      )}

      {/* Results */}
      {importDone && results.length > 0 && (
        <Box>
          {/* Summary cards */}
          <Stack direction="row" spacing={2} mb={3}>
            <Paper sx={{ flex: 1, p: 2.5, textAlign: 'center', bgcolor: alpha('#4caf50', 0.08), border: '1px solid', borderColor: alpha('#4caf50', 0.3) }}>
              <OkIcon sx={{ color: 'success.main', fontSize: 36, mb: 0.5 }} />
              <Typography variant="h4" fontWeight={800} color="success.main">{succeeded}</Typography>
              <Typography variant="body2" color="text.secondary">Successfully Imported</Typography>
            </Paper>
            <Paper sx={{ flex: 1, p: 2.5, textAlign: 'center', bgcolor: alpha('#f44336', 0.08), border: '1px solid', borderColor: alpha('#f44336', 0.3) }}>
              <ErrorIcon sx={{ color: 'error.main', fontSize: 36, mb: 0.5 }} />
              <Typography variant="h4" fontWeight={800} color="error.main">{failed}</Typography>
              <Typography variant="body2" color="text.secondary">Failed / Skipped</Typography>
            </Paper>
            <Paper sx={{ flex: 1, p: 2.5, textAlign: 'center', bgcolor: alpha('#1565c0', 0.06), border: '1px solid', borderColor: alpha('#1565c0', 0.2) }}>
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {Math.round((succeeded / results.length) * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Success Rate</Typography>
            </Paper>
          </Stack>

          {/* Progress bar */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Overall progress</Typography>
              <Typography variant="caption" color="text.secondary">{progress}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={failed === 0 ? 'success' : 'warning'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Actions */}
          <Box display="flex" gap={2} mb={3}>
            <Button variant="contained" onClick={() => navigate('/customers')}>
              View Customers
            </Button>
            {failed > 0 && (
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadResults}>
                Download Error Report
              </Button>
            )}
            <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleReset}>
              Import Another File
            </Button>
          </Box>

          {/* Results table */}
          <Card>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>Import Results — Row by Row</Typography>
            </CardContent>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Error / Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results
                    .slice(resultPage * resultRowsPerPage, (resultPage + 1) * resultRowsPerPage)
                    .map((r) => (
                      <TableRow key={r.row} sx={{ bgcolor: r.status === 'error' ? alpha('#f44336', 0.04) : 'inherit' }}>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{r.row}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={r.status === 'success' ? 600 : 400}>
                            {r.name || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.status === 'success' ? 'Imported' : 'Failed'}
                            color={r.status === 'success' ? 'success' : 'error'}
                            icon={r.status === 'success' ? <OkIcon /> : <ErrorIcon />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                            {r.customerCode || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color={r.error ? 'error.main' : 'text.secondary'}>
                            {r.error || '✓ Created successfully'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={results.length}
              page={resultPage}
              onPageChange={(_, p) => setResultPage(p)}
              rowsPerPage={resultRowsPerPage}
              rowsPerPageOptions={[resultRowsPerPage]}
            />
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default BulkImportPage;
