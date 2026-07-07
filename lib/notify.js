import nodemailer from 'nodemailer';

export function emailConfigured() {
  return Boolean(
    process.env.MAIL_TO && process.env.MAIL_FROM && process.env.GMAIL_APP_PASSWORD
  );
}

export async function sendNewJobsEmail(rows) {
  if (!emailConfigured()) {
    return { sent: false, reason: 'email not configured' };
  }

  if (!rows.length) {
    return { sent: false, reason: 'no new jobs' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_FROM,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const lines = rows.map((row) => {
    const pay = row.pay ? `\nPay: ${row.pay}` : '';
    return [
      `${row.company} — ${row.role}`,
      `Location: ${row.location || 'N/A'}`,
      `Link: ${row.link}`,
      `Score: ${row.match_score} (${row.match_reason})`,
      pay,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const subject = `Job monitor — ${rows.length} new match${rows.length === 1 ? '' : 'es'}`;
  const text = `${subject}\n\n${lines.join('\n\n---\n\n')}\n`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject,
    text,
  });

  return { sent: true, count: rows.length };
}
