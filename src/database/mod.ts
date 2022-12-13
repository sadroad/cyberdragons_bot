import { configs } from "../../configs.ts";
import { RedisConnect } from "../../deps.ts";
import { logger } from "../utils/logger.ts";

const log = logger({ name: "DB Manager" });

log.info("Initializing Databases");

export const redis_verification = await RedisConnect({
  hostname: configs.redis_verification_hostname,
  port: configs.redis_verification_port,
  password: configs.redis_password,
});

export const redis_vpn = await RedisConnect({
  hostname: configs.redis_vpn_hostname,
  port: configs.redis_vpn_port,
  password: configs.redis_password,
});

log.info("Databases Initialized!");
