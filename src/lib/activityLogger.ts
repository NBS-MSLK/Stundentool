import prisma from './prisma';

export async function logActivity(
  action: string,
  details: string,
  userId?: string | null,
  userName?: string | null
) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        details,
        userId: userId || null,
        userName: userName || null,
      }
    });
  } catch (error) {
    console.error('[ACTIVITY LOGGER] Failed to log activity:', error);
  }
}
