export interface ISystem {
  init(): Promise<void> | void;
  update(delta: number): void;
  destroy(): void;
}
