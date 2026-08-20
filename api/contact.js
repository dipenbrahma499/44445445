const nodemailer = require("nodemailer");

// Simple HTML escaping function
function escapeHtml(text) {
    if (!text) return "";
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateInput(data) {
    const errors = [];

    const name = data.name?.trim() || "";
    const email = data.email?.trim() || "";
    const phone = data.phone?.trim() || "";
    const subject = data.subject?.trim() || "";
    const message = data.message?.trim() || "";

    if (!name || name.length < 1) {
        errors.push("Name is required.");
    } else if (name.length > 100) {
        errors.push("Name must be 100 characters or less.");
    }

    if (!email || email.length < 1) {
        errors.push("Email is required.");
    } else if (email.length > 100) {
        errors.push("Email must be 100 characters or less.");
    } else if (!isValidEmail(email)) {
        errors.push("Valid email is required.");
    }

    if (!phone || phone.length < 1) {
        errors.push("Phone number is required.");
    } else if (phone.length > 20) {
        errors.push("Phone must be 20 characters or less.");
    }

    if (subject && subject.length > 200) {
        errors.push("Subject must be 200 characters or less.");
    }

    if (!message || message.length < 1) {
        errors.push("Message is required.");
    } else if (message.length > 2000) {
        errors.push("Message must be 2000 characters or less.");
    }

    return {
        valid: errors.length === 0,
        errors,
        sanitized: {
            name,
            email,
            phone,
            subject,
            message,
        },
    };
}

module.exports = async function (req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed.",
        });
    }

    // Parse JSON
    let data;
    try {
        data = req.body;
        if (!data || typeof data !== "object") {
            throw new Error("Invalid request body");
        }
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "Invalid request format.",
        });
    }

    // Validate input
    const validation = validateInput(data);
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: validation.errors[0] || "Invalid input.",
        });
    }

    const { name, email, phone, subject, message } = validation.sanitized;

    // Check required environment variables
    const requiredEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "CONTACT_TO"];
    const missingEnv = requiredEnv.filter((key) => !process.env[key]);

    if (missingEnv.length > 0) {
        console.error("Missing environment variables:", missingEnv);
        return res.status(500).json({
            success: false,
            message: "Server configuration error.",
        });
    }

    // Configure Nodemailer
    let transporter;
    try {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            // Gmail requires this
            tls: process.env.SMTP_HOST.includes("gmail")
                ? { rejectUnauthorized: false }
                : undefined,
        });

        // Verify connection
        await transporter.verify();
    } catch (err) {
        console.error("SMTP configuration error:", err.message);
        return res.status(500).json({
            success: false,
            message: "Unable to send your message.",
        });
    }

    const subjectLine = subject ? `Contact Form: ${subject}` : "New Contact Form Submission";
    const timestamp = new Date().toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "long",
    });

    // Plain text email
    const textBody = `
New Contact Form Submission
${"=".repeat(30)}

Name: ${name}
Email: ${email}
Phone: ${phone}
Subject: ${subject || "Not provided"}
Message:
${message}

Submitted: ${timestamp}
    `.trim();

    // HTML email (with escaped user content)
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Contact Form Submission</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        .header {
            border-bottom: 3px solid #6c63ff;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        .header h2 {
            color: #2d2d2d;
            margin: 0;
            font-size: 22px;
        }
        .field {
            margin-bottom: 18px;
        }
        .field-label {
            font-weight: 600;
            color: #4a4a4a;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .field-value {
            background: #f8f9fa;
            padding: 10px 14px;
            border-radius: 6px;
            border-left: 4px solid #6c63ff;
            word-wrap: break-word;
        }
        .field-value.message {
            white-space: pre-wrap;
            font-family: inherit;
            line-height: 1.7;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            font-size: 13px;
            color: #6c757d;
            text-align: center;
        }
        .badge {
            display: inline-block;
            background: #6c63ff;
            color: #fff;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📬 New Contact Form Submission</h2>
        </div>

        <div class="field">
            <div class="field-label">Name</div>
            <div class="field-value">${escapeHtml(name)}</div>
        </div>

        <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
        </div>

        <div class="field">
            <div class="field-label">Phone</div>
            <div class="field-value">${escapeHtml(phone)}</div>
        </div>

        <div class="field">
            <div class="field-label">Subject</div>
            <div class="field-value">${escapeHtml(subject) || "<em>Not provided</em>"}</div>
        </div>

        <div class="field">
            <div class="field-label">Message</div>
            <div class="field-value message">${escapeHtml(message)}</div>
        </div>

        <div class="field">
            <div class="field-label">Submitted</div>
            <div class="field-value">${escapeHtml(timestamp)}</div>
        </div>

        <div class="footer">
            <span class="badge">Website Contact Form</span>
            <p style="margin-top: 12px; font-size: 12px; color: #868e96;">
                This message was sent from your website contact form.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    try {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.CONTACT_TO,
            replyTo: email,
            subject: subjectLine,
            text: textBody,
            html: htmlBody,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "Message sent successfully.",
        });
    } catch (err) {
        console.error("SMTP send error:", err.message);
        // Don't expose error details to client
        return res.status(500).json({
            success: false,
            message: "Unable to send your message.",
        });
    }
};