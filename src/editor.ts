/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult,
  CSSResult,
  css,
  internalProperty,
} from 'lit-element';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';
import { ParcelBoxCardConfig } from './types';

import { DeviceRegistryEntry, filterDevice } from './device_helper';

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
export class BoilerplateCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @internalProperty() private _config?: ParcelBoxCardConfig;
  @internalProperty() private _toggle?: boolean;
  @internalProperty() private _helpers?: any;
  private _initialized = false;

  public setConfig(config: ParcelBoxCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
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

    const selector = { device: { integration: 'iparcelbox' } };

    return html`
      <div class="card-config">
        <div class="option" .option=${'required'}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.required.icon}`}></ha-icon>
            <div class="title">${options.required.name}</div>
          </div>
          <div class="secondary">${options.required.secondary}</div>
        </div>
        ${options.required.show
          ? html`
              <div class="values">
              <ha-selector-device
                label="Device (Required)"
                .value=${this._device_id}
                @value-changed=${this._valueChanged}
                .selector=${selector}
                .hass=${this.hass}
                .configValue=${'device_id'}
            ></ha-selector-device>

              </div>
              <div class="values">
                <paper-input
                  label="Name (Optional)"
                  .value=${this._name}
                  .configValue=${'name'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
              </div>


              <div class="values">
                <paper-input
                  label="Background Image File (Optional)"
                  .value=${this._image}
                  .configValue=${'image'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <div class="footer">${options.required.footer}</div>

              </div>

              <div class="row">
              <div class="values">
                <ha-selector-boolean
                label="Header"
                .value=${this._header}
                @value-changed=${this._valueChanged}
                .configValue=${'show_header'}></ha-selector-boolean></div>

                <div class="values">
                <ha-selector-boolean
                label="Status"
                .value=${this._status}
                @value-changed=${this._valueChanged}
                .configValue=${'show_status'}></ha-selector-boolean></div>

                <div class="values">
                <ha-selector-boolean
                label="Attributes"
                .value=${this._attributes}
                @value-changed=${this._valueChanged}
                .configValue=${'show_attributes'}></ha-selector-boolean></div>

                <div class="values">
                <ha-selector-boolean
                label="Buttons"
                .value=${this._buttons}
                @value-changed=${this._valueChanged}
                .configValue=${'show_buttons'}></ha-selector-boolean></div>
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
            "device_name": device.name,
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
