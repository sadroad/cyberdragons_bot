import { Bot } from "../../bot.ts";
import { configs } from "../../configs.ts";
import { BigString, InteractionResponseTypes, InteractionTypes } from "../../deps.ts";
import { redis_verification } from "../database/mod.ts";
import { sleep } from "../utils/helpers.ts";
import log from "../utils/logger.ts";

Bot.events.interactionCreate = async (_, interaction) => {
  if (!interaction.data) return;

  switch (interaction.type) {
    case InteractionTypes.ApplicationCommand:
      log.info(
        `[Application Command] ${interaction.data.name} command executed by ${interaction.user.username}#${interaction.user.discriminator}.`,
      );
      Bot.commands.get(interaction.data.name!)?.execute(Bot, interaction);
      break;
    case InteractionTypes.MessageComponent:
      switch (interaction.data.customId) {
        case "verification": {
          const final_response = async (message: string) => {
            await Bot.helpers.sendPrivateInteractionResponse(
              interaction.id,
              interaction.token,
              {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: message
                }
              }
            );
            await Bot.helpers.deleteFollowupMessage(interaction.token, interaction.message?.id as BigString);
            const error_message = await Bot.helpers.getOriginalInteractionResponse(interaction.token);
            await sleep(5000);
            await Bot.helpers.deleteFollowupMessage(interaction.token, error_message.id);
          }
          const forward_to_admin = async (message: string) => {
            await Bot.helpers.sendMessage(
              configs.cyberdragon_admin_channel,
              {
                content: message
              }
            );
          }
          //verify the username to match First Last | abc123
          const drexel_id_regex = /([a-z])+\d+/g;
          const name_regex = /^([A-Za-z])+\s([A-Za-z])+$/g;
          const guild_username = (await Bot.helpers.getMember(configs.cyberdragon_guild_id, interaction.user.id)).nick ?? "No_Nickname";

          if (guild_username === "No_Nickname") {
            await final_response("You need to update your username using `/nick` before verification can happen");
            break;
          }

          const username = guild_username.split("|").map(val => val.trim());
          //either of the regex fail report error, potentially failing verification
          if (!name_regex.test(username[0]) || !drexel_id_regex.test(username[1])) {
            if (!name_regex.test(username[0])) {
              await final_response("Your name doesn't follow the format of `First_Name Last_Name`. If this is an error please notify the E-Board for manual verification");
              break;
            } else {
              const college_scuffed_regex = /^(([A-Za-z])+(\s|$))+/g;
              if (college_scuffed_regex.test(username[0])) {
                // manual verification needed for college or professional
                await forward_to_admin(`@here\nA user needs to be manually verified.\n\nUser: <@${interaction.user.id}>\nName entered: ${guild_username}`);
                await final_response("Your account has been flagged for manual verification. Appropritate information has been sent to the E-Board. If urgent please reach out to an E-Board member for assistence.")
                break;
              } else {
                await final_response("There is an error with the formatting of your Drexel ID. Please correct it and reattempt the verification process. If this is an error please notify the E-Board for manual verification");
                break;
              }
            }
          }

          //check db for conflict or not found
          //default value is 0
          const discord_id = await redis_verification.get(username[1]);
          if (discord_id === null || (discord_id !== "0" && discord_id !== interaction.user.id as unknown as string)) {
            if (discord_id === null) {
              await forward_to_admin(`@here\nAn error has occured with someones registration. They are attempting to register as a user we don't have on file.\nUser attempting to register: <@${interaction.user.id}>\nName entered: ${guild_username}\n\nPlease pull a new verison of the club's roster from Dragon Link. In the meanwhile, verify the user manually if possible.`);
            } else if (discord_id !== "0") {
              await forward_to_admin(`@here\nAn error has occured with someones registration. They are attempting to register as a user we already have in the database.\nUser attempting to register: <@${interaction.user.id}>\nName entered: ${guild_username}\nUser on file: <@${discord_id}>`);
            }
            await final_response(`An error has occured and has been forwarded to the E-Board. Manual verification may take a moment. If urgent please reach out to an E-Board member for assistence.`);
            break;
          } else if (discord_id === interaction.user.id as unknown as string) {
            await final_response(`Seems that you've already registered yourself 🐙`);
            break;
          }

          //i love typescript ㅁㅅㅁ
          await redis_verification.set(username[1], interaction.user.id as unknown as string);

          await Bot.helpers.addRole(interaction.guildId as BigString, interaction.user.id, configs.cyberdragon_role);
          await final_response("You've been verified 👍");
          break;
        }
      }
      break;
  }
};
