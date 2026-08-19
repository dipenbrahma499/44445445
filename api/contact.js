// api/contact.js

const nodemailer = require("nodemailer");

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

module.exports = async function handler(req, res) {

    // Only POST
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            name,
            email,
            phone,
            subject,
            message
        } = req.body || {};

        // Required fields
        if (!name || !email || !phone || !message) {
            return res.status(400).json({
                error: "Name, email, phone and message are required."
            });
        }

        // Basic length protection
        if (name.length > 100) {
            return res.status(400).json({
                error: "Name is too long."
            });
        }

        if (email.length > 254) {
            return res.status(400).json({
                error: "Email address is too long."
            });
        }

        if (phone.length > 25) {
            return res.status(400).json({
                error: "Phone number is invalid."
            });
        }

        if (message.length > 5000) {
            return res.status(400).json({
                error: "Message is too long."
            });
        }

        // Email validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Invalid email address."
            });
        }

        // Environment variables
        const {
            SMTP_HOST,
            SMTP_PORT,
            SMTP_USER,
            SMTP_PASS,
            SMTP_FROM,
            SMTP_TO
        } = process.env;

        if (
            !SMTP_HOST ||
            !SMTP_PORT ||
            !SMTP_USER ||
            !SMTP_PASS ||
            !SMTP_TO
        ) {
            console.error(
                "Missing SMTP environment variables."
            );

            return res.status(500).json({
                error: "Server SMTP configuration is incomplete."
            });
        }

        // Gmail SMTP transporter
        const transporter = nodemailer.createTransport({

            host: SMTP_HOST,

            port: Number(SMTP_PORT),

            secure: Number(SMTP_PORT) === 465,

            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });

        // Escape user input before putting into HTML
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone);
        const safeSubject = escapeHtml(
            subject || "No subject"
        );

        const safeMessage = escapeHtml(message)
            .replace(/\r?\n/g, "<br>");

        // Email
        const mailOptions = {

            from:
                SMTP_FROM ||
                SMTP_USER,

            to:
                SMTP_TO,

            replyTo:
                email,

            subject:
                `📬 Contact from ${name}`,

            text: `
New contact message

Name: ${name}
Email: ${email}
Phone: ${phone}
Subject: ${subject || "No subject"}

Message:
${message}

Sent from:
dipen.vercel.app
            `.trim(),

            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Contact Message</title>
</head>

<body style="
    margin:0;
    padding:30px;
    background:#0e1117;
    font-family:Arial,Helvetica,sans-serif;
">

<div style="
    max-width:600px;
    margin:auto;
    background:#18202c;
    border-radius:20px;
    padding:30px;
    color:#e2e8f0;
    border:1px solid #334155;
">

    <h2 style="
        margin-top:0;
        color:#ffffff;
    ">
        📨 New Contact Message
    </h2>

    <div style="
        background:#0d121a;
        border-radius:14px;
        padding:20px;
        margin-top:20px;
    ">

        <p>
            <strong>Name:</strong><br>
            ${safeName}
        </p>

        <p>
            <strong>Email:</strong><br>
            <a
                href="mailto:${safeEmail}"
                style="color:#60a5fa;"
            >
                ${safeEmail}
            </a>
        </p>

        <p>
            <strong>Phone:</strong><br>
            ${safePhone}
        </p>

        <p>
            <strong>Subject:</strong><br>
            ${safeSubject}
        </p>

        <p>
            <strong>Message:</strong>
        </p>

        <div style="
            background:#111827;
            border-left:4px solid #3b82f6;
            padding:15px;
            border-radius:10px;
            line-height:1.6;
        ">
            ${safeMessage}
        </div>

    </div>

    <p style="
        text-align:center;
        color:#64748b;
        font-size:12px;
        margin-top:25px;
    ">
        Sent via dipen.vercel.app contact form
    </p>

</div>

</body>
</html>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message:
                "Your message was sent successfully! We'll get back to you soon."
        });

    } catch (error) {

        console.error(
            "SMTP error:",
            error
        );

        return res.status(500).json({
            error:
                "Failed to send message. Please try again later."
        });
    }
};