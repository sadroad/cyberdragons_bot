import { configs } from "../../configs.ts";
import { ApplicationCommandTypes, getSetCookies, InteractionResponseTypes } from "../../deps.ts";
import { redis_vpn } from "../database/mod.ts";
import log from "../utils/logger.ts";
import { createCommand } from "./mod.ts";

type CRUDFunction = (...parameters: any) => any;

const obtainSessionToken = async (function_to_run: CRUDFunction, ...parameters: any): Promise<any> => {
    const response = await fetch(`https://${configs.wireguard_creds.hostname}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "username": configs.wireguard_creds.username, "password": configs.wireguard_creds.password })
    });
    if (response.status !== 200) {
        log.error("Unable to obtain proper authorization cookie");
    }
    const cookies = getSetCookies(response.headers);
    configs.wireguard_creds.cookies = `${cookies[0].name}=${cookies[0].value};${cookies[1].name}=${cookies[1].value};`;
    return await function_to_run(parameters);
};

const deleteClient = async (client_id: string): Promise<boolean> => {
    const client_check = await fetch(`https://${configs.wireguard_creds.hostname}/api/client/${client_id}`, {
        method: "GET",
        headers: {
            "Cookie": configs.wireguard_creds.cookies
        }
    });
    if (client_check.headers.get("content-type") !== "application/json; charset=UTF-8") {
        return await obtainSessionToken(deleteClient, client_id);
    } else if (client_check.status === 404) {
        return false;
    }
    const response = await fetch(`https://${configs.wireguard_creds.hostname}/remove-client`, {
        method: "POST",
        headers: {
            "Cookie": configs.wireguard_creds.cookies,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "id": client_id })
    });
    if (response.status === 401) {
        const test = await obtainSessionToken(deleteClient, client_id);
        return test;
    } else if (response.status === 500) {
        return false;
    }
    return true;
};

const getValidIPRange = async (): Promise<JSON> => {
    const response = await fetch(`https://${configs.wireguard_creds.hostname}/api/suggest-client-ips`, {
        method: "GET",
        headers: {
            "Cookie": configs.wireguard_creds.cookies
        }
    });
    if (response.headers.get("content-type") !== "application/json; charset=UTF-8") {
        return await obtainSessionToken(getValidIPRange);
    }
    const json = await response.json();
    return json;
};

const createClient = async (username: string, valid_ips: JSON): Promise<string> => {
    // First Last | abc123
    const names = username.split("|");
    const body = {
        "name": names[0].trim(),
        "email": `${names[1].trim()}@drexel.edu`,
        "allocated_ips": valid_ips,
        "allowed_ips": [
            "0.0.0.0/0",
            "::/0"
        ],
        "extra_allowed_ips": [],
        "use_server_dns": true,
        "enabled": true,
        "public_key": "",
        "preshared_key": ""
    }
    const response = await fetch(`https://${configs.wireguard_creds.hostname}/new-client`, {
        method: "POST",
        headers: {
            "Cookie": configs.wireguard_creds.cookies,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (response.status === 401) {
        return await obtainSessionToken(createClient, username, valid_ips);
    } else if (response.status === 400) {
        const new_ip_range = await getValidIPRange();
        return await createClient(username, new_ip_range);
    }
    return (await response.json()).id;
}

const getClientInfo = async (client_id: string): Promise<string> => {
    const response = await fetch(`https://${configs.wireguard_creds.hostname}/download/?clientid=${client_id}`, {
        method: "GET",
        headers: {
            "Cookie": configs.wireguard_creds.cookies
        }
    });
    if (response.headers.get("content-type") !== "text/plain") {
        return await obtainSessionToken(getClientInfo, client_id);
    }
    return await response.text();
}

createCommand({
    name: "generate_vpn",
    description: "Generate or regenerate a new VPN configuration",
    dmPermission: false,
    defaultMemberPermissions: ["ADD_REACTIONS"],
    type: ApplicationCommandTypes.ChatInput,
    execute: async (Bot, interaction) => {
        /*
        1. Delete old configuration if it exists
        2. Get new valid IP range
        3. Create new Client configuration
        4. Provide configuration details
        */
        await Bot.helpers.sendPrivateInteractionResponse(
            interaction.id,
            interaction.token,
            {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                    content: "VPN configuration is being generated. Please wait."
                }
            },
        );
        const user_id = interaction.user.id as unknown as string;
        const guild_username = (await Bot.helpers.getMember(configs.cyberdragon_guild_id, user_id)).nick ?? "No_Nickname";
        if (await redis_vpn.exists(user_id) === 1) {
            await deleteClient(await redis_vpn.get(user_id) as string);
        }
        const valid_ip_range = await getValidIPRange();
        const client_config_id = await createClient(guild_username, valid_ip_range);
        await redis_vpn.set(user_id, client_config_id);
        const client_config_data = await getClientInfo(client_config_id);
        await Bot.helpers.editOriginalInteractionResponse(
            interaction.token,
            {
                content: `Here is your configuration information. Please don't share this with others.\n\n\`\`\`${client_config_data}\`\`\``,
            },
        );
    },
});
