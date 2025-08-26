const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
    {
        recipient: { type: String, required: true }, // Client email
        subject: { type: String, required: true },
        content: { type: String, required: true }, // HTML or text content
        attachment: { type: String }, // Filename of attachment (if any)
        type: { type: String, enum: ['reminder', 'weekly', 'invoice'], required: true },
        status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
        sentAt: { type: Date, default: Date.now },
        invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }, // For reminders
    },
    { timestamps: true }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);