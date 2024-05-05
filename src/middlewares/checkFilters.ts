import { isGroup } from "@helpers/isGroup";
import { deleteMessageSafe } from "@helpers/deleteMessageSafe";
import { Context } from "telegraf";
import { modifyRestrictedUsers } from "@helpers/restrictedUsers";
import { Candidate } from "@models/Chat";

export async function checkFilters(ctx: Context, next: Function) {
  if (ctx.update.message?.date && ctx.update.message?.text === "/help") {
    console.log(
      "Got to checkFilters on help",
      Date.now() / 1000 - ctx.update.message?.date
    );
  }
  // Get the message
  const message = ctx.editedMessage || ctx.message;
  // If there is no message, just continue
  if (!message) {
    return next();
  }

  if (!("text" in message)) return next();

  // If there is no need to check for links, just continue
  if (!ctx.dbchat.filters.length) {
    return next();
  }
  const disallowedStings = ctx.dbchat.filters;
  // If sent from private chat or channel, just continue
  if (!isGroup(ctx)) {
    return next();
  }

  // If sent from admins, just ignore
  const adminIds = [777000, parseInt(process.env.ADMIN)];
  if (adminIds.includes(ctx.from.id) || ctx.isAdministrator) {
    return next();
  }
  // Create a placeholder if the message needs deletion
  let needsToBeDeleted = false;
  // Check all entities

  // If the link is a telegram link, mark the message for deletion
  for (const string of disallowedStings) {
    if (message.text.toLowerCase().includes(string.toLowerCase())) {
      needsToBeDeleted = true;
      break;
    }
  }

  // If found - delete the message
  if (needsToBeDeleted) {
    deleteMessageSafe(ctx);
    // Ban in Telegram
    await ctx.telegram.kickChatMember(ctx.dbchat.id, ctx.from.id);
    // Unrestrict in shieldy
    modifyRestrictedUsers(ctx.dbchat, false, [
      { id: ctx.from.id } as Candidate,
    ]);
    return;
  }
  // Or just continue
  return next();
}
