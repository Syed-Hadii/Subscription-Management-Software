// controllers/clientController.js
const Client = require('../models/clientModel');
const fs = require('fs');
const path = require('path');

// Create a new client
exports.createClient = async (req, res) => {
    try {
        const { name, phone, email, address, company, notes, tags } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : '';

        // Validate required fields
        if (!name || !phone || !email) {
            return res.status(400).json({ error: 'Name, phone, and email are required' });
        }

        // Format tags
        const formattedTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];

        const client = new Client({
            name,
            phone,
            email,
            address: address || '',
            company: company || '',
            notes: notes || '',
            tags: formattedTags,
            image,
        });

        await client.save();
        res.status(201).json(client);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    }
};

// Get all clients
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// Get client by ID
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// Update a client
exports.updateClient = async (req, res) => {
    try {
        const { name, phone, email, address, company, notes, tags } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : undefined;

        // Format tags
        const formattedTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : undefined;

        const updateData = {
            name: name || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            company: company || undefined,
            notes: notes || undefined,
            tags: formattedTags || undefined,
            image: image || undefined,
        };

        // Remove undefined fields to avoid overwriting with undefined
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    }
};

// Delete a client
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Optionally delete the image file
        if (client.image) {
            const imagePath = path.join(__dirname, '..', client.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await client.deleteOne();
        res.json({ message: 'Client deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};