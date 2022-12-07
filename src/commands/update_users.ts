import { ApplicationCommandTypes, InteractionResponseTypes } from "../../deps.ts";
import cyberdragons_data from "../../test.json" assert { type: "json" };
import { redis } from "../database/mod.ts";
import { createCommand } from "./mod.ts";

createCommand({
    name: "update_users",
    description: "Update the roster from DragonLink",
    defaultMemberPermissions: ["ADMINISTRATOR"],
    dmPermission: false,
    type: ApplicationCommandTypes.ChatInput,
    execute: async (Bot, interaction) => {
        //TODO Ask Ansh about how we should update the roster. Right now it reads from a JSON file that I got from the API
        cyberdragons_data.items.forEach(async user => {
            const user_id = user.account.primaryEmailAddress.split("@")[0].toLowerCase();
            await redis.setnx(user_id, '');
        });
        await Bot.helpers.sendPrivateInteractionResponse(
            interaction.id,
            interaction.token,
            {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                    content: `Finished updating the roster from DragonLink 🦛`,
                },
            },
        );
    },
});
