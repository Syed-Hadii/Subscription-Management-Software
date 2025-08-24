const express = require('express');
const dashboardRouter = express.Router();
const dashboardController = require('../controllers/dashboardController');

dashboardRouter.get('/data', dashboardController.getDashboardData);
dashboardRouter.put('/invoices/:invoiceId/remove', dashboardController.removeInvoice);

module.exports = dashboardRouter;