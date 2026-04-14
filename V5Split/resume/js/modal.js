/* ═════════════════════════════════════════════════════════════════════
   EMAIL REQUEST MODAL — Portfolio/Blog Access
   ═════════════════════════════════════════════════════════════════════ */
var emailModal = document.getElementById('email-modal');
var emailInput = document.getElementById('email-input');
var emailSubmit = document.getElementById('email-submit');
var emailStatusDiv = document.getElementById('email-status');

// Find Portfolio and Blog elements to intercept clicks
var portfolioLabel = document.querySelector('.cor.c-br');  // PORTFOLIO corner label
var blogLink = document.querySelector('a[href="/blog"]');   // BLOG side label

function openEmailModal() {
  haptics.light();
  emailModal.classList.add('visible');
  emailInput.focus();
}

function closeEmailModal() {
  emailModal.classList.remove('visible');
  emailInput.value = '';
  emailStatusDiv.className = 'email-modal-status';
  emailStatusDiv.textContent = '';
}

function showStatus(message, type) {
  emailStatusDiv.textContent = message;
  emailStatusDiv.className = 'email-modal-status ' + type;
}

// Portfolio click - prevent default navigation and show modal
if (portfolioLabel) {
  portfolioLabel.addEventListener('click', function(e) {
    e.preventDefault();
    openEmailModal();
  });
}

// Blog click - prevent default navigation and show modal
if (blogLink) {
  blogLink.addEventListener('click', function(e) {
    e.preventDefault();
    openEmailModal();
  });
}

// Email submit handler
if (emailSubmit) {
  emailSubmit.addEventListener('click', function() {
    var email = emailInput.value.trim();

    // Validate email
    if (!email || !email.includes('@')) {
      showStatus('Please enter a valid email', 'error');
      haptics.error();
      return;
    }

    // Disable submit button during request
    emailSubmit.disabled = true;
    emailSubmit.style.opacity = '0.6';
    showStatus('Sending...', '');

    // Send request to backend
    fetch('/api/request-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    })
    .then(function(response) {
      if (!response.ok) throw new Error('Network error');
      return response.json();
    })
    .then(function(data) {
      if (data.success) {
        haptics.success();  // Double-pulse confirm
        showStatus('✓ Request sent! Check your email', 'success');
        emailInput.value = '';

        // Close modal after 2.5 seconds
        setTimeout(function() {
          closeEmailModal();
          emailSubmit.disabled = false;
          emailSubmit.style.opacity = '1';
        }, 2500);
      } else {
        throw new Error(data.message || 'Request failed');
      }
    })
    .catch(function(error) {
      haptics.error();  // Triple-rattle error feedback
      showStatus('Error: ' + (error.message || 'Failed to send request'), 'error');
      emailSubmit.disabled = false;
      emailSubmit.style.opacity = '1';
    });
  });
}

// Close modal on X button
var closeBtn = document.querySelector('.email-modal-close');
if (closeBtn) {
  closeBtn.addEventListener('click', closeEmailModal);
}

// Close modal on backdrop click
var backdrop = document.querySelector('.email-modal-backdrop');
if (backdrop) {
  backdrop.addEventListener('click', closeEmailModal);
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && emailModal.classList.contains('visible')) {
    closeEmailModal();
  }
});

// Allow Enter key to submit email
if (emailInput) {
  emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      emailSubmit.click();
    }
  });
}

// Resume download haptic
var resumeDownloadLink = document.getElementById('resume-download-link');
if (resumeDownloadLink) {
  resumeDownloadLink.addEventListener('click', function() {
    haptics.medium();
  });
}
