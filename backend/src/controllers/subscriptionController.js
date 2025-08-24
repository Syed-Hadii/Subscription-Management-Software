const Subscription = require('../models/subscriptionModel');
const Client = require('../models/clientModel');
const Invoice = require('../models/invoice.model');
const { createInvoiceForSubscription } = require('./invoiceController');

const coerceCustomers = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input.filter(Boolean).map((s) => String(s).trim());
    return String(input)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
};

exports.createSubscription = async (req, res) => {
    try {
        const { name, price, duration, description, startDate, endDate, clients } = req.body;

        // Validate required fields
        if (!name || !price || !duration || !startDate) {
            return res.status(400).json({ error: 'Name, price, duration, and start date are required' });
        }

        // Convert clients to array of ObjectIds
        const clientIds = coerceCustomers(clients);

        // Validate clients exist in one query
        const clientDocs = await Client.find({ _id: { $in: clientIds } }).lean();
        if (clientDocs.length !== clientIds.length) {
            return res.status(400).json({ error: 'One or more clients not found' });
        }

        // Create subscription
        const sub = await Subscription.create({
            name,
            price: Number(price),
            duration,
            description: description || '',
            startDate,
            endDate: endDate || undefined,
            clients: clientIds,
            createdBy: 'System',
        });

        // Generate invoices for all clients concurrently
        const invoicePromises = clientIds.map(clientId =>
            createInvoiceForSubscription(sub, clientId).catch(err => {
                console.warn(`Failed to create invoice for client ${clientId}: ${err.message}`);
                return null; // Continue with other invoices
            })
        );
        const invoices = (await Promise.all(invoicePromises)).filter(Boolean);

        res.status(201).json({ subscription: sub, invoices });
    } catch (err) {
        console.error('Error creating subscription:', err);
        res.status(400).json({ error: err.message });
    }
};


exports.getSubscriptions = async (req, res) => {
    try {
        const list = await Subscription.find()
            .populate({
                path: "clients",
                select: '_id name email'
            })
            .sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSubscriptionById = async (req, res) => {
    try {
        const sub = await Subscription.findOne({ _id: req.params.id });
        if (!sub) return res.status(404).json({ error: 'Subscription not found' });
        res.json(sub);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSubscription = async (req, res) => {
    try {
        const { name, price, duration, description, startDate, endDate, clients } = req.body;

        // Validate required fields
        if (!name || !price || !duration || !startDate) {
            return res.status(400).json({ error: 'Name, price, duration, and start date are required' });
        }

        const update = {
            name,
            price: Number(price),
            duration,
            description: description || '',
            startDate,
            endDate: endDate || undefined,
            clients: coerceCustomers(clients),
        };

        const sub = await Subscription.findOneAndUpdate(
            { _id: req.params.id },
            update,
            { new: true, runValidators: true }
        );
        if (!sub) return res.status(404).json({ error: 'Subscription not found' });
        res.json(sub);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteSubscription = async (req, res) => {
    try {
        const sub = await Subscription.findOneAndDelete({ _id: req.params.id });
        if (!sub) return res.status(404).json({ error: 'Subscription not found' });
        res.json({ message: 'Subscription deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};