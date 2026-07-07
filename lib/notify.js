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

  const subject = `Job monitor — ${rows.length} new match${rows.length === 1 ? '' : 'es'}`;

  const lines = [];
  const byCompany = rows.reduce((acc, row) => {
    acc[row.company] = (acc[row.company] || 0) + 1;
    return acc;
  }, {});

  lines.push(`${subject}`);
  lines.push('');
  lines.push('Summary by company:');
  for (const [company, count] of Object.entries(byCompany).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${company}: ${count}`);
  }
  lines.push('');

  const maxPerCompany = Number(process.env.EMAIL_MAX_PER_COMPANY || 8);
  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.company]) acc[row.company] = [];
    acc[row.company].push(row);
    return acc;
  }, {});

  for (const company of Object.keys(grouped).sort()) {
    const companyRows = grouped[company];
    const shown = companyRows.slice(0, maxPerCompany);
    lines.push(`=== ${company} (${companyRows.length}) ===`);
    if (companyRows.length > shown.length) {
      lines.push(`Showing ${shown.length} of ${companyRows.length} matches`);
    }
    lines.push('');

    for (const row of shown) {
      const pay = row.pay ? `\nPay: ${row.pay}` : '';
      lines.push(
        [
          row.role,
          `Location: ${row.location || 'N/A'}`,
          `Link: ${row.link}`,
          `Score: ${row.match_score}`,
          pay,
        ]
          .filter(Boolean)
          .join('\n')
      );
      lines.push('');
    }
  }

  const text = `${lines.join('\n')}\n`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject,
    text,
  });

  return { sent: true, count: rows.length };
}
