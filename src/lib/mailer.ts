import nodemailer from 'nodemailer';
import prisma from './prisma';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

export async function sendTaskNotification(taskId: string, subject: string, text: string) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn('E-Mail Versand übersprungen: GMAIL_USER oder GMAIL_PASS fehlen in der .env Datei.');
      return;
    }

    // Collect users who want emails
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { email: { not: null } },
          { email: { not: '' } }
        ],
        OR: [
          { emailPref: 'ALL' },
          { 
            emailPref: 'SPECIFIC',
            subscribedTasks: {
              some: { id: taskId }
            }
          }
        ]
      }
    });

    const bccList = users.map(u => u.email).filter(Boolean);

    if (bccList.length === 0) return;

    await transporter.sendMail({
      from: `"MakerSpace Benachrichtigung" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Das "Verstecken" der E-Mails via BCC: An sich selbst, alle anderen auf BCC.
      bcc: bccList as string[],
      subject,
      text: text + `\n\nDirektlink: https://stundentool-production.up.railway.app/dashboard/tasks/${taskId}` + '\n\n---\nGesendet vom MakerSpace Stundentool.\nDu erhältst diese E-Mail, da du entsprechende Benachrichtigungseinstellungen gesetzt hast.'
    });

    console.log(`[MAILER] E-Mail "${subject}" erfolgreich an ${bccList.length} Empfänger (BCC) verschickt.`);
  } catch (error) {
    console.error('[MAILER] Fehler beim E-Mail Versand:', error);
  }
}

export async function sendGeneralNotification(type: 'HEADLINE' | 'NEWS' | 'POLL', subject: string, text: string, link: string) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn('E-Mail Versand übersprungen: GMAIL_USER oder GMAIL_PASS fehlen in der .env Datei.');
      return;
    }

    // Determine which field to check based on type
    let userWhere: any = { email: { not: null }, emailPref: { not: 'NONE' } };
    if (type === 'HEADLINE') userWhere = { ...userWhere, notifyHeadlines: true };
    if (type === 'NEWS') userWhere = { ...userWhere, notifyNews: true };
    if (type === 'POLL') userWhere = { ...userWhere, notifyPolls: true };

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { email: { not: null } },
          { email: { not: '' } },
          userWhere
        ]
      }
    });

    const bccList = users.map(u => u.email).filter(Boolean);
    if (bccList.length === 0) return;

    await transporter.sendMail({
      from: `"MakerSpace Benachrichtigung" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      bcc: bccList as string[],
      subject,
      text: text + (link ? `\n\nDirektlink: ${link}` : '') + '\n\n---\nGesendet vom MakerSpace Stundentool.\nDu erhältst diese E-Mail, da du entsprechende Benachrichtigungseinstellungen gesetzt hast.'
    });

    console.log(`[MAILER] E-Mail "${subject}" (${type}) erfolgreich an ${bccList.length} Empfänger (BCC) verschickt.`);
  } catch (error) {
    console.error(`[MAILER] Fehler beim E-Mail Versand (${type}):`, error);
  }
}
