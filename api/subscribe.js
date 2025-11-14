const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Write to emails.txt in project root (this file is gitignored)
    const emailsPath = path.join(process.cwd(), 'emails.txt');
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} | ${email}\n`;
    
    fs.appendFileSync(emailsPath, entry, 'utf8');
    
    return res.status(200).json({ success: true, message: 'Email saved!' });
  } catch (error) {
    console.error('Email save error:', error);
    return res.status(500).json({ error: 'Failed to save email' });
  }
}
