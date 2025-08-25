const User = require("../models/adminModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ msg: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.json({ msg: "Login successful", token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Forgot Password → Send OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "User not found" });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetCode = code;
        user.resetCodeExpiry = Date.now() + 15 * 60 * 1000;
        await user.save();

        await transporter.sendMail({
            from: `"MyCompany Inc." <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Password Reset Code",
            text: `Your password reset code is: ${code}`,
            html: `<p>Your password reset code is: <strong>${code}</strong></p>`,
        });

        res.json({ msg: "Reset code sent to email" });
    } catch (err) {
        console.error("Error in forgotPassword:", err);
        res.status(500).json({ error: err.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.resetCode !== code || user.resetCodeExpiry < Date.now()) {
            return res.status(400).json({ msg: "Invalid or expired code" });
        }

        user.password = newPassword; // bcrypt hashing handled by pre-save hook
        user.resetCode = null;
        user.resetCodeExpiry = null;
        await user.save();

        res.json({ msg: "Password reset successful" });
    } catch (err) {
        console.error("Error in resetPassword:", err);
        res.status(500).json({ error: err.message });
    }
};