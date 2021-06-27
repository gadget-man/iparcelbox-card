import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'boilerplate-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface ParcelBoxCardConfig extends LovelaceCardConfig {
  type: string;
  name: string;
  device?: string;
  image?: string;
  show_buttons?: boolean;
  show_header?: boolean;
  show_status?: boolean;
  show_attributes?: boolean;
  // show_warning?: boolean;
  // show_error?: boolean;
  // test_gui?: boolean;
  // entity?: string;
  // tap_action?: ActionConfig;
  // hold_action?: ActionConfig;
  // double_tap_action?: ActionConfig;
}

export interface LovelaceRowConfig {
  entity?: string;
  type?: string;
}

export type EntityList = Array<LovelaceRowConfig>;