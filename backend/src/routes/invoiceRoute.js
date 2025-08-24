// routes/invoiceRouter.js
const express = require('express');
const invoiceRouter = express.Router();
const ctrl = require('../controllers/invoiceController');

invoiceRouter.post('/', ctrl.createInvoice);
invoiceRouter.get('/', ctrl.getInvoices);
invoiceRouter.get('/:id', ctrl.getInvoiceById);
invoiceRouter.put('/:id', ctrl.updateInvoice);
invoiceRouter.delete('/:id', ctrl.deleteInvoice);

module.exports = invoiceRouter;