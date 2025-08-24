const mongoose = require("mongoose");


const subscriptionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        duration: {
            type: String,
            enum: ["weekly", "monthly", "yearly"],
            required: true,
            default: "monthly",
        },
        description: { type: String, default: "" },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        clients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client', trim: true }],
        createdBy: { type: String, default: 'System' },
    },
    { timestamps: true }
);


module.exports = mongoose.model("Subscription", subscriptionSchema);