import prisma from './prisma';
import { logActivity } from './activityLogger';

export async function runTaskCleanup() {
  const now = new Date();

  try {
    // 1. Fetch all tasks that have a dueDate and are not DONE
    const scheduledTasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null },
        status: { not: 'DONE' }
      },
      include: {
        dateProposals: true
      }
    });

    for (const task of scheduledTasks) {
      if (!task.dueDate) continue;

      let isPast = false;
      let scheduledDateString = '';
      let scheduledTimeString = '';

      // Find matching proposal to get the exact endTime
      const matchingProposal = task.dateProposals.find(
        (p) => new Date(p.date).getTime() === new Date(task.dueDate!).getTime()
      );

      if (matchingProposal) {
        try {
          const datePart = new Date(matchingProposal.date).toISOString().split('T')[0];
          const endDateTime = new Date(`${datePart}T${matchingProposal.endTime}:00`);
          isPast = endDateTime < now;
          scheduledDateString = new Date(matchingProposal.date).toLocaleDateString('de-DE');
          scheduledTimeString = ` (${matchingProposal.startTime} - ${matchingProposal.endTime} Uhr)`;
        } catch (e) {
          console.error(`Error parsing proposal date/time for task ${task.id}:`, e);
        }
      } else {
        // Fallback: If no matching proposal exists, check if the dueDate day is in the past
        // (assume end of that day, 23:59:59)
        try {
          const datePart = new Date(task.dueDate).toISOString().split('T')[0];
          const endDateTime = new Date(`${datePart}T23:59:59`);
          isPast = endDateTime < now;
          scheduledDateString = new Date(task.dueDate).toLocaleDateString('de-DE');
        } catch (e) {
          console.error(`Error parsing fallback date for task ${task.id}:`, e);
        }
      }

      if (isPast) {
        // Reset the task to OPEN
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'OPEN',
            dueDate: null
          }
        });

        // Log the activity
        await logActivity(
          'TASK_RESET_AUTOMATIC',
          `Der Arbeitsdienst "${task.title}" wurde automatisch auf "Offen" zurückgesetzt, da der Termin (${scheduledDateString}${scheduledTimeString}) in der Vergangenheit liegt.`
        );
      }
    }

    // 2. Fetch all date proposals and delete the ones in the past
    const proposals = await prisma.taskDateProposal.findMany();
    const pastProposalIds: string[] = [];

    for (const p of proposals) {
      if (!p.date || !p.endTime) continue;

      try {
        const datePart = new Date(p.date).toISOString().split('T')[0];
        const endDateTime = new Date(`${datePart}T${p.endTime}:00`);
        if (endDateTime < now) {
          pastProposalIds.push(p.id);
        }
      } catch (e) {
        console.error(`Error checking past proposal ${p.id}:`, e);
      }
    }

    if (pastProposalIds.length > 0) {
      await prisma.taskDateProposal.deleteMany({
        where: {
          id: { in: pastProposalIds }
        }
      });
    }
  } catch (error) {
    console.error('Error during task cleanup:', error);
  }
}
