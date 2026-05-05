import type { Server } from "./servers.js";

export type Hosting = {
  id: number;
  name: string;
  ram: number;
  space: number;
  vcpu: number;
  traffic: number;
  price_per_month: number;
};

export type HostingFull = Hosting & {
  server: Server;
};
