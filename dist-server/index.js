import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
// Basic configuration
const PORT = Number(process.env.OTP_SERVER_PORT) || 4000;
const app = express();
app.use(cors());
app.use(express.json());
const otpStore = {};
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
// Email transporter (lazy init)
let transporter = null;
async function getTransporter() {
    if (transporter)
        return transporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_PORT) {
        console.warn('[OTP] No SMTP configuration present - OTP codes will be logged to server console');
        return null;
    }
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    return transporter;
}
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function hashOtp(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
}
function cleanupExpired() {
    const now = Date.now();
    for (const key of Object.keys(otpStore)) {
        if (otpStore[key].expiresAt < now)
            delete otpStore[key];
    }
}
setInterval(cleanupExpired, 60 * 1000).unref();
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
app.post('/auth/request-otp', async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email required' });
        }
        const otp = generateOtp();
        const hash = hashOtp(otp);
        otpStore[email.toLowerCase()] = { hash, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 };
        // Attempt to send email
        try {
            const tx = await getTransporter();
            if (tx) {
                await tx.sendMail({
                    from: process.env.OTP_EMAIL_FROM || 'no-reply@timebank.local',
                    to: email,
                    subject: 'Your TimeBank OTP Code',
                    text: `Your OTP code is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`,
                });
                console.log(`[OTP] Sent OTP to ${email}`);
            }
            else {
                console.log(`[OTP] Generated for ${email}: ${otp}`);
            }
        }
        catch (mailErr) {
            console.warn('[OTP] Failed to send email, logging instead');
            console.log(`[OTP] Generated for ${email}: ${otp}`);
        }
        res.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });
    }
    catch (err) {
        console.error('request-otp error', err);
        res.status(500).json({ error: 'Server error' });
    }
});
app.post('/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body || {};
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'email, otp, newPassword required' });
        }
        const entry = otpStore[email.toLowerCase()];
        if (!entry)
            return res.status(400).json({ error: 'OTP not requested or expired' });
        if (entry.expiresAt < Date.now()) {
            delete otpStore[email.toLowerCase()];
            return res.status(400).json({ error: 'OTP expired' });
        }
        if (entry.attempts >= MAX_ATTEMPTS) {
            delete otpStore[email.toLowerCase()];
            return res.status(400).json({ error: 'Too many attempts' });
        }
        entry.attempts++;
        const providedHash = hashOtp(otp);
        if (providedHash !== entry.hash) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        // OTP valid - consume it
        delete otpStore[email.toLowerCase()];
        // Update password depending on environment.
        // For now we'll just respond success; the frontend will call a separate endpoint / adapt to update via Firebase or mock store.
        // (Could integrate Firebase Admin SDK here if desired.)
        res.json({ ok: true });
    }
    catch (err) {
        console.error('verify-otp error', err);
        res.status(500).json({ error: 'Server error' });
    }
});
app.listen(PORT, () => {
    console.log(`[OTP Server] Listening on port ${PORT}`);
});
