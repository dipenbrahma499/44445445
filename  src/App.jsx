import { useState } from "react";

export default function App() {

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
    });

    const [status, setStatus] = useState({
        type: "",
        message: "",
        icon: ""
    });

    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        const {
            name,
            value
        } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));

        setStatus({
            type: "",
            message: "",
            icon: ""
        });
    }

    async function handleSubmit(e) {

        e.preventDefault();

        const name = form.name.trim();
        const email = form.email.trim();
        const phone = form.phone.trim();
        const subject = form.subject.trim();
        const message = form.message.trim();

        if (!name || !email || !phone || !message) {

            setStatus({
                type: "error",
                message: "Please fill in all required fields.",
                icon: "⚠️"
            });

            return;
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {

            setStatus({
                type: "error",
                message: "Please enter a valid email address.",
                icon: "⚠️"
            });

            return;
        }

        const cleanPhone =
            phone.replace(/\s+/g, "");

        const phoneRegex =
            /^(?:\+91|91)?[6-9]\d{9}$/;

        if (!phoneRegex.test(cleanPhone)) {

            setStatus({
                type: "error",
                message:
                    "Please enter a valid Indian phone number.",
                icon: "⚠️"
            });

            return;
        }

        setLoading(true);

        setStatus({
            type: "",
            message: "Sending your message...",
            icon: "⏳"
        });

        try {

            const response = await fetch(
                "/api/contact",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        subject,
                        message
                    })
                }
            );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            if (!contentType.includes(
                "application/json"
            )) {

                const text =
                    await response.text();

                console.error(
                    "Non-JSON API response:",
                    text
                );

                throw new Error(
                    `API returned non-JSON response (${response.status}).`
                );
            }

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to send message."
                );
            }

            setStatus({
                type: "success",
                message:
                    data.message ||
                    "Message sent successfully!",
                icon: "🎉"
            });

            setForm({
                name: "",
                email: "",
                phone: "",
                subject: "",
                message: ""
            });

        } catch (error) {

            console.error(
                "Contact form error:",
                error
            );

            setStatus({
                type: "error",
                message:
                    error.message ||
                    "Something went wrong.",
                icon: "❌"
            });

        } finally {

            setLoading(false);
        }
    }

    return (
        <>
            <div className="modern-bg">

                <div className="grid-pattern" />

                <div className="ambient-glow glow-left" />

                <div className="ambient-glow glow-right" />

            </div>

            <div className="card">

                <h1>
                    ✉️ Contact
                </h1>

                <p className="subhead">
                    Send us a message
                    <span>
                        SECURE
                    </span>
                </p>

                <form
                    onSubmit={handleSubmit}
                    noValidate
                >

                    <div className="form-group">

                        <label htmlFor="name">
                            <b>Your Name</b> *
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="e.g. Dipen Patel"
                            value={form.name}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="email">
                            <b>Email</b> *
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="hello@example.com"
                            value={form.email}
                            onChange={handleChange}
                            maxLength={150}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="phone">
                            <b>Phone Number</b> *
                        </label>

                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+91 80999 *****"
                            value={form.phone}
                            onChange={handleChange}
                            maxLength={15}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="subject">
                            <b>Subject</b>
                        </label>

                        <input
                            id="subject"
                            name="subject"
                            type="text"
                            placeholder="Subject"
                            value={form.subject}
                            onChange={handleChange}
                            maxLength={150}
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="message">
                            <b>Message</b> *
                        </label>

                        <textarea
                            id="message"
                            name="message"
                            placeholder="Tell us what you're thinking..."
                            value={form.message}
                            onChange={handleChange}
                            maxLength={5000}
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        className="btn"
                        disabled={loading}
                    >

                        {loading ? (
                            <>
                                <span className="loader" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <span>📨</span>
                                Send message
                            </>
                        )}

                    </button>

                </form>


                {status.message && (

                    <div
                        className={`status-msg ${status.type}`}
                    >

                        <span>
                            {status.icon}
                        </span>

                        <span>
                            {status.message}
                        </span>

                    </div>

                )}


                <div className="footer-note">

                    <strong>
                        ⚡ .env + SMTP
                    </strong>

                    {" · "}

                    serverless via Vercel

                    {" · "}

                    <span className="badge">
                        deploy ready
                    </span>

                    <br />

                    dipen.vercel.app

                </div>

            </div>
        </>
    );
}