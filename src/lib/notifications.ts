import { prisma } from "@/lib/prisma";

export async function createNotification(userId: string, message: string) {
  return prisma.notification.create({
    data: { userId, message },
  });
}

export async function notifyAdmins(message: string) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (admins.length === 0) return 0;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({ userId: admin.id, message })),
  });
  return admins.length;
}

/** Notify every non-frozen user (e.g. new plan launched). */
export async function broadcastToUsers(
  message: string,
  options?: { excludeUserIds?: string[] }
) {
  const exclude = new Set(options?.excludeUserIds ?? []);
  const users = await prisma.user.findMany({
    where: { isFrozen: false, role: "USER" },
    select: { id: true },
  });

  const targets = users.filter((u) => !exclude.has(u.id));
  if (targets.length === 0) return 0;

  const chunkSize = 200;
  for (let i = 0; i < targets.length; i += chunkSize) {
    const chunk = targets.slice(i, i + chunkSize);
    await prisma.notification.createMany({
      data: chunk.map((u) => ({ userId: u.id, message })),
    });
  }
  return targets.length;
}

export async function notifyUserAndAdmins(
  userId: string,
  userMessage: string,
  adminMessage: string
) {
  await createNotification(userId, userMessage);
  await notifyAdmins(adminMessage);
}
