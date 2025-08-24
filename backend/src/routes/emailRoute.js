const express = require('express');
const emailRouter = express.Router();
const emailController = require('../controllers/emailContoller');

emailRouter.get('/reminder-templates', emailController.getReminderTemplates);
emailRouter.put('/reminder-templates', emailController.updateReminderTemplates);
emailRouter.post('/weekly-email', emailController.scheduleWeeklyEmail);
emailRouter.get('/email-logs', emailController.getEmailLogs);
emailRouter.post('/test-reminder-emails', emailController.testReminderEmails); // New test endpoint

module.exports = emailRouter;