import prisma from './prisma';

// Die Webhook-URL deines Google Apps Scripts
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby2Igv5EisvU4-_riOJuuh4fgpezEihxcEvUhQUsXFD77b__6sAILfZdFi_wcE4Q1Wv/exec';

async function sendViaWebhook(subject: string, text: string, bccList: string[]) {
  try {
    const payload = {
      subject: subject,
      body: text,
      bcc: bccList.join(',')
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      // Set no-cors if needed, but since it's server side, standard fetch works fine
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.text();
    if (result !== 'Success') {
      throw new Error(`Google Script Error: ${result}`);
    }
    
    return true;
  } catch (error) {
    console.error('[MAILER_WEBHOOK] Fehler:', error);
    throw error;
  }
}

export async function sendTaskNotification(taskId: string, subject: string, text: string) {
  try {
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

    const bccList = users.map(u => u.email).filter(Boolean) as string[];

    if (bccList.length === 0) return;

    const fullText = text + `\n\nDirektlink: https://stundentool-production.up.railway.app/dashboard/tasks/${taskId}` + '\n\n---\nGesendet vom MakerSpace Stundentool.\nDu erhältst diese E-Mail, da du entsprechende Benachrichtigungseinstellungen gesetzt hast.';

    await sendViaWebhook(subject, fullText, bccList);

    console.log(`[MAILER] E-Mail "${subject}" erfolgreich an ${bccList.length} Empfänger (BCC) über Google Webhook verschickt.`);
  } catch (error) {
    console.error('[MAILER] Fehler beim E-Mail Versand:', error);
  }
}

export async function sendGeneralNotification(type: 'HEADLINE' | 'NEWS' | 'POLL', subject: string, text: string, link: string) {
  try {
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

    const bccList = users.map(u => u.email).filter(Boolean) as string[];
    if (bccList.length === 0) return;

    const fullText = text + (link ? `\n\nDirektlink: ${link}` : '') + '\n\n---\nGesendet vom MakerSpace Stundentool.\nDu erhältst diese E-Mail, da du entsprechende Benachrichtigungseinstellungen gesetzt hast.';

    await sendViaWebhook(subject, fullText, bccList);

    console.log(`[MAILER] E-Mail "${subject}" (${type}) erfolgreich an ${bccList.length} Empfänger (BCC) über Google Webhook verschickt.`);
  } catch (error) {
    console.error(`[MAILER] Fehler beim E-Mail Versand (${type}):`, error);
  }
}
