const mongoose = require("mongoose");


const clientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        address: {
            type: String,
            default: "",
        },
        company: {
            type: String,
            default: "",
        },
        notes: {
            type: String,
            default: "",
        },
        tags: [{
            type: String,
            trim: true,
        }],
        image: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);


module.exports = mongoose.model("Client", clientSchema);