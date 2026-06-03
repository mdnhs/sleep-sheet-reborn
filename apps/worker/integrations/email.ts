const luxstoreEmailTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: 700; color: #000; letter-spacing: 2px; }
        .content { color: #333; line-height: 1.6; }
        .otp-box { 
            background: #f8f9fa; 
            padding: 25px; 
            margin: 30px 0; 
            text-align: center;
            border: 1px solid #000;
            border-radius: 4px;
            font-size: 24px;
            letter-spacing: 3px;
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #000;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .social-links a { 
            color: #000 !important; 
            text-decoration: none; 
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">LUXSTORE</div>
        </div>
        
        <div class="content">
            <p>Welcome to LUXSTORE - your destination for premium experiences.</p>
            <p>Please use the following verification code to complete your registration:</p>
            
            <div class="otp-box">${otp}</div>
            
            <p>This code will expire in 5 minutes. If you didn't request this code, you can safely ignore this email.</p>
        </div>
        
        <div class="footer">
            <div class="social-links">
                <a href="[WEBSITE_URL]" target="_blank">Website</a> | 
                <a href="[INSTAGRAM_URL]" target="_blank">Instagram</a> | 
                <a href="[SUPPORT_EMAIL]" target="_blank">Support</a>
            </div>
            <p style="margin-top: 15px;">© ${new Date().getFullYear()} LUXSTORE. All rights reserved.</p>
            <p>Elevating your digital experience</p>
        </div>
    </div>
</body>
</html>
`;

export const sendEmail = async ({ 
  to, 
  subject, 
  otp 
}: { 
  to: string; 
  subject: string; 
  otp: string 
}) => {
  // Gmail SMTP via worker-mailer (uses Cloudflare's native socket API — plain
  // nodemailer cannot run on Workers). Auth with a Gmail App Password.
  // Imported lazily: worker-mailer pulls in `cloudflare:sockets`, which only
  // exists on workerd — a top-level import breaks the Node-side `next build`.
  const { WorkerMailer } = await import('worker-mailer');

  const user = process.env.NEXT_PUBLIC_EMAIL_USER!;
  const pass = process.env.EMAIL_PASS!;

  return WorkerMailer.send(
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS on 587
      startTls: true,
      authType: 'login',
      credentials: { username: user, password: pass },
    },
    {
      from: { name: 'LUXSTORE', email: user },
      to: { email: to },
      subject,
      text: `Your LUXSTORE verification code is: ${otp}`,
      html: luxstoreEmailTemplate(otp),
    }
  );
};