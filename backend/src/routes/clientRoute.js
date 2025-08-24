// routes/clientRoutes.js
const express = require('express');
const clientController = require('../controllers/clientController');
const multer = require('multer');
const path = require('path');
const fs = require("fs");


const clientRouter = express.Router();

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG/PNG images are allowed'));
    },
});

clientRouter.post('/', upload.single('image'), clientController.createClient);
clientRouter.get('/', clientController.getClients);
clientRouter.get('/:id', clientController.getClientById);
clientRouter.put('/:id', upload.single('image'), clientController.updateClient);
clientRouter.delete('/:id', clientController.deleteClient);

module.exports = clientRouter;