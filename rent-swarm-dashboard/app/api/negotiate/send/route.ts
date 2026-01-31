import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    try {
        const { to, subject, body, from } = await req.json();

        if (!to || !subject || !body) {
            return NextResponse.json(
                { error: 'Recipient, subject, and body are required' },
                { status: 400 }
            );
        }

        // METHOD 1: Gmail API (Official, OAuth2) - Preferred
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN) {
            try {
                const oAuth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
                );

                oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
                const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

                // Create raw email string (RFC 822)
                const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
                const messageParts = [
                    `To: ${to}`,
                    `Subject: ${utf8Subject}`,
                    `Content-Type: text/plain; charset=utf-8`,
                    `MIME-Version: 1.0`,
                    ``,
                    body
                ];
                const message = messageParts.join('\n');
                // URL-safe base64 string
                const encodedMessage = Buffer.from(message)
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: {
                        raw: encodedMessage
                    }
                });

                return NextResponse.json({ success: true, method: 'gmail-api' });
            } catch (gmailError) {
                console.error("Gmail API failed:", gmailError);
                // Fallback to next method
            }
        }

        // METHOD 2: Nodemailer (SMTP) - Backup
        if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: process.env.GMAIL_USER, // Sender must match auth user usually
                to,
                subject,
                text: body,
            });

            return NextResponse.json({ success: true, method: 'nodemaler-smtp' });
        }

        // METHOD 3: Simulation (If no keys configured)
        console.log("=== SIMULATED EMAIL SEND ===");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Body:", body);
        console.log("============================");

        return NextResponse.json({
            success: true,
            method: 'simulated',
            warning: 'Email was logged to server console. Configure GOOGLE_CLIENT_ID/REFRESH_TOKEN or GMAIL_APP_PASSWORD to actually send.'
        });

    } catch (error) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
