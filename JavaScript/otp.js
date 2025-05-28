// Store OTP in memory (in a real application, this would be handled server-side)
let currentOTP = null;
let otpExpiryTime = null;
let otpAttempts = 0;
const MAX_OTP_ATTEMPTS = 3;
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
let currentVerificationType = 'email';

// Mock SMS Service (for demonstration purposes)
class MockSMSService {
    static async sendOTP(phoneNumber, otp) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real application, this would be an API call to an SMS service
        console.log(`Sending OTP ${otp} to ${phoneNumber}`);
        
        // For demo purposes, we'll show the OTP in a modal
        this.showOTPModal(otp);
        
        return true;
    }

    static showOTPModal(otp) {
        const modal = document.createElement('div');
        modal.className = 'otp-modal';
        modal.innerHTML = `
            <div class="otp-modal-content">
                <h3>Demo OTP</h3>
                <p>In a real application, this OTP would be sent via SMS to your phone.</p>
                <div class="otp-display">${otp}</div>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Function to generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to validate email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to validate phone number
function validatePhone() {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('invalidPhone');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    
    // Indian phone number validation (10 digits starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (!phoneRegex.test(phoneInput.value)) {
        phoneError.style.display = 'block';
        sendOtpBtn.disabled = true;
        return false;
    } else {
        phoneError.style.display = 'none';
        sendOtpBtn.disabled = false;
        return true;
    }
}

// Function to format phone number as user types
function formatPhoneNumber(input) {
    // Remove any non-digit characters
    let value = input.value.replace(/\D/g, '');
    
    // Limit to 10 digits
    value = value.substring(0, 10);
    
    // Update input value
    input.value = value;
    
    // Validate phone number
    validatePhone();
}

// Function to show success message
function showSuccessMessage(message) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = message;
    
    const form = document.getElementById('form');
    form.insertBefore(successMessage, form.firstChild);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
}

// Function to show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.phone-section').appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Function to update OTP input UI
function updateOTPInputUI() {
    const otpInput = document.getElementById('otp');
    const otpSection = document.getElementById('otpSection');
    const verifyBtn = document.getElementById('verifyOtpBtn');
    
    // Clear previous OTP input
    otpInput.value = '';
    
    // Show OTP section with animation
    otpSection.style.display = 'block';
    otpSection.classList.add('show');
    
    // Focus on OTP input
    setTimeout(() => otpInput.focus(), 500);
}

// Function to send OTP
async function sendOTP() {
    const phoneInput = document.getElementById('phone');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const phoneError = document.getElementById('invalidPhone');
    
    try {
        // Validate phone number
        if (!validatePhone()) {
            return;
        }
        
        // Disable send button and show loading state
        sendOtpBtn.disabled = true;
        sendOtpBtn.classList.add('loading');
        
        // Send OTP request to server
        const response = await fetch('http://localhost:3000/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: phoneInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send OTP');
        }

        // Show OTP input section
        updateOTPInputUI();
        
        // Show success message
        showSuccessMessage('OTP sent successfully!');
        
        // Start cooldown timer
        startResendCooldown();
        
    } catch (error) {
        phoneError.textContent = error.message;
        phoneError.style.display = 'block';
    } finally {
        // Re-enable send button and remove loading state
        sendOtpBtn.disabled = false;
        sendOtpBtn.classList.remove('loading');
    }
}

// Function to verify OTP
async function verifyOTP() {
    const otpInput = document.getElementById('otp');
    const otpError = document.getElementById('invalidOtp');
    const phoneInput = document.getElementById('phone');
    const verifyBtn = document.getElementById('verifyOtpBtn');
    
    try {
        // Validate OTP format
        if (!/^\d{6}$/.test(otpInput.value)) {
            throw new Error('Please enter a valid 6-digit OTP');
        }
        
        // Disable verify button and show loading state
        verifyBtn.disabled = true;
        verifyBtn.classList.add('loading');
        
        const response = await fetch('http://localhost:3000/api/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: phoneInput.value,
                otp: otpInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
        }

        // OTP is valid
        otpError.style.display = 'none';
        showSuccessMessage('Phone number verified successfully!');
        
        // Enable sign in button
        document.getElementById('btn-login').disabled = false;
        
        // Store verified phone number
        localStorage.setItem('phoneNumber', phoneInput.value);
        
        return true;
    } catch (error) {
        otpError.textContent = error.message;
        otpError.style.display = 'block';
        otpInput.value = '';
        otpInput.focus();
        return false;
    } finally {
        // Re-enable verify button and remove loading state
        verifyBtn.disabled = false;
        verifyBtn.classList.remove('loading');
    }
}

// Function to start resend cooldown
function startResendCooldown() {
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    let timeLeft = RESEND_COOLDOWN_SECONDS;
    
    sendOtpBtn.disabled = true;
    
    const timer = setInterval(() => {
        timeLeft--;
        sendOtpBtn.textContent = `Resend OTP (${timeLeft}s)`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            sendOtpBtn.textContent = 'Send OTP';
            sendOtpBtn.disabled = false;
        }
    }, 1000);
}

// Add event listeners when the document loads
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone');
    const otpInput = document.getElementById('otp');
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const signInBtn = document.getElementById('btn-login');
    
    // Initially disable sign in button
    signInBtn.disabled = true;
    
    // Handle verification type toggle
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.dataset.type;
            currentVerificationType = type;
            
            // Update active button
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide appropriate section
            document.getElementById('emailSection').style.display = type === 'email' ? 'block' : 'none';
            document.getElementById('phoneSection').style.display = type === 'phone' ? 'block' : 'none';
            
            // Hide OTP section when switching
            document.getElementById('otpSection').style.display = 'none';
        });
    });
    
    // Format phone number as user types
    phoneInput.addEventListener('input', function(e) {
        formatPhoneNumber(this);
    });
    
    // Only allow numbers in OTP input
    otpInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length === 6) {
            verifyOTP();
        }
    });
    
    // Handle Enter key in OTP input
    otpInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.length === 6) {
            verifyOTP();
        }
    });
    
    // Add loading state to buttons
    sendOtpBtn.addEventListener('click', function() {
        this.classList.add('loading');
        setTimeout(() => this.classList.remove('loading'), 1000);
    });
}); 