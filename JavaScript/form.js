// Initialize EmailJS with your user ID
(function() {
    // Use the same EmailJS credentials as in the OTP form
    emailjs.init('NP2ZErhB-YRWGY114');
})();

// Get the email from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const userEmail = urlParams.get('email');

// Set the email field value
document.getElementById('email').value = userEmail || '';

// Form elements
const form = document.getElementById('userDetailsForm');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const submitSpinner = document.getElementById('submitSpinner');
const formSuccess = document.getElementById('formSuccess');

// Form validation and submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    let isValid = true;
    
    // Validate name
    const name = document.getElementById('name').value.trim();
    if (name === '') {
        document.getElementById('nameError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('nameError').style.display = 'none';
    }
    
    // Validate phone
    const phone = document.getElementById('phone').value.trim();
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone)) {
        document.getElementById('phoneError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('phoneError').style.display = 'none';
    }
    
    // Validate address
    const address = document.getElementById('address').value.trim();
    if (address === '') {
        document.getElementById('addressError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('addressError').style.display = 'none';
    }
    
    if (isValid) {
        // Show loading state
        submitText.textContent = 'Submitting...';
        submitSpinner.style.display = 'block';
        submitBtn.disabled = true;
        
        // Prepare the email content
        const templateParams = {
            to_email: 'prakharsaxena3416@gmail.com', // Change this to your receiving email
            from_name: 'Form Submission',
            user_name: name,
            user_email: userEmail,
            user_phone: phone,
            user_address: address,
            reply_to: userEmail
        };
        
        // Send the email using EmailJS
        emailjs.send('service_9r4j8p9', 'template_r5zopyo', templateParams)
            .then(function(response) {
                console.log('SUCCESS!', response.status, response.text);
                
                // Show success message
                formSuccess.style.display = 'block';
                submitText.textContent = 'Submitted';
                submitSpinner.style.display = 'none';
                
                // Reset form (except email)
                document.getElementById('name').value = '';
                document.getElementById('phone').value = '';
                document.getElementById('address').value = '';
                
                // Disable submit button
                submitBtn.disabled = true;
                submitBtn.style.backgroundColor = 'var(--success)';
            })
            .catch(function(error) {
                console.log('FAILED...', error);
                alert('Failed to submit form. Please try again later.');
                
                // Reset button state
                submitText.textContent = 'Submit';
                submitSpinner.style.display = 'none';
                submitBtn.disabled = false;
            });
    }
});