const nodemailer = require('nodemailer');

let transporter = null;

const canSendEmails = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );

const getTransporter = () => {
  if (!canSendEmails()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure:
      process.env.SMTP_SECURE === 'true' ||
      Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const formatParticipationType = (type) => {
  if (type === 'ATTENDEE') return 'Attendee';
  if (type === 'VOLUNTEER') return 'Volunteer';
  if (type === 'DONOR') return 'Donor';
  return type || 'Participant';
};

const sendEventRegistrationEmail = async ({
  to,
  userName,
  eventName,
  eventDate,
  eventLocation,
  participationType,
  paymentConfirmed = false,
  paymentReference,
  statusNote,
}) => {
  try {
    if (!to) return false;
    const mailer = getTransporter();
    if (!mailer) return false;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const dateText = eventDate ? new Date(eventDate).toLocaleString() : 'TBD';
    const paymentText = paymentConfirmed
      ? `Confirmed${paymentReference ? ` (${paymentReference})` : ''}`
      : 'Not required';

    const text = [
      `Hello ${userName || 'Participant'},`,
      '',
      'Your event registration has been recorded successfully.',
      '',
      `Event: ${eventName || 'N/A'}`,
      `Date & Time: ${dateText}`,
      `Location: ${eventLocation || 'TBD'}`,
      `Participation Type: ${formatParticipationType(participationType)}`,
      `Payment: ${paymentText}`,
      statusNote ? `Status: ${statusNote}` : null,
      '',
      'Thank you for supporting community education.',
      'Manobal Nepal',
    ]
      .filter(Boolean)
      .join('\n');

    await mailer.sendMail({
      from,
      to,
      subject: `Event Registration Confirmation - ${eventName || 'Manobal Event'}`,
      text,
    });
    return true;
  } catch (error) {
    console.error('Failed to send registration email:', error.message);
    return false;
  }
};

module.exports = {
  sendEventRegistrationEmail,
};

