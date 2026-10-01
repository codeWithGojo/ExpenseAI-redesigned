import path from "node:path";
import type { NextConfig } from "next";
const root=path.resolve(process.cwd(), "..");
const config:NextConfig={turbopack:{root},outputFileTracingRoot:root};
export default config;
