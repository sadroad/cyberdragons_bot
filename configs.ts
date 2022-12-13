import { dotEnvConfig } from "./deps.ts";

// Get the .env file that the user should have created, and get the token
const env = dotEnvConfig({ export: true, path: "./.env" });
const token = env.BOT_TOKEN || "";

const redis_password = env.REDIS_PASSWORD || "";
const redis_verification_hostname = env.REDIS_VERIFICATION_HOSTNAME || "";
const redis_vpn_hostname = env.REDIS_VPN_HOSTNAME || "";
const redis_verification_port = env.REDIS_VERIFICATION_PORT || 6379;
const redis_vpn_port = env.REDIS_VPN_PORT || 6380;
const cyberdragon_role = env.CYBERDRAGON_ROLE || "";
const cyberdragon_admin_channel = env.CYBERDRAGON_ADMIN_CHANNEL || "";
const cyberdragon_guild_id = env.CYBERDRAGON_GUILD_ID || "";

export interface Config {
  token: string;
  botId: bigint;
  creds: WireGuardCreds;
}

interface WireGuardCreds {
  username: string;
  password: string;
  hostname: string;
  cookies: string;
}

export const configs = {
  /** Get token from ENV variable */
  token,
  /** Get the BotId from the token */
  botId: BigInt(atob(token.split(".")[0])),
  /** The server id where you develop your bot and want dev commands created. */
  devGuildId: BigInt(env.DEV_GUILD_ID!),
  redis_password,
  redis_verification_hostname,
  redis_vpn_hostname,
  redis_verification_port,
  redis_vpn_port,
  cyberdragon_role,
  cyberdragon_admin_channel,
  cyberdragon_guild_id,
  wireguard_creds: { username: env.WIREGUARD_USERNAME, password: env.WIREGUARD_PASSWORD, cookies: "", hostname: env.WIREGUARD_HOSTNAME } as WireGuardCreds
};
