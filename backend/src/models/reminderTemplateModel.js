const mongoose = require('mongoose');

const reminderTemplateSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['day3', 'day7', 'day14'], required: true, unique: true },
        content: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ReminderTemplate', reminderTemplateSchema);