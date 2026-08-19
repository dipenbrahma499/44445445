import nodemailer from "nodemailer";

export default async function handler(req, res) {
    // CORS / method
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
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

        // Validation
        if (!name || !email || !phone || !message) {
            return res.status(400).json({
                success: false,
                error: "Please fill in all required fields."
            });
        }

        // Basic email validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: "Invalid email address."
            });
        }

        // Indian phone validation
        const cleanPhone = String(phone)
            .replace(/\s+/g, "");

        const phoneRegex =
            /^(?:\+91|91)?[6-9]\d{9}$/;

        if (!phoneRegex.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                error: "Invalid Indian phone number."
            });
        }

        // Environment variables
        const {
            SMTP_HOST,
            SMTP_PORT,
            SMTP_USER,
            SMTP_PASS,
            CONTACT_TO
        } = process.env;

        if (
            !SMTP_HOST ||
            !SMTP_PORT ||
            !SMTP_USER ||
            !SMTP_PASS ||
            !CONTACT_TO
        ) {
            console.error(
                "Missing SMTP environment variables."
            );

            return res.status(500).json({
                success: false,
                error: "Server email configuration is incomplete."
            });
        }

        // SMTP transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: Number(SMTP_PORT) === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });

        // Verify SMTP
        await transporter.verify();

        // Email
        await transporter.sendMail({
            from: `"Website Contact Form" <${SMTP_USER}>`,
            to: CONTACT_TO,
            replyTo: email,
            subject:
                subject?.trim()
                    ? subject.trim()
                    : `New Contact Message from ${name}`,

            text: `
New contact form submission

Name: ${name}
Email: ${email}
Phone: ${phone}
Subject: ${subject || "No subject"}

Message:
${message}
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
    background:#f4f6f8;
    font-family:Arial,sans-serif;
">

<div style="
    max-width:600px;
    margin:auto;
    background:#ffffff;
    border-radius:12px;
    padding:30px;
    border:1px solid #e5e7eb;
">

<h2 style="margin-top:0;">
    New Contact Form Message
</h2>

<hr>

<p>
<strong>Name:</strong>
${escapeHtml(name)}
</p>

<p>
<strong>Email:</strong>
${escapeHtml(email)}
</p>

<p>
<strong>Phone:</strong>
${escapeHtml(phone)}
</p>

<p>
<strong>Subject:</strong>
${escapeHtml(subject || "No subject")}
</p>

<p>
<strong>Message:</strong>
</p>

<div style="
    background:#f8fafc;
    border-radius:8px;
    padding:15px;
    white-space:pre-wrap;
">
${escapeHtml(message)}
</div>

</div>

</body>
</html>
            `
        });

        return res.status(200).json({
            success: true,
            message: "Message sent successfully!"
        });

    } catch (error) {

        console.error(
            "SMTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Unable to send message. Please try again later."
        });
    }
}


// Prevent HTML injection in email
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}