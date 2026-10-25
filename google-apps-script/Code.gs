/**
 * ===================================================================
 * AXMIN PRANA AYURVEDA - HIGH-RELIABILITY OTP & MAILER WEB APP
 * File 1: Code.gs (Server-side JavaScript Logic)
 * ===================================================================
 */

// 1. Health check endpoint (Testable in browser)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'active',
      service: 'Axmin Prana Mailer Web App',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// 2. Main POST endpoint for sending OTP and transactional emails
function doPost(e) {
  try {
    // Parse incoming payload (JSON with fallback to form parameters)
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Extract recipient email (supports 'to', 'email', or 'recipient')
    var to = data.to || data.email || data.recipient;
    if (!to || typeof to !== 'string' || to.trim() === '') {
      return createJsonResponse({
        success: false,
        error: 'Missing recipient email address ("to" or "email")'
      });
    }
    to = to.trim();

    // Subject line
    var subject = data.subject || (data.otp ? 'Your Axmin Prana Verification Code: ' + data.otp : 'Axmin Prana Ayurveda Notification');

    // Extract OTP & plain text message
    var otp = data.otp || data.code || '';
    var textBody = data.text || data.body || data.message || (otp ? 'Your Axmin Prana login verification code is: ' + otp + '. Valid for 10 minutes.' : '');

    // Resolve HTML body (custom HTML or rendered from separate emailTemplate.html)
    var htmlBody = data.html || data.htmlBody;
    if (!htmlBody && otp) {
      htmlBody = renderOtpHtmlTemplate(otp, data.name);
    } else if (!htmlBody) {
      htmlBody = '<div style="font-family: sans-serif; padding: 20px; color: #202820;">' + textBody.replace(/\n/g, '<br>') + '</div>';
    }

    // Send email using GmailApp
    GmailApp.sendEmail(to, subject, textBody, {
      htmlBody: htmlBody,
      name: 'Axmin Prana Ayurveda',
      replyTo: 'axminprana@gmail.com'
    });

    Logger.log('Successfully dispatched email to: ' + to);

    return createJsonResponse({
      success: true,
      recipient: to,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    Logger.log('Error in doPost: ' + err.toString());
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * Helper to render separate 'emailTemplate.html' file with dynamic data
 */
function renderOtpHtmlTemplate(otp, name) {
  try {
    var template = HtmlService.createTemplateFromFile('emailTemplate');
    template.otp = otp;
    template.name = name || '';
    template.year = new Date().getFullYear();
    return template.evaluate().getContent();
  } catch (templateErr) {
    Logger.log('Fallback to inline HTML template: ' + templateErr.toString());
    // Fallback if emailTemplate.html file is missing
    return '<div style="font-family: sans-serif; padding: 24px; background: #FAF8F1; border-radius: 12px; text-align: center;">' +
      '<h2 style="color: #1F4E34;">Axmin Prana Verification Code</h2>' +
      '<p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1F4E34;">' + otp + '</p>' +
      '<p style="color: #666; font-size: 12px;">Valid for 10 minutes.</p>' +
      '</div>';
  }
}

/**
 * Standardized JSON response helper
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
