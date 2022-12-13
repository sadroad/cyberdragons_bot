import { ApplicationCommandTypes, ButtonStyles, InteractionResponseTypes, MessageComponentTypes } from "../../deps.ts";
import { createCommand } from "./mod.ts";

createCommand({
    name: "verify",
    description: "Verify yourself, these descriptions are amazing i know :)",
    dmPermission: false,
    type: ApplicationCommandTypes.ChatInput,
    execute: async (Bot, interaction) => {
        await Bot.helpers.sendPrivateInteractionResponse(
            interaction.id,
            interaction.token,
            {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                    content: "Please update your username using `/nick` to match the one of the following formats:\n\n1. Current Drexel students / faculty:\nFirst and Last Name | Drexel ID(ex.abc123)\n\n2. Current Drexel Dual Admissions Students:\nFirst and Last Name | Your current college(non - Drexel one)\n\n3. Alumni or Industry professionals:\nFirst and Last Name | Drexel ID(ex.abc123) or Company / Institution Name\n\nOnce completed, click on the button below for the automatic verification to comence.",
                    components: [{
                        type: MessageComponentTypes.ActionRow,
                        components: [{
                            type: MessageComponentTypes.Button,
                            label: "Verify",
                            customId: "verification",
                            style: ButtonStyles.Primary
                        }]
                    }],
                }
            },
        );
        //Rest of the command interaction response occurs in the interactionCreate.ts file
    },
});