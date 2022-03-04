import { Context } from 'telegraf'
import { isGloballyRestricted } from '@helpers/globallyRestricted'
import { deleteMessageSafe } from '@helpers/deleteMessageSafe'

export async function checkRestrict(ctx: Context, next: () => any) {
  if (ctx.update.message?.date && ctx.update.message?.text === '/help') {
    console.log(
      'Got to checkRestrict on help',
      Date.now() / 1000 - ctx.update.message?.date
    )
  }
  // Get the message
  const message = ctx.editedMessage || ctx.message
  // Continue if there is no message
  if (!message) {
    return next()
  }
  // Continue if the restrict is off
  if (!ctx.dbchat.restrict) {
    return next()
  }
  // Don't restrict super admin
  if (ctx.from.id === parseInt(process.env.ADMIN)) {
    return next()
  }
  // Just delete the message if globally restricted
  if (isGloballyRestricted(ctx.from.id)) {
    deleteMessageSafe(ctx)
    return
  }
  // Check if this user is restricted
  const restricted = ctx.dbchat.restrictedUsers
    .map((u) => u.id)
    .includes(ctx.from.id)
  // If a restricted user tries to send restricted type, just delete it
  if (
    restricted &&
    ((message.entities && message.entities.length) ||
      (message.caption_entities && message.caption_entities.length) ||
      message.forward_from ||
      message.forward_date ||
      message.forward_from_chat ||
      message.document ||
      message.sticker ||
      message.photo ||
      message.video_note ||
      message.video ||
      message.game
      // temp: when restricted user tries to send text message, just delete it
      message.text)
  ) {
    deleteMessageSafe(ctx)
    return
  }
  // Or just continue
  return next()
}
