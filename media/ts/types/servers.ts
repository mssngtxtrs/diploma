export interface CPU {
  name: string;
  cores: number;
  threads: number;
  frequency: number;
}

export type Server = {
  id: number;
  name: string;
  cpu: CPU;
  ram: number;
  space: number;
};
