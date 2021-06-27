import { HomeAssistant } from 'custom-card-helpers';

export interface ConfigEntry {
    entry_id: string;
    domain: string;
    title: string;
    source: string;
    state:
      | "loaded"
      | "setup_error"
      | "migration_error"
      | "setup_retry"
      | "not_loaded"
      | "failed_unload";
    supports_options: boolean;
    supports_unload: boolean;
    pref_disable_new_entities: boolean;
    pref_disable_polling: boolean;
    disabled_by: "user" | null;
    reason: string | null;
}

export const getConfigEntries = (hass: HomeAssistant) =>
    hass.callApi<ConfigEntry[]>("GET", "config/config_entries/entry");

export const filterDevice = (devices: DeviceRegistryEntry[], deviceId: string) =>
    devices.filter((device) => device.id === deviceId);

export interface DeviceRegistryEntry {
    id: string;
    config_entries: string[];
    connections: Array<[string, string]>;
    identifiers: Array<[string, string]>;
    manufacturer: string | null;
    model: string | null;
    name: string | null;
    sw_version: string | null;
    via_device_id: string | null;
    area_id: string | null;
    name_by_user: string | null;
    entry_type: "service" | null;
    disabled_by: string | null;
    }


export interface DeviceSelector {
    device: {
        integration?: string;
        manufacturer?: string;
        model?: string;
        entity?: {
        domain?: EntitySelector["entity"]["domain"];
        device_class?: EntitySelector["entity"]["device_class"];
        };
    };
}

export interface EntitySelector {
    entity: {
      integration?: string;
      domain?: string;
      device_class?: string;
    };
  }