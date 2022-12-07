import { configs } from "../../configs.ts";
import { RedisConnect } from "../../deps.ts";
import { logger } from "../utils/logger.ts";

const log = logger({ name: "DB Manager" });

log.info("Initializing Database");

export const redis = await RedisConnect({
  hostname: 'redis-13623.c89.us-east-1-3.ec2.cloud.redislabs.com',
  port: 13623,
  password: configs.redis_password,
});

log.info("Database Initialized!");
