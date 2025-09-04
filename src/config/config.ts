import "dotenv/config";

interface Config {
  PORT: number;
  MONGODB_URL: string;
}
const config: Config = {
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URL: process.env.MONGODB_URL || "",
};

export default config;
