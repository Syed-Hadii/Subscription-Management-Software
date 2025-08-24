// controllers/dashboardController.js
const mongoose = require('mongoose');
const Invoice = require('../models/invoice.model');
const Subscription = require('../models/subscriptionModel');
const Client = require('../models/clientModel');

const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) => { const e = new Date(d); e.setHours(23, 59, 59, 999); return e; };

// helper: generate list of last N date strings YYYY-MM-DD
const genLastNDates = (n) => {
    const arr = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
};

// small helper: ISO week number (JS) — used only to compute week labels
function getISOWeek(date) {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

exports.getDashboardData = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = getStartOfMonth();

        // earliest dates needed for aggregation
        const earliestMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const earliestDay = (() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; })();

        // Prepare some parallel promises: counts + paidThisMonth + MRR
        const countPromises = [
            Subscription.countDocuments({
                $or: [{ endDate: { $gte: now } }, { endDate: null }], // Include null endDate
                clients: { $ne: [] }
            }),
            Invoice.countDocuments({ status: { $in: ['Unpaid', 'Overdue'] } }),
            Invoice.aggregate([
                { $match: { status: 'Paid', updatedAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: { $multiply: ['$durationMonths', '$pricePerMonth'] } } } },
            ]),
            // MRR aggregation
            Subscription.aggregate([
                {
                    $match: {
                        $or: [{ endDate: { $gte: now } }, { endDate: null }], // Match active subscriptions
                        clients: { $ne: [] }
                    }
                },
                {
                    $project: {
                        monthlyPrice: {
                            $cond: [
                                { $eq: ['$duration', 'yearly'] },
                                { $divide: ['$price', 12] },
                                {
                                    $cond: [
                                        { $eq: ['$duration', 'weekly'] },
                                        { $multiply: ['$price', 52 / 12] }, // Convert weekly to monthly
                                        '$price' // Monthly
                                    ]
                                }
                            ]
                        },
                        numClients: { $size: { $ifNull: ['$clients', []] } }
                    }
                },
                { $group: { _id: null, mrr: { $sum: { $multiply: ['$monthlyPrice', '$numClients'] } } } }
            ]),
        ];

        // Single heavy aggregation to fetch payments by day/week/month in one DB call
        const paymentsFacetPipeline = [
            { $match: { status: 'Paid', updatedAt: { $gte: earliestMonth } } },
            {
                $project: {
                    total: { $multiply: ['$durationMonths', '$pricePerMonth'] },
                    date: '$updatedAt',
                }
            },
            {
                $facet: {
                    byDay: [
                        { $match: { date: { $gte: earliestDay } } },
                        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$total' } } },
                        { $sort: { '_id': 1 } }
                    ],
                    byWeek: [
                        { $group: { _id: { year: { $isoWeekYear: '$date' }, week: { $isoWeek: '$date' } }, total: { $sum: '$total' } } },
                        { $sort: { '_id.year': 1, '_id.week': 1 } }
                    ],
                    byMonth: [
                        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$total' } } },
                        { $sort: { '_id': 1 } }
                    ]
                }
            }
        ];

        // run them in parallel (notice last element is the aggregate for payments)
        const [activeSubscriptions, outstandingInvoices, paidThisMonthAgg, mrrAgg, paymentsFacet] = await Promise.all([
            ...countPromises,
            Invoice.aggregate(paymentsFacetPipeline)
        ]);

        const paidThisMonth = paidThisMonthAgg[0]?.total || 0;
        const mrr = mrrAgg[0]?.mrr || 0;

        // prepare day labels (last 7 days)
        const dayLabels = genLastNDates(7); // ['YYYY-MM-DD', ...]
        const byDay = (paymentsFacet[0]?.byDay || []);
        const dayTotalsMap = byDay.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});
        const daySeries = dayLabels.map(d => dayTotalsMap[d] || 0);

        // prepare last 5 weeks
        const lastWeeks = [];
        const nowDate = new Date();
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setDate(nowDate.getDate() - i * 7);
            lastWeeks.push({ year: d.getUTCFullYear(), week: getISOWeek(d) });
        }
        const weekKey = (y, w) => `${y}-W${String(w).padStart(2, '0')}`;
        const byWeek = (paymentsFacet[0]?.byWeek || []);
        const weekMap = byWeek.reduce((acc, r) => { acc[weekKey(r._id.year, r._id.week)] = r.total; return acc; }, {});
        const weekSeries = lastWeeks.map(w => weekMap[weekKey(w.year, w.week)] || 0);
        const weekLabels = lastWeeks.map(w => `W${w.week}`);

        // prepare last 12 months
        const monthLabelsKeys = [];
        const monthLabels = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toISOString().slice(0, 7); // 'YYYY-MM'
            monthLabelsKeys.push(key);
            monthLabels.push(d.toLocaleString('en-US', { month: 'short' }));
        }
        const byMonth = (paymentsFacet[0]?.byMonth || []);
        const monthMap = byMonth.reduce((acc, r) => { acc[r._id] = r.total; return acc; }, {});
        const monthSeries = monthLabelsKeys.map(k => monthMap[k] || 0);

        const recentSubscriptions = await Subscription.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name price duration startDate endDate clients createdAt')
            .populate('clients', 'name') // Populate client name
            .lean();

        const formattedSubscriptions = recentSubscriptions.map(sub => ({
            client: sub.clients && sub.clients[0] ? sub.clients[0].name : 'Unknown',
            plan: `${sub.name} (${sub.duration.charAt(0).toUpperCase() + sub.duration.slice(1)})`,
            price: sub.price,
            start: sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '—',
            status: (sub.endDate == null || sub.endDate >= now) ? 'Active' : 'Paused',
        }));

        // Recent invoices - populate client
        const recentInvoices = await Invoice.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('invoiceId client pricePerMonth durationMonths dueDate status')
            .populate('client', 'name') // Populate client name
            .lean();

        const formattedInvoices = recentInvoices.map(inv => ({
            no: inv.invoiceId,
            client: inv.client ? inv.client.name : 'Unknown',
            amount: (inv.durationMonths || 0) * (inv.pricePerMonth || 0),
            due: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '—',
            status: inv.status,
        }));

        // final response
        return res.json({
            kpis: [
                { title: 'Active Subscriptions', value: String(activeSubscriptions) },
                { title: 'Outstanding Invoices', value: String(outstandingInvoices) },
                { title: 'Paid This Month', value: `$${paidThisMonth.toFixed(2)}` },
                { title: 'MRR', value: `$${(mrr || 0).toFixed(2)}` },
            ],
            paymentHistory: {
                day: { categories: dayLabels.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })), series: [{ name: 'Payments', data: daySeries }] },
                week: { categories: weekLabels, series: [{ name: 'Payments', data: weekSeries }] },
                month: { categories: monthLabels, series: [{ name: 'Payments', data: monthSeries }] },
            },
            recentSubscriptions: formattedSubscriptions,
            recentInvoices: formattedInvoices,
        });

    } catch (err) {
        console.error('Error fetching dashboard data optimized:', err);
        res.status(500).json({ error: err.message });
    }
};


exports.removeInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        if (!invoiceId) return res.status(400).json({ error: 'invoiceId required' });

        const invoice = await Invoice.findOneAndDelete({ invoiceId });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        return res.json({ message: 'Invoice deleted' });
    } catch (err) {
        console.error('Error deleting invoice:', err);
        res.status(500).json({ error: err.message });
    }
};
