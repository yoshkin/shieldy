import { clarifyIfPrivateMessages } from "@helpers/clarifyIfPrivateMessages";
import { saveChatProperty } from "@helpers/saveChatProperty";
import { Telegraf, Context, Extra } from "telegraf";
import { localizations, strings } from "@helpers/strings";
import { checkLock } from "@middlewares/checkLock";
import { clarifyReply } from "@helpers/clarifyReply";
import { report } from "process";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

export function setupAddFilter(bot: Telegraf<Context>) {
  // Setup command
  bot.command("addFilter", checkLock, clarifyIfPrivateMessages, async (ctx) => {
    const text = ctx.message.text;
    if (!text) {
      ctx.reply(
        strings(ctx.dbchat, "addFilterError"),
        Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage
      );
    } else {
      const oldFilters = [
        ...new Set(ctx.dbchat.filters).add(text.toLowerCase()),
      ];
      ctx.dbchat.filters = oldFilters;
      await saveChatProperty(ctx.dbchat, "filters");
      ctx.reply(
        strings(ctx.dbchat, "greetsUsers_message_accepted"),
        Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage
      );
    }
  });
}
