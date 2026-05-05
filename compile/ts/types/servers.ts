export interface CPU {
  id: number;
  name: string;
  cores: number;
  threads: number;
  frequency: number;
}

export type Server = {
  id: number;
  name: string;
  cpu: CPU;
};
