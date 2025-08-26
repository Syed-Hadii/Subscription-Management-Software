const Invoice = require('../models/invoice.model');
const Client = require('../models/clientModel');
const Subscription = require('../models/subscriptionModel');
const EmailLog = require('../models/email.model'); // Added EmailLog import
const { jsPDF } = require('jspdf');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const generateInvoicePDF = (invoice, client, subscription) => {
    const doc = new jsPDF({ compress: true }); // Enable PDF compression

    // Add company details
    doc.setFontSize(20);
    doc.text(invoice.company.name || 'MyCompany Inc.', 20, 20);
    doc.setFontSize(10);
    doc.text(invoice.company.email || 'contact@mycompany.com', 20, 30);
    doc.text(invoice.company.phone || '+1 (555) 123-4567', 20, 35);
    doc.text(invoice.company.address || '123 Market Street, San Francisco, CA', 20, 40);

    // Invoice header
    doc.setFontSize(16);
    doc.text(`Invoice #${invoice.invoiceId}`, 140, 20);
    doc.setFontSize(10);
    doc.text(`Status: ${invoice.status}`, 140, 30);

    // Bill To
    doc.text('Bill To:', 20, 60);
    doc.text(client.name, 20, 70);
    doc.text(client.email, 20, 75);

    // Dates
    doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 140, 60);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 140, 65);

    // Line items table
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 90, 170, 10, 'F');
    doc.setFontSize(12);
    doc.text('Subscription', 22, 97);
    doc.text('Duration', 80, 97);
    doc.text('Price/Month', 120, 97);
    doc.text('Total', 160, 97);

    const total = invoice.durationMonths * invoice.pricePerMonth;
    doc.text(subscription.name, 22, 110);
    doc.text(`${invoice.durationMonths} months`, 80, 110);
    doc.text(`$${invoice.pricePerMonth.toFixed(2)}`, 120, 110);
    doc.text(`$${total.toFixed(2)}`, 160, 110);

    // Summary
    doc.text('Subtotal:', 140, 130);
    doc.text(`$${total.toFixed(2)}`, 160, 130);
    doc.text('Tax (0%):', 140, 135);
    doc.text('$0.00', 160, 135);
    doc.setFontSize(14);
    doc.text('Amount Due:', 140, 145);
    doc.text(`$${total.toFixed(2)}`, 160, 145);

    if (invoice.notes) {
        doc.setFontSize(10);
        doc.text('Notes:', 20, 160);
        doc.text(invoice.notes, 20, 170, { maxWidth: 170 });
    }

    return doc.output('arraybuffer');
};

const sendInvoiceEmail = async (invoice, client, subscription) => {
    const pdfBuffer = generateInvoicePDF(invoice, client, subscription);

    const mailOptions = {
        from: `"${invoice.company.name}" <${process.env.SMTP_USER}>`,
        to: client.email,
        subject: `Invoice ${invoice.invoiceId} for Your ${subscription.name} Subscription`,
        text: `Dear ${client.name},\n\nThank you for your subscription to ${subscription.name}. Please find your invoice (${invoice.invoiceId}) attached.\n\nBest regards,\n${invoice.company.name}`,
        html: `
            <p>Dear ${client.name},</p>
            <p>Thank you for your subscription to ${subscription.name}. Please find your invoice (${invoice.invoiceId}) attached.</p>
            <p><strong>Invoice Details:</strong></p>
            <ul>
                <li>Invoice ID: ${invoice.invoiceId}</li>
                <li>Subscription: ${subscription.name}</li>
                <li>Duration: ${invoice.durationMonths} months</li>
                <li>Amount Due: $${(invoice.durationMonths * invoice.pricePerMonth).toFixed(2)}</li>
                <li>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</li>
            </ul>
            <p>Best regards,<br>${invoice.company.name}</p>
        `,
        attachments: [
            {
                filename: `Invoice_${invoice.invoiceId}.pdf`,
                content: Buffer.from(pdfBuffer),
                contentType: 'application/pdf',
            },
        ],
    };

    try {
        await transporter.sendMail(mailOptions);
        // Log successful email
        await EmailLog.create({
            recipient: client.email,
            subject: mailOptions.subject,
            content: mailOptions.html,
            attachment: `Invoice_${invoice.invoiceId}.pdf`,
            type: 'invoice', // Use 'invoice' type for invoice emails
            status: 'sent',
            invoiceId: invoice._id,
            sentAt: new Date(),
        });
    } catch (err) {
        console.error(`Failed to send email for invoice ${invoice.invoiceId}: ${err.message}`);
        // Log failed email
        await EmailLog.create({
            recipient: client.email,
            subject: mailOptions.subject,
            content: mailOptions.html,
            attachment: `Invoice_${invoice.invoiceId}.pdf`,
            type: 'invoice',
            status: 'failed',
            invoiceId: invoice._id,
            sentAt: new Date(),
        });
        throw err; // Re-throw to maintain existing error handling
    }
};

const generateInvoiceId = async () => {
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({ invoiceId: { $regex: `^INV-${year}` } });
    return `INV-${year}-${String(count + 1).padStart(3, '0')}`;
};

exports.createInvoiceForSubscription = async (subscription, clientId) => {
    // Validate client and subscription
    const [client, sub] = await Promise.all([
        Client.findById(clientId).lean(),
        Subscription.findById(subscription._id).lean(),
    ]);
    if (!client) throw new Error('Client not found');
    if (!sub) throw new Error('Subscription not found');

    // Calculate duration in months
    let durationMonths;
    switch (subscription.duration) {
        case 'weekly':
            durationMonths = 1 / 4;
            break;
        case 'monthly':
            durationMonths = 1;
            break;
        case 'yearly':
            durationMonths = 12;
            break;
        default:
            durationMonths = 1;
    }

    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice
    const invoice = await Invoice.create({
        invoiceId: await generateInvoiceId(),
        client: clientId,
        subscription: subscription._id,
        durationMonths,
        pricePerMonth: subscription.price,
        currency: 'USD',
        invoiceDate,
        dueDate,
        status: 'Unpaid',
        company: {
            name: 'MyCompany Inc.',
            logo: 'Nil',
            email: 'contact@mycompany.com',
            phone: '+1 (555) 123-4567',
            address: '123 Market Street, San Francisco, CA',
        },
        notes: `Thank you for your subscription to ${subscription.name}.`,
        createdBy: 'System',
    });

    // Send email asynchronously
    sendInvoiceEmail(invoice, client, subscription).catch(err => {
        console.error(`Failed to send email for invoice ${invoice.invoiceId}: ${err.message}`);
    });

    return invoice;
};

exports.createInvoice = async (req, res) => {
    try {
        const {
            client,
            subscription,
            durationMonths,
            pricePerMonth,
            currency,
            invoiceDate,
            dueDate,
            status,
            company,
            notes,
        } = req.body;

        if (!client || !subscription || !durationMonths || !pricePerMonth || !invoiceDate || !dueDate) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        const [clientData, subscriptionData] = await Promise.all([
            Client.findById(client).lean(),
            Subscription.findById(subscription).lean(),
        ]);
        if (!clientData) throw new Error('Client not found');
        if (!subscriptionData) throw new Error('Subscription not found');

        const invoice = await Invoice.create({
            invoiceId: await generateInvoiceId(),
            client,
            subscription,
            durationMonths: Number(durationMonths),
            pricePerMonth: Number(pricePerMonth),
            currency: currency || 'USD',
            invoiceDate,
            dueDate,
            status: status || 'Unpaid',
            company: {
                name: company?.name || 'MyCompany Inc.',
                logo: company?.logo || '/img/company-logo.png',
                email: company?.email || 'contact@mycompany.com',
                phone: company?.phone || '+1 (555) 123-4567',
                address: company?.address || '123 Market Street, San Francisco, CA',
            },
            notes: notes || '',
            createdBy: 'System',
        });

        sendInvoiceEmail(invoice, clientData, subscriptionData).catch(err => {
            console.error(`Failed to send email for invoice ${invoice.invoiceId}: ${err.message}`);
        });

        res.status(201).json(invoice);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('client', '_id name email')
            .populate('subscription', 'name price duration')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id })
            .populate('client', '_id name email')
            .populate('subscription', 'name price duration');
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateInvoice = async (req, res) => {
    try {
        const {
            client,
            subscription,
            durationMonths,
            pricePerMonth,
            currency,
            invoiceDate,
            dueDate,
            status,
            company,
            notes,
        } = req.body;

        if (!client || !subscription || !durationMonths || !pricePerMonth || !invoiceDate || !dueDate) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        const update = {
            client,
            subscription,
            durationMonths: Number(durationMonths),
            pricePerMonth: Number(pricePerMonth),
            currency: currency || 'USD',
            invoiceDate,
            dueDate,
            status: status || 'Unpaid',
            company: {
                name: company?.name || 'MyCompany Inc.',
                logo: company?.logo || 'Nil',
                email: company?.email || 'contact@mycompany.com',
                phone: company?.phone || '+1 (555) 123-4567',
                address: company?.address || '123 Market Street, San Francisco, CA',
            },
            notes: notes || '',
        };

        const invoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id },
            update,
            { new: true, runValidators: true }
        );
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOneAndDelete({ _id: req.params.id });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};