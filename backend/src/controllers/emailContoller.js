    const nodemailer = require('nodemailer');
    const { jsPDF } = require('jspdf');
    const cron = require('node-cron');
    const Invoice = require('../models/invoice.model');
    const Client = require('../models/clientModel');
    const Subscription = require('../models/subscriptionModel');
    const EmailLog = require('../models/email.model');
    const ReminderTemplate = require('../models/reminderTemplateModel');
    require('dotenv').config();

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // Generate PDF for invoice reminders
    const generateInvoicePDF = (invoice, client, subscription) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(invoice.company.name || 'MyCompany Inc.', 20, 20);
        doc.setFontSize(10);
        doc.text(invoice.company.email || 'contact@mycompany.com', 20, 30);
        doc.text(invoice.company.phone || '+1 (555) 123-4567', 20, 35);
        doc.text(invoice.company.address || '123 Market Street, San Francisco, CA', 20, 40);
        doc.setFontSize(16);
        doc.text(`Invoice #${invoice.invoiceId}`, 140, 20);
        doc.setFontSize(10);
        doc.text(`Status: ${invoice.status}`, 140, 30);
        doc.text('Bill To:', 20, 60);
        doc.text(client.name, 20, 70);
        doc.text(client.email, 20, 75);
        doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 140, 60);
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 140, 65);
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

    // Send email
    const sendEmail = async (to, subject, content, attachment = null, invoice = null, type = 'weekly') => {
        const mailOptions = {
            from: `"MyCompany Inc." <${process.env.SMTP_USER}>`,
            to,
            subject,
            text: content.replace(/<[^>]+>/g, ''), // Strip HTML for text version
            html: content,
            attachments: attachment ? [{ filename: attachment.name, content: attachment.content, contentType: attachment.type }] : [],
        };

        try {
            await transporter.sendMail(mailOptions);
            await EmailLog.create({
                recipient: to,
                subject,
                content,
                attachment: attachment ? attachment.name : null,
                type,
                status: 'sent',
                invoiceId: invoice ? invoice._id : null,
                sentAt: new Date(),
            });
        } catch (err) {
            console.error(`Failed to send email to ${to}:`, err);
            await EmailLog.create({
                recipient: to,
                subject,
                content,
                attachment: attachment ? attachment.name : null,
                type,
                status: 'failed',
                invoiceId: invoice ? invoice._id : null,
                sentAt: new Date(),
            });
            throw err;
        }
    };

    // Initialize reminder templates
    const initializeReminderTemplates = async () => {
        const templates = [
            { type: 'day3', content: 'Hi, your payment is due. Please pay within 3 days.' },
            { type: 'day7', content: 'Reminder: Your payment is still pending after 7 days.' },
            { type: 'day14', content: 'Final notice: Payment overdue for 14 days.' },
        ];

        for (const template of templates) {
            await ReminderTemplate.findOneAndUpdate(
                { type: template.type },
                { content: template.content },
                { upsert: true, new: true }
            );
        }
    };

    // Schedule reminder emails
    cron.schedule('0 0 * * *', async () => { // Run daily at midnight
        try {
            const now = new Date();
            const invoices = await Invoice.find({ status: 'Unpaid' })
                .populate('client', '_id name email')
                .populate('subscription', 'name price duration');

            for (const invoice of invoices) {
                const daysOverdue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
                let templateType;

                if (daysOverdue === 3) templateType = 'day3';
                else if (daysOverdue === 7) templateType = 'day7';
                else if (daysOverdue === 14) templateType = 'day14';
                else continue;

                const template = await ReminderTemplate.findOne({ type: templateType });
                if (!template) continue;

                const client = invoice.client;
                const subscription = invoice.subscription;
                const pdfBuffer = generateInvoicePDF(invoice, client, subscription);

                const subject = `Payment Reminder: Invoice ${invoice.invoiceId}`;
                const content = `
                    <p>Dear ${client.name},</p>
                    <p>${template.content}</p>
                    <p><strong>Invoice Details:</strong></p>
                    <ul>
                        <li>Invoice ID: ${invoice.invoiceId}</li>
                        <li>Subscription: ${subscription.name}</li>
                        <li>Amount Due: $${(invoice.durationMonths * invoice.pricePerMonth).toFixed(2)}</li>
                        <li>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</li>
                    </ul>
                    <p>Please find the invoice attached.</p>
                    <p>Best regards,<br>MyCompany Inc.</p>
                `;

                await sendEmail(
                    client.email,
                    subject,
                    content,
                    { name: `Invoice_${invoice.invoiceId}.pdf`, content: Buffer.from(pdfBuffer), type: 'application/pdf' },
                    invoice,
                    'reminder'
                );
            }
        } catch (err) {
            console.error('Error in reminder cron job:', err);
        }
    });

    // Initialize templates on server start
    initializeReminderTemplates();

    // Reminder template endpoints
    exports.getReminderTemplates = async (req, res) => {
        try {
            const templates = await ReminderTemplate.find();
            res.json(templates);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    exports.updateReminderTemplates = async (req, res) => {
        try {
            const { day3, day7, day14 } = req.body;
            if (!day3 || !day7 || !day14) {
                return res.status(400).json({ error: 'All template contents are required' });
            }

            await Promise.all([
                ReminderTemplate.findOneAndUpdate({ type: 'day3' }, { content: day3 }, { upsert: true, new: true }),
                ReminderTemplate.findOneAndUpdate({ type: 'day7' }, { content: day7 }, { upsert: true, new: true }),
                ReminderTemplate.findOneAndUpdate({ type: 'day14' }, { content: day14 }, { upsert: true, new: true }),
            ]);

            res.json({ message: 'Templates updated successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // Weekly email scheduling
    exports.scheduleWeeklyEmail = async (req, res) => {
        try {
            const { subject, content, attachment, recipients, scheduleDay, scheduleTime, selectedClients } = req.body;
            if (!subject || !content || !scheduleDay || !scheduleTime) {
                return res.status(400).json({ error: 'Subject, content, scheduleDay, and scheduleTime are required' });
            }

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayIndex = days.indexOf(scheduleDay);
            if (dayIndex === -1) {
                return res.status(400).json({ error: 'Invalid schedule day' });
            }

            const [hour, minute] = scheduleTime.split(':').map(Number);
            if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                return res.status(400).json({ error: 'Invalid schedule time' });
            }

            let clients;
            if (recipients === 'all') {
                clients = await Client.find({ _id: { $in: (await Subscription.find()).flatMap(s => s.clients) } });
            } else {
                clients = await Client.find({ _id: { $in: selectedClients || [] } });
            }

            // Schedule email
            cron.schedule(`${minute} ${hour} * * ${dayIndex}`, async () => {
                for (const client of clients) {
                    try {
                        await sendEmail(
                            client.email,
                            subject,
                            content,
                            attachment ? { name: attachment.name, content: Buffer.from(attachment.content, 'base64'), type: attachment.type } : null,
                            null,
                            'weekly'
                        );
                    } catch (err) {
                        console.warn(`Failed to send weekly email to ${client.email}:`, err);
                    }
                }
            }, { scheduled: true });

            res.json({ message: 'Weekly email scheduled successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // Email logs
    exports.getEmailLogs = async (req, res) => {
        try {
            const logs = await EmailLog.find()
                .populate('invoiceId', 'invoiceId')
                .sort({ sentAt: -1 });
            res.json(logs);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // Add this new endpoint
    exports.testReminderEmails = async (req, res) => {
        try {
            const now = new Date();
            const invoices = await Invoice.find({ status: 'Unpaid' })
                .populate('client', '_id name email')
                .populate('subscription', 'name price duration');

            for (const invoice of invoices) {
                const daysOverdue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
                let templateType;

                if (daysOverdue === 3) templateType = 'day3';
                else if (daysOverdue === 7) templateType = 'day7';
                else if (daysOverdue === 14) templateType = 'day14';
                else continue;

                const template = await ReminderTemplate.findOne({ type: templateType });
                if (!template) continue;

                const client = invoice.client;
                const subscription = invoice.subscription;
                const pdfBuffer = generateInvoicePDF(invoice, client, subscription);

                const subject = `Payment Reminder: Invoice ${invoice.invoiceId}`;
                const content = `
                        <p>Dear ${client.name},</p>
                        <p>${template.content}</p>
                        <p><strong>Invoice Details:</strong></p>
                        <ul>
                            <li>Invoice ID: ${invoice.invoiceId}</li>
                            <li>Subscription: ${subscription.name}</li>
                            <li>Amount Due: $${(invoice.durationMonths * invoice.pricePerMonth).toFixed(2)}</li>
                            <li>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</li>
                        </ul>
                        <p>Please find the invoice attached.</p>
                        <p>Best regards,<br>MyCompany Inc.</p>
                    `;

                await sendEmail(
                    client.email,
                    subject,
                    content,
                    { name: `Invoice_${invoice.invoiceId}.pdf`, content: Buffer.from(pdfBuffer), type: 'application/pdf' },
                    invoice,
                    'reminder'
                );
            }
            res.json({ message: 'Test reminder emails processed successfully' });
        } catch (err) {
            console.error('Error in test reminder emails:', err);
            res.status(500).json({ error: err.message });
        }
    };