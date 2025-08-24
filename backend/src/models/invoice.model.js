// models/invoiceModel.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        invoiceId: { type: String, required: true, unique: true }, // e.g., INV-2025-001
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
        },
        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
            required: true,
        },
        durationMonths: { type: Number, required: true, min: 1 },
        pricePerMonth: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'USD' },
        invoiceDate: { type: Date, required: true },
        dueDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ['Paid', 'Unpaid', 'Overdue'],
            default: 'Unpaid',
        },
        company: {
            name: { type: String, default: 'MyCompany Inc.' },
            logo: { type: String, default: 'Nil' }, // Fallback logo
            email: { type: String, default: 'contact@mycompany.com' },
            phone: { type: String, default: '+1 (555) 123-4567' },
            address: { type: String, default: '123 Market Street, San Francisco, CA' },
        },
        notes: { type: String, default: '' },
        createdBy: { type: String, default: 'System' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);