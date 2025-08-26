const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Routes 
const clientRouter = require('./routes/clientRoute');
const subscriptionRouter = require('./routes/subscriptionRoute');
const invoiceRouter = require('./routes/invoiceRoute'); 2
const emailRouter = require('./routes/emailRoute');
const dashboardRouter = require('./routes/dashboardRoutes');
const adminRouter = require('./routes/adminRoute');
// const invoiceRoutes = require('./routes/authRoute');
// const emailLogRoutes = require('./routes/authRoute');

// Middleware
// const { authMiddleware } = require('./src/middleware/auth.middleware');

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.use(express.json());


// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB:', err));

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Routes 
app.use('/clients', clientRouter);
app.use('/subscriptions', subscriptionRouter);
app.use('/invoices', invoiceRouter);
app.use('/email', emailRouter);
app.use('/dashboard', dashboardRouter);
app.use('/auth', adminRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
