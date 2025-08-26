import React, { useEffect, useMemo, useState } from 'react';
import { Spinner } from "@material-tailwind/react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
  Chip,
  Tooltip,
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
  Textarea,
} from '@material-tailwind/react';
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { API } from '@/configs/base-url';  
import jsPDF from 'jspdf';

const INVOICES_API = `http://93.127.216.35:5000/invoices`;
const CLIENTS_API = `http://93.127.216.35:5000/clients`;

/* Helpers */
function formatMoney(n, currency = 'USD') {
  const val = Number(n || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(val);
}

function statusChipColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid':
      return 'green';
    case 'overdue':
      return 'red';
    default:
      return 'orange';
  }
}

/* Generate PDF Function */
const generatePDF = (invoice) => {
  const doc = new jsPDF();
  const client = invoice.client;
  const subscription = invoice.subscription;
  const total = invoice.durationMonths * invoice.pricePerMonth;

  let yOffset = 20;

  // Add logo if available (assuming it's a base64 data URL or image URL)
  if (invoice.company.logo) {
    try {
      doc.addImage(invoice.company.logo, 'PNG', 20, yOffset, 30, 30); // Adjust size and position
      yOffset += 35; // Adjust text position after logo
    } catch (err) {
      console.warn('Failed to add logo to PDF:', err);
    }
  }

  doc.setFontSize(20);
  doc.text(invoice.company.name || 'MyCompany Inc.', 20, yOffset);
  yOffset += 10;

  doc.setFontSize(10);
  doc.text(invoice.company.email || 'contact@mycompany.com', 20, yOffset);
  yOffset += 5;
  doc.text(invoice.company.phone || '+1 (555) 123-4567', 20, yOffset);
  yOffset += 5;
  doc.text(invoice.company.address || '123 Market Street, San Francisco, CA', 20, yOffset);
  yOffset += 20;

  doc.setFontSize(16);
  doc.text(`Invoice #${invoice.invoiceId}`, 140, 20);

  doc.setFontSize(10);
  doc.text(`Status: ${invoice.status}`, 140, 30);

  doc.text('Bill To:', 20, yOffset);
  yOffset += 10;
  doc.text(client.name, 20, yOffset);
  yOffset += 5;
  doc.text(client.email, 20, yOffset);
  yOffset += 5;

  doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 140, yOffset - 20);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 140, yOffset - 15);

  yOffset += 10;

  doc.setFillColor(240, 240, 240);
  doc.rect(20, yOffset, 170, 10, 'F');

  doc.setFontSize(12);
  doc.text('Subscription', 22, yOffset + 7);
  doc.text('Duration', 80, yOffset + 7);
  doc.text('Price/Month', 120, yOffset + 7);
  doc.text('Total', 160, yOffset + 7);

  yOffset += 20;

  doc.text(subscription.name, 22, yOffset);
  doc.text(`${invoice.durationMonths} months`, 80, yOffset);
  doc.text(formatMoney(invoice.pricePerMonth, invoice.currency), 120, yOffset);
  doc.text(formatMoney(total, invoice.currency), 160, yOffset);

  yOffset += 20;

  doc.text('Subtotal:', 140, yOffset);
  doc.text(formatMoney(total, invoice.currency), 160, yOffset);
  yOffset += 5;
  doc.text('Tax (0%):', 140, yOffset);
  doc.text(formatMoney(0, invoice.currency), 160, yOffset);

  yOffset += 10;

  doc.setFontSize(14);
  doc.text('Amount Due:', 140, yOffset);
  doc.text(formatMoney(total, invoice.currency), 160, yOffset);

  if (invoice.notes) {
    yOffset += 20;
    doc.setFontSize(10);
    doc.text('Notes:', 20, yOffset);
    yOffset += 10;
    doc.text(invoice.notes, 20, yOffset, { maxWidth: 170 });
  }

  doc.save(`Invoice_${invoice.invoiceId}.pdf`);
};

/* Print Invoice Function */
const printInvoice = (invoice) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  // Write the HTML content for the print window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoice.invoiceId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            background: white;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .company-info {
            flex: 2;
          }
          .invoice-info {
            flex: 1;
            text-align: right;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .bill-to {
            flex: 1;
          }
          .dates {
            flex: 1;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          th {
            background-color: #f8f9fa;
          }
          .total-row {
            font-weight: bold;
          }
          .summary {
            margin-left: auto;
            width: 50%;
          }
          .summary div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .notes {
            margin-top: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
          }
          @media print {
            body {
              padding: 0;
            }
            .invoice-container {
              border: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="company-info">
              <h2>${invoice.company?.name || 'Company'}</h2>
              <p>${invoice.company?.email || 'contact@mycompany.com'}</p>
              <p>${invoice.company?.phone || '+1 (555) 123-4567'}</p>
              <p>${invoice.company?.address || '123 Market Street, San Francisco, CA'}</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <p><strong>Invoice ID:</strong> ${invoice.invoiceId}</p>
              <p><strong>Status:</strong> ${invoice.status}</p>
            </div>
          </div>
          
          <div class="invoice-details">
            <div class="bill-to">
              <h3>Bill To:</h3>
              <p>${invoice.client?.name}</p>
              <p>${invoice.client?.email}</p>
            </div>
            <div class="dates">
              <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Subscription</th>
                <th>Duration</th>
                <th>Price / Month</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.subscription?.name}</td>
                <td>${invoice.durationMonths} months</td>
                <td>${formatMoney(invoice.pricePerMonth, invoice.currency)}</td>
                <td>${formatMoney(invoice.durationMonths * invoice.pricePerMonth, invoice.currency)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary">
            <div>
              <span>Subtotal:</span>
              <span>${formatMoney(invoice.durationMonths * invoice.pricePerMonth, invoice.currency)}</span>
            </div>
            <div>
              <span>Tax (0%):</span>
              <span>${formatMoney(0, invoice.currency)}</span>
            </div>
            <div class="total-row">
              <span>Amount Due:</span>
              <span>${formatMoney(invoice.durationMonths * invoice.pricePerMonth, invoice.currency)}</span>
            </div>
          </div>
          
          ${invoice.notes ? `
            <div class="notes">
              <h4>Notes:</h4>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}
        </div>
        
        <script>
          // Print the invoice when the window loads
          window.onload = function() {
            window.print();
            // Close the window after printing
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
};

/* Invoice Preview Template */
function InvoicePreview({ invoice }) {
  const total = useMemo(
    () => (invoice.durationMonths || 0) * (invoice.pricePerMonth || 0),
    [invoice.durationMonths, invoice.pricePerMonth]
  );

  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl bg-gray-50 shadow-lg ring-1 ring-gray-200 print-content">
      {/* Header / Branding */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={invoice.company?.logo || '/img/company-logo.png'}
              alt="Company Logo"
              size="lg"
              variant="rounded"
              className="ring-2 ring-white/60"
            />
            <div>
              <Typography variant="h5" color="white" className="font-bold">
                {invoice.company?.name || 'Company'}
              </Typography>
              <Typography variant="small" color="white" className="opacity-80">
                {invoice.company?.email} • {invoice.company?.phone}
              </Typography>
              <Typography variant="small" color="white" className="opacity-80">
                {invoice.company?.address}
              </Typography>
            </div>
          </div>
          <div className="text-right">
            <Typography variant="small" color="white" className="opacity-80">
              Invoice ID
            </Typography>
            <Typography variant="h6" color="white" className="font-extrabold tracking-wide">
              {invoice.invoiceId}
            </Typography>
            <Chip
              value={invoice.status}
              color={statusChipColor(invoice.status)}
              variant="ghost"
              className="mt-2 w-fit bg-white/10 text-white backdrop-blur-sm"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_10%,white,transparent_35%)]" />
      </div>

      {/* Bill To & Dates */}
      <div className="grid grid-cols-1 gap-6 border-b border-blue-gray-50 p-6 md:grid-cols-2">
        <div>
          <Typography variant="small" className="mb-1 text-blue-gray-600">
            Bill To
          </Typography>
          <Typography variant="h6" className="font-semibold">
            {invoice.client?.name}
          </Typography>
          <Typography variant="small" className="text-blue-gray-600">
            {invoice.client?.email}
          </Typography>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Typography variant="small" className="mb-1 text-blue-gray-600">
              Invoice Date
            </Typography>
            <Typography className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</Typography>
          </div>
          <div>
            <Typography variant="small" className="mb-1 text-blue-gray-600">
              Due Date
            </Typography>
            <Typography className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</Typography>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="p-6">
        <div className="overflow-hidden rounded-xl border border-blue-gray-50">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-blue-gray-50/60">
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wide text-blue-gray-600">
                  Subscription
                </th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wide text-blue-gray-600">
                  Duration
                </th>
                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wide text-blue-gray-600">
                  Price / Month
                </th>
                <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wide text-blue-gray-600">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-blue-gray-50">
                <td className="py-4 px-4">
                  <Typography className="font-medium">{invoice.subscription?.name}</Typography>
                  <Typography variant="small" className="text-blue-gray-600">
                    Auto-renewing unless cancelled
                  </Typography>
                </td>
                <td className="py-4 px-4">{invoice.durationMonths} months</td>
                <td className="py-4 px-4">{formatMoney(invoice.pricePerMonth, invoice.currency)}</td>
                <td className="py-4 px-4 text-right">{formatMoney(total, invoice.currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 flex flex-col items-end gap-2">
          <div className="w-full border-t border-blue-gray-50 pt-4 sm:w-1/2">
            <div className="flex items-center justify-between">
              <Typography variant="small" className="text-blue-gray-600">
                Subtotal
              </Typography>
              <Typography className="font-medium">{formatMoney(total, invoice.currency)}</Typography>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Typography variant="small" className="text-blue-gray-600">
                Tax (0%)
              </Typography>
              <Typography className="font-medium">{formatMoney(0, invoice.currency)}</Typography>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Typography className="font-semibold">Amount Due</Typography>
              <Typography className="text-xl font-extrabold">{formatMoney(total, invoice.currency)}</Typography>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes ? (
          <div className="mt-6 rounded-xl bg-blue-gray-50/60 p-4">
            <Typography variant="small" className="mb-1 font-semibold">
              Notes
            </Typography>
            <Typography variant="small" className="text-blue-gray-700">{invoice.notes}</Typography>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* Invoice Card (grid item) */
function InvoiceCard({ invoice, onView, onEdit, onDelete }) {
  const total = (invoice.durationMonths || 0) * (invoice.pricePerMonth || 0);

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-blue-gray-100 bg-white shadow-sm transition-all hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500" />
      <CardBody className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={invoice.company?.logo || '/img/company-logo.png'}
              alt="Logo"
              size="sm"
              variant="rounded"
              className="ring-1 ring-blue-gray-100"
            />
            <div>
              <Typography className="font-semibold">{invoice.client?.name}</Typography>
              <Typography variant="small" className="text-blue-gray-600">{invoice.invoiceId}</Typography>
            </div>
          </div>
          <Chip value={invoice.status} color={statusChipColor(invoice.status)} className="w-fit" />
        </div>

        <div className="mb-4 space-y-1">
          <Typography variant="small" className="text-blue-gray-600">
            {invoice.subscription?.name} • {invoice.durationMonths} months
          </Typography>
          <Typography variant="small" className="text-blue-gray-600">
            Invoice: {new Date(invoice.invoiceDate).toLocaleDateString()} • Due: {new Date(invoice.dueDate).toLocaleDateString()}
          </Typography>
        </div>

        <div className="mb-5 flex items-end justify-between">
          <div>
            <Typography variant="small" className="text-blue-gray-600">Total Amount</Typography>
            <Typography variant="h5" className="font-extrabold">{formatMoney(total, invoice.currency)}</Typography>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Download PDF">
              <IconButton variant="text" onClick={() => generatePDF(invoice)}>
                <ArrowDownTrayIcon className="h-5 w-5 text-blue-gray-700" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Print">
              <IconButton variant="text" onClick={() => printInvoice(invoice)}>
                <PrinterIcon className="h-5 w-5 text-blue-gray-700" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outlined" size="sm" onClick={onView} className="flex items-center gap-2">
            <EyeIcon className="h-4 w-4" /> View
          </Button>
          <Button variant="text" size="sm" onClick={onEdit} className="flex items-center gap-2">
            <PencilSquareIcon className="h-4 w-4" /> Edit
          </Button>
          <Button color="red" size="sm" onClick={onDelete} className="flex items-center gap-2">
            <TrashIcon className="h-4 w-4" /> Delete
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* Main Page */
export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);     
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [current, setCurrent] = useState(null);

  // Add print CSS dynamically
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: auto;
          background: white;
          box-shadow: none;
          border: none;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fetch invoices and clients on mount
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const response = await axios.get(INVOICES_API);
        console.log('Fetched invoices:', response.data);
        setInvoices(response.data);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        alert('Failed to fetch invoices');
      } finally {
        setLoadingInvoices(false);
      }
    };

    const fetchClients = async () => {
      
      try {
        const response = await axios.get(CLIENTS_API);
        console.log('Fetched clients:', response.data);
        setClients(response.data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        alert('Failed to fetch clients');
      }  
    };

    fetchInvoices();
    fetchClients();
  }, []);

  const handleView = (inv) => {
    setCurrent(inv);
    setOpenView(true);
  };

  const handleEdit = async (inv) => {
    setCurrent(inv);
    setForm({
      _id: inv._id,
      invoiceId: inv.invoiceId || '',
      client: {
        _id: inv.client?._id || '',
        name: inv.client?.name || '',
        email: inv.client?.email || '',
      },
      subscription: {
        _id: inv.subscription?._id || '',
        name: inv.subscription?.name || '',
      },
      durationMonths: String(inv.durationMonths),
      pricePerMonth: String(inv.pricePerMonth),
      currency: inv.currency || 'USD',
      invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      status: inv.status,
      company: {
        name: inv.company?.name || 'MyCompany Inc.',
        logo: inv.company?.logo || '/img/company-logo.png',
        email: inv.company?.email || 'contact@mycompany.com',
        phone: inv.company?.phone || '+1 (555) 123-4567',
        address: inv.company?.address || '123 Market Street, San Francisco, CA',
      },
      notes: inv.notes || '',
    });
    setOpenEdit(true);
  };

  const handleDelete = (inv) => {
    setCurrent(inv);
    setOpenDelete(true);
  };

  const [form, setForm] = useState({
    _id: '',
    invoiceId: '',
    client: { _id: '', name: '', email: '' },
    subscription: { _id: '', name: '' },
    durationMonths: '12',
    pricePerMonth: '20',
    currency: 'USD',
    invoiceDate: '',
    dueDate: '',
    status: 'Unpaid',
    company: {
      name: 'MyCompany Inc.',
      logo: '/img/company-logo.png',
      email: 'contact@mycompany.com',
      phone: '+1 (555) 123-4567',
      address: '123 Market Street, San Francisco, CA',
    },
    notes: '',
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setForm((f) => ({ ...f, company: { ...f.company, logo: reader.result } }));
      reader.readAsDataURL(file);
    }
  };

  const handleClientChange = (clientId) => {
    const selectedClient = clients.find((client) => client._id === clientId) || { _id: '', name: '', email: '' };
    setForm((f) => ({
      ...f,
      client: {
        _id: selectedClient._id,
        name: selectedClient.name,
        email: selectedClient.email,
      },
    }));
  };

  const saveEdit = async () => {
    try {
      const data = {
        client: form.client?._id,
        subscription: form.subscription?._id,
        invoiceId: form.invoiceId,
        durationMonths: Number(form.durationMonths),
        pricePerMonth: Number(form.pricePerMonth),
        currency: form.currency,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        status: form.status,
        company: form.company,
        notes: form.notes,
      };

      await axios.put(`${INVOICES_API}/${form._id}`, data);
      const response = await axios.get(INVOICES_API);
      setInvoices(response.data);
      setOpenEdit(false);
    } catch (err) {
      console.error('Error updating invoice:', err);
      alert('Failed to update invoice');
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${INVOICES_API}/${current._id}`);
      const response = await axios.get(INVOICES_API);
      setInvoices(response.data);
      setOpenDelete(false);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice');
    }
  };

  return (
    <div className="mt-12 mb-8 space-y-10 p-6 rounded-lg">
      {/* Page Header */}
      <Card className="border border-blue-gray-700 shadow-sm bg-gray-800 text-white">
        <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div>
              <Typography variant="h5" color="white" className="font-bold">
                Invoices
              </Typography>
              <Typography variant="small" color="white">
                Auto-generated from new subscriptions. View, edit, or delete.
              </Typography>
            </div>
          </div>
        </CardHeader>
      </Card>
 {loadingInvoices ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-10 w-10 text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {invoices.map((inv) => (
          <InvoiceCard
            key={inv._id}
            invoice={inv}
            onView={() => handleView(inv)}
            onEdit={() => handleEdit(inv)}
            onDelete={() => handleDelete(inv)}
          />
        ))}
      </div>
      )}
      {/* Grid of invoices */}
     

      {/* View Dialog */}
      <Dialog size="xl" open={openView} handler={() => setOpenView(false)} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex w-full items-center justify-between">
          <Typography variant="h5">Invoice Preview</Typography>
          <div className="flex gap-2">
            <Button variant="outlined" size="sm" onClick={() => generatePDF(current)} className="flex items-center gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" /> Download
            </Button>
            <Button variant="outlined" size="sm" onClick={() => printInvoice(current)} className="flex items-center gap-2">
              <PrinterIcon className="h-4 w-4" /> Print
            </Button>
          </div>
        </DialogHeader>
        <DialogBody className="bg-blue-gray-50/50">
          {current && <InvoicePreview invoice={current} />}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setOpenView(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} handler={() => setOpenEdit(false)} size="lg">
        <DialogHeader>
          <Typography variant="h5">Edit Invoice</Typography>
        </DialogHeader>
        <DialogBody divider className="max-h-[70vh] overflow-y-auto grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Invoice ID"
              value={form.invoiceId}
              onChange={(e) => setForm((f) => ({ ...f, invoiceId: e.target.value }))}
            />
          </div>
          <Select
            label="Client Name"
            value={form.client?._id}
            onChange={handleClientChange}
          >
            {clients.map((client) => (
              <Option key={client._id} value={client._id}>
                {client.name}
              </Option>
            ))}
          </Select>
          <Input
            label="Client Email"
            value={form.client?.email || ''}
            disabled
          />
          <Input
            label="Subscription Name"
            value={form.subscription?.name || ''}
            onChange={(e) => setForm((f) => ({ ...f, subscription: { ...f.subscription, name: e.target.value } }))}
          />
          <Input
            type="number"
            label="Duration (months)"
            value={form.durationMonths}
            onChange={(e) => setForm((f) => ({ ...f, durationMonths: e.target.value }))}
          />
          <Input
            type="number"
            label="Price / Month"
            value={form.pricePerMonth}
            onChange={(e) => setForm((f) => ({ ...f, pricePerMonth: e.target.value }))}
          />
          <Input
            label="Invoice Date"
            type="date"
            value={form.invoiceDate}
            onChange={(e) => setForm((f) => ({ ...f, invoiceDate: e.target.value }))}
          />
          <Input
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e }))}
          >
            <Option value="Paid">Paid</Option>
            <Option value="Unpaid">Unpaid</Option>
            <Option value="Overdue">Overdue</Option>
          </Select>

          <div className="md:col-span-2 flex flex-col gap-2">
            <Typography variant="small" className="font-medium">
              Company Logo / Profile Picture
            </Typography>
            <Input type="file" accept="image/*" onChange={handleLogoUpload} />
            {form.company.logo && (
              <img src={form.company.logo} alt="Logo Preview" className="h-16 w-16 rounded-md border mt-2 object-cover" />
            )}
          </div>

          <div className="md:col-span-2">
            <Textarea
              rows={3}
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </DialogBody>
        <DialogFooter className="flex items-center justify-between sticky bottom-0 bg-white/90 backdrop-blur-md">
          <Button variant="text" color="blue-gray" onClick={() => setOpenEdit(false)}>
            Cancel
          </Button>
          <Button color="blue" onClick={saveEdit}>
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDelete} handler={() => setOpenDelete(false)}>
        <DialogHeader>Confirm Deletion</DialogHeader>
        <DialogBody divider>
          Are you sure you want to delete invoice <strong>{current?.invoiceId}</strong>?
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setOpenDelete(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default Invoices;