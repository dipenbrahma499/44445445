(function () {
    "use strict";

    const form = document.getElementById("contactForm");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const subjectInput = document.getElementById("subject");
    const messageInput = document.getElementById("message");
    const submitBtn = document.getElementById("submitBtn");
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");
    const formStatus = document.getElementById("formStatus");
    const charCounter = document.getElementById("charCounter");

    const MAX_NAME = 100;
    const MAX_EMAIL = 100;
    const MAX_PHONE = 20;
    const MAX_SUBJECT = 200;
    const MAX_MESSAGE = 2000;

    // Get error display elements
    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const phoneError = document.getElementById("phoneError");
    const subjectError = document.getElementById("subjectError");
    const messageError = document.getElementById("messageError");

    // Character counter
    if (messageInput && charCounter) {
        messageInput.addEventListener("input", function () {
            const len = this.value.length;
            charCounter.textContent = `${len} / ${MAX_MESSAGE}`;
            charCounter.classList.remove("limit-near", "limit-reached");
            if (len > MAX_MESSAGE * 0.85) {
                charCounter.classList.add("limit-near");
            }
            if (len >= MAX_MESSAGE) {
                charCounter.classList.add("limit-reached");
            }
        });
    }

    // Real-time validation feedback on blur
    nameInput.addEventListener("blur", () => validateField(nameInput, nameError, validateName));
    emailInput.addEventListener("blur", () => validateField(emailInput, emailError, validateEmail));
    phoneInput.addEventListener("blur", () => validateField(phoneInput, phoneError, validatePhone));
    subjectInput.addEventListener("blur", () => validateField(subjectInput, subjectError, validateSubject));
    messageInput.addEventListener("blur", () => validateField(messageInput, messageError, validateMessage));

    function validateField(input, errorEl, validator) {
        const result = validator(input.value);
        if (!result.valid) {
            input.classList.add("input-error");
            errorEl.textContent = result.message;
            return false;
        } else {
            input.classList.remove("input-error");
            errorEl.textContent = "";
            return true;
        }
    }

    function validateName(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return { valid: false, message: "Full name is required." };
        }
        if (trimmed.length > MAX_NAME) {
            return { valid: false, message: `Name must be ${MAX_NAME} characters or less.` };
        }
        return { valid: true, message: "" };
    }

    function validateEmail(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return { valid: false, message: "Email address is required." };
        }
        if (trimmed.length > MAX_EMAIL) {
            return { valid: false, message: `Email must be ${MAX_EMAIL} characters or less.` };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            return { valid: false, message: "Please enter a valid email address." };
        }
        return { valid: true, message: "" };
    }

    function validatePhone(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return { valid: false, message: "Phone number is required." };
        }
        if (trimmed.length > MAX_PHONE) {
            return { valid: false, message: `Phone must be ${MAX_PHONE} characters or less.` };
        }
        // Basic phone validation - at least digits
        const digits = trimmed.replace(/[\s\-()+.ext]/gi, "");
        if (digits.length < 7) {
            return { valid: false, message: "Please enter a valid phone number." };
        }
        return { valid: true, message: "" };
    }

    function validateSubject(value) {
        const trimmed = value.trim();
        if (trimmed.length > MAX_SUBJECT) {
            return { valid: false, message: `Subject must be ${MAX_SUBJECT} characters or less.` };
        }
        return { valid: true, message: "" };
    }

    function validateMessage(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return { valid: false, message: "Message is required." };
        }
        if (trimmed.length > MAX_MESSAGE) {
            return { valid: false, message: `Message must be ${MAX_MESSAGE} characters or less.` };
        }
        return { valid: true, message: "" };
    }

    function validateAll() {
        const nameValid = validateField(nameInput, nameError, validateName);
        const emailValid = validateField(emailInput, emailError, validateEmail);
        const phoneValid = validateField(phoneInput, phoneError, validatePhone);
        const subjectValid = validateField(subjectInput, subjectError, validateSubject);
        const messageValid = validateField(messageInput, messageError, validateMessage);
        return nameValid && emailValid && phoneValid && subjectValid && messageValid;
    }

    function setStatus(message, type) {
        formStatus.textContent = message;
        formStatus.className = "status-message";
        if (type) {
            formStatus.classList.add(type);
        } else {
            formStatus.classList.add("hidden");
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.textContent = "Sending...";
            btnLoader.classList.remove("hidden");
        } else {
            submitBtn.disabled = false;
            btnText.textContent = "Send Message";
            btnLoader.classList.add("hidden");
        }
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Clear previous status
        setStatus("", null);

        // Validate all fields
        if (!validateAll()) {
            setStatus("Please fix the errors before submitting.", "error");
            // Focus first invalid field
            const firstError = form.querySelector(".input-error");
            if (firstError) {
                firstError.focus();
            }
            return;
        }

        // Prepare data
        const formData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: messageInput.value.trim(),
        };

        setLoading(true);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setStatus("✅ Your message has been sent successfully!", "success");
                form.reset();
                // Reset character counter
                if (charCounter) {
                    charCounter.textContent = `0 / ${MAX_MESSAGE}`;
                    charCounter.classList.remove("limit-near", "limit-reached");
                }
                // Clear any error states
                form.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
                form.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
            } else {
                setStatus(data.message || "Something went wrong. Please try again.", "error");
            }
        } catch (error) {
            console.error("Submission error:", error);
            setStatus("Unable to send your message. Please try again later.", "error");
        } finally {
            setLoading(false);
        }
    });

    // Prevent form submission on enter in text fields
    form.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
            e.preventDefault();
        }
    });
})();