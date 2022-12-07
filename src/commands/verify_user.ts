import { ApplicationCommandTypes, BigString, InteractionResponseTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";

createCommand({
    name: "verify",
    description: "Verify yourself, these descriptions are amazing i know :)",
    dmPermission: false,
    type: ApplicationCommandTypes.ChatInput,
    execute: async (Bot, interaction) => {
        // TODO Create a verification process. Probably just asking for their Drexel ID, changing their name, and removing ther pemission to do so

        //Giving the verified user the CyberDragon role
        await Bot.helpers.addRole(interaction.guildId as BigString, interaction.user.id, "1050053471459622963");
        await Bot.helpers.sendPrivateInteractionResponse(
            interaction.id,
            interaction.token,
            {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                    content: `You've been verified 👍`,
                },
            },
        );
    },
});
