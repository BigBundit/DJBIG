// Fallback declarations if node_modules resolution fails
declare module '@capacitor/haptics' {
  export enum ImpactStyle {
    Heavy = 'HEAVY',
    Medium = 'MEDIUM',
    Light = 'LIGHT'
  }
  export interface ImpactOptions {
    style: ImpactStyle;
  }
  export interface HapticsPlugin {
    impact(options: ImpactOptions): Promise<void>;
    vibrate(options?: { duration: number }): Promise<void>;
    selectionStart(): Promise<void>;
    selectionChanged(): Promise<void>;
    selectionEnd(): Promise<void>;
  }
  export const Haptics: HapticsPlugin;
}

declare module '@capacitor/status-bar' {
  export interface StatusBarPlugin {
    hide(): Promise<void>;
    show(): Promise<void>;
  }
  export const StatusBar: StatusBarPlugin;
}