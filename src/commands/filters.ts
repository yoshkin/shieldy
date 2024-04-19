import { clarifyIfPrivateMessages } from "@helpers/clarifyIfPrivateMessages";
import { saveChatProperty } from "@helpers/saveChatProperty";
import { Telegraf, Context, Extra } from "telegraf";
import { localizations, strings } from "@helpers/strings";
import { checkLock } from "@middlewares/checkLock";
import { clarifyReply } from "@helpers/clarifyReply";
import { report } from "process";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

export function setupFilters(bot: Telegraf<Context>) {
  // Setup command
  bot.command("filters", checkLock, clarifyIfPrivateMessages, async (ctx) => {
    await ctx.replyWithMarkdown(
      `${strings(ctx.dbchat, "filters")}`,
      Extra.inReplyTo(ctx.message.message_id).webPreview(false)
    );
    await ctx.replyWithMarkdown(
      `<code>${
        ctx.dbchat.filters ||
        strings(ctx.dbchat, "filtersEmpty")
      }</code>`,
      Extra.webPreview(false).HTML(true)
    );
    await clarifyReply(ctx);
  });
  // Setup checker
  bot.use(async (ctx, next) => {
    try {
      // Check if reply
      if (!ctx.message || !ctx.message.reply_to_message) {
        return;
      }
      // Check if text
      if (!ctx.message.text) {
        return;
      }
      // Check if reply to shieldy
      if (
        !ctx.message.reply_to_message.from ||
        !ctx.message.reply_to_message.from.username ||
        ctx.message.reply_to_message.from.username !==
          (bot as any).botInfo.username
      ) {
        return;
      }
      // Check if reply to the correct message
      const filtersMessages = Object.keys(localizations.filters).map(
        (k) => localizations.filters[k]
      );
      if (
        !ctx.message.reply_to_message.text ||
        filtersMessages.indexOf(ctx.message.reply_to_message.text) < 0
      ) {
        return;
      }
      // Check format
      const components = ctx.message.text.split("\n");
      let result = [];
      for (const component of components) {
        if (component.length == 0) {
          // Default
          ctx.dbchat.filters = [];
          await saveChatProperty(ctx.dbchat, "filters");
          return;
        } else {
          result.push(component);
        }
      }
      // Save text
      ctx.dbchat.filters = result;
      await saveChatProperty(ctx.dbchat, "filters");
      ctx.reply(
        strings(ctx.dbchat, "greetsUsers_message_accepted"),
        Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage
      );
    } catch (err) {
      report(err);
    } finally {
      next();
    }
  });
}
