/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import {
  LitElement,
  html,
  TemplateResult,
  CSSResult,
  css,
} from 'lit-element';
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';
import { ParcelBoxCardConfig } from './types';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { formfieldDefinition } from '../elements/formfield';
import { selectDefinition } from '../elements/select';
import { switchDefinition } from '../elements/switch';
import { textfieldDefinition } from '../elements/textfield';
import { DeviceRegistryEntry, filterDevice, filterManufacturer } from './device_helper';

const options = {
  required: {
    icon: 'tune',
    name: 'Connect to iParcelBox device ',
    secondary: 'Enter selected options',
    footer: "(Enter 'none' to remove default background)",
    show: true,
  },

};

@customElement('boilerplate-card-editor')
export class BoilerplateCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: ParcelBoxCardConfig;
  @state() private _toggle?: boolean;
  @state() private _helpers?: any;
  private _initialized = false;

  @state() private _devices: DeviceRegistryEntry[] = [];
  @state() private _devicePickerLoading = false;
  private _devicePickerLoaded = false;

  static elementDefinitions = {
    ...textfieldDefinition,
    ...switchDefinition,
    ...formfieldDefinition,
    ...selectDefinition
  };

  public setConfig(config: ParcelBoxCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }


  firstUpdated() {
    // `hass` is often assigned AFTER first render/firstUpdated.
    // This call is harmless if hass isn't ready yet.
    this.loadDevicePicker();
  }

  protected updated(changedProps: Map<string, unknown>): void {
    // On first load, HA sets `hass` after the element is created.
    // Re-attempt loading once `hass` arrives.
    if (changedProps.has('hass')) {
      this.loadDevicePicker();
    }
  }

  async loadDevicePicker() {
    // If hass isn't available yet, bail out; `updated()` will retry when hass is set.
    if (!this.hass) return;

    // Prevent duplicate/in-flight loads and avoid reloading if already loaded.
    if (this._devicePickerLoading || this._devicePickerLoaded) return;

    this._devicePickerLoading = true;
    try {
      const devices = await this.hass.callWS<DeviceRegistryEntry[]>({
        type: 'config/device_registry/list',
      });
      this._devices = devices || [];
      this._devicePickerLoaded = true;
    } catch (err) {
      // Leave loaded=false so we can retry later.
      // eslint-disable-next-line no-console
      console.warn('iparcelbox-card editor: failed to load device registry', err);
    } finally {
      this._devicePickerLoading = false;
    }
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    return true;
  }

  get _name(): string {
    return this._config?.name || '';
  }

  get _device_id(): string  {
    return this._config?.device_id || '';
  }

  get _header(): boolean {
    return this._config?.show_header || false;
  }

  get _status(): boolean {
    return this._config?.show_status || false;
  }

  get _attributes(): boolean {
    return this._config?.show_attributes || false;
  }

  get _buttons(): boolean {
    return this._config?.show_buttons || false;
  }

  get _device_name(): string  {
    return this._config?.device_name || '';
  }

  get _image(): string {
    return this._config?.image || '';
  }


  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    const deviceList: DeviceRegistryEntry[] = filterManufacturer(this._devices, 'iParcelBox Ltd');

    return html`
      <div class="card-config">
        <div class="option" .option=${'required'}>
          <div class="row">
            <div class="title">${options.required.name}</div>
          </div>
        </div>
        ${options.required.show
          ? html`
          <div class="values">
            <mwc-select
              naturalMenuWidth
              fixedMenuPosition
              label="Device (Required)"
              .configValue=${'device_id'}
              .value=${this._device_id}
              @selected=${this._valueChanged}
              @closed=${(ev) => ev.stopPropagation()}
            >

              ${deviceList.map((device) => {
                if (device.id == this._device_id) {
                  return html`<mwc-list-item selected .value=${device.id}>${device.name}</mwc-list-item>`;
                } else {
                  return html`<mwc-list-item .value=${device.id}>${device.name}</mwc-list-item>`;
                }
              })}
            </mwc-select>
          </div>
          <div class="values">
            <mwc-textfield
              label="Name (Optional)"
              .value=${this._name}
              .configValue=${'name'}
              @input=${this._valueChanged}
            ></mwc-textfield>
          </div>


          <div class="values">
            <mwc-textfield
              label="Background Image File (Optional)"
              .value=${this._image}
              .configValue=${'image'}
              @input=${this._valueChanged}
            ></mwc-textfield>

            <div class="footer">${options.required.footer}</div>

          </div>

          <div class="row">
            <div class="values">
              <mwc-formfield .label=${"Header"}>
                <mwc-switch
                  .checked=${this._header !== false}
                  .configValue=${'show_header'}
                  @change=${this._valueChanged}
                ></mwc-switch>
              </mwc-formfield>
            </div>

            <div class="values">
              <mwc-formfield .label=${"Status"}>
                <mwc-switch
                  .checked=${this._status !== false}
                  .configValue=${'show_status'}
                  @change=${this._valueChanged}
                ></mwc-switch>
              </mwc-formfield>
            </div>

            <div class="values">
              <mwc-formfield .label=${"Attributes"}>
                <mwc-switch
                  .checked=${this._attributes !== false}
                  .configValue=${'show_attributes'}
                  @change=${this._valueChanged}
                ></mwc-switch>
              </mwc-formfield>
            </div>


            <div class="values">
              <mwc-formfield .label=${"Buttons"}>
                <mwc-switch
                  .checked=${this._buttons !== false}
                  .configValue=${'show_buttons'}
                  @change=${this._valueChanged}
                ></mwc-switch>
              </mwc-formfield>
            </div>
          </div>
            </div>
            `
          : ''}
    `;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  private async getDeviceDetails(hass, deviceId): Promise<DeviceRegistryEntry> {
      const devices: DeviceRegistryEntry[] = await hass.callWS({
        type: 'config/device_registry/list',
      });
      const device: DeviceRegistryEntry[] = filterDevice(devices, deviceId)
      return device[0] //there should always be only one device with that ID, so just select first in array
  }

  private async _valueChanged(ev): Promise<void> {
    if (!this._config || !this.hass) {
      return;
    }

    const target = ev.target;
    // console.log("Update target: " + target.configValue);
    const value = ev.detail?.value ?? target.value;
    // console.log("Update value: " + value);
    if (target.configValue) {
      if (value === '') {
        delete this._config[target.configValue];
      } else {
        if (target.configValue === 'device_id') {
          const device = await this.getDeviceDetails(this.hass, value);
          this._config = {
            ...this._config,
            "device_name": device.name_by_user ? device.name_by_user?.replace(/ |-/g,"_").toLowerCase() : device.name?.replace(/ |-/g,"_").toLowerCase(),
          };
        }
        this._config = {
          ...this._config,
          "show_header": this._config.show_header != false,
          "show_status": this._config.show_status != false,
          "show_attributes": this._config.show_attributes != false,
          "show_buttons": this._config.show_buttons != false,
          [target.configValue]: target.checked !== undefined ? target.checked : value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResult {
    return css`
    mwc-select,
     mwc-textfield {
       margin-bottom: 16px;
       display: block;
     }
     mwc-formfield {
       padding-top: 12px;
       padding-bottom: 8px;
     }
     mwc-switch {
       --mdc-theme-secondary: var(--switch-checked-color);
     }
      .option {
        padding: 4px 0px;
        cursor: pointer;
      }
      .row {
        display: flex;
        margin-bottom: -14px;
        pointer-events: none;
      }
      .title {
        padding-left: 16px;
        padding-bottom: 12px;
        margin-top: -6px;
        pointer-events: none;
      }
      .secondary {
        padding-left: 40px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .footer {
        padding-left: 0px;
        margin-top: -8px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .values {
        padding-left: 16px;
        padding-right: 12px;
        display: grid;
      }
      ha-formfield {
        padding-bottom: 8px;
      }
    `;
  }
}
