/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  CSSResult,
  TemplateResult,
  css,
  PropertyValues,
} from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types

import './editor';
import { icons, defaultImage } from './icons'

import type { ParcelBoxCardConfig, EntityList, LovelaceRowConfig } from './types';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import { entitiesColl } from 'home-assistant-js-websocket';

/* eslint no-console: 0 */
console.info(
  `%c  IPARCELBOX-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

const NAMESPACE = 'iparcelbox';

async function getIcon(name): Promise<any> {
  let svgDef = icons[name];
  let primaryPath = '0 0 32 32';
  if (svgDef != '') {
    primaryPath = svgDef[4];
  } else {
    svgDef = icons['unknown'];
  }
  return {
    path: primaryPath,
    viewBox: svgDef[0] + " " + svgDef[1] + " " + svgDef[2] + " " + svgDef[3]
  };

}

(window as any).customIconsets = (window as any).customIconsets || {};
(window as any).customIconsets[NAMESPACE] = getIcon;



(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'iparcelbox-card',
  name: 'iParcelBox Card',
  description: 'A custom card for the iParcelBox smart parcel delivery box integration',
});


// (window as any).IParcelboxCache = (window as any).IParcelboxCache ?? {};
// const cache = (window as any).IParcelboxCache;

// async function getDevices(hass) {
//   cache.devices =
//     cache.devices ??
//     (await hass.callWS({ type: "config/device_registry/list" }));
//   return cache.devices;
// }

const header = {
  boxStatus: {
    type: 'sensor',
    key: 'boxstatus',
    Locked: {
      icon: 'mdi:lock',
      label: 'Ready for delivery'
    },
    allowDelivery: {
      icon: 'mdi:lock-open',
      label: 'Accepting Delivery'
    },
    allowCollection: {
      icon: 'mdi:lock-open',
      label: 'Accepting Collection'
    },
    tokenDelivery: {
      icon: 'mdi:lock-open',
      label: 'Auto-Delivery'
    },
    Disabled: {
      icon: 'mdi:lock-open',
      label: 'Disabled'
    },
    Clearing: {
      icon: 'mdi:lock-open',
      label: 'Emptying Box'
    },
    deliveryRequested: {
      icon: 'mdi:lock-open',
      label: 'Delivery Requested'
    },
    reboot: {
      icon: 'mdi:lock-open',
      label: 'Rebooting Box...'
    },
    Error: {
      icon: 'mdi:lock-open',
      label: 'ERROR: LID OPEN!!     '
    },
    unknown: {
      icon: 'iparcelbox:icon',
      label: 'Unable to retrieve status'
    },
    unavailable: {
      icon: 'iparcelbox:icon',
      label: 'Unable to retrieve status'
    }
  },
};

const status = {
  parcelCount: {
    key: 'parcelcount',
    type: 'sensor',
    label: 'Parcel Count: ',
    icon: 'mdi:mailbox-up'
  },
  lockStatus: {
    type: 'binary_sensor',
    key: 'lockstatus',
    locked: {
      icon: 'mdi:lock',
      label: 'Locked',
      color: 'green',
    },
    unlocked: {
      icon: 'mdi:lock-open',
      label: 'Unlocked',
      color: 'red',
    },
    unknown: {
      icon: 'iparcelbox:unknown',
      label: 'Unknown',
      color: 'red'
    }
  },
  lidStatus: {
    type: 'binary_sensor',
    key: 'lidstatus',
    open: {
      icon: 'iparcelbox:chestopen',
      label: 'Open',
      color: 'red'
    },
    closed: {
      icon: 'iparcelbox:chest',
      label: 'Closed',
      color: 'green'
    },
    unknown: {
      icon: 'iparcelbox:unknown',
      label: 'Unknown',
      color: 'red'
    }
  },
};

const attributes = {
  left: {

  },
  right: {
    lastOpened: {
      type: 'sensor',
      key: 'lastopened',
      icon: 'iparcelbox:chestopen'
    },
    routerRSSI: {
      type: 'sensor',
      key: 'routerssid',
      icon: 'mdi:wifi-arrow-up-down',
      type2: 'sensor',
      key2: 'routerrssi',
      unit2: '%'

    },
    battery: {
      type: 'sensor',
      key: 'battery',
      unit: '%',
      icon: 'hass:battery-80',
      type2: 'binary_sensor',
      key2: 'charging'

    },
    asleep: {
      type: 'binary_sensor',
      key: 'asleep',
      icon: 'mdi:sleep',
    }
  }
};

const buttons = {
  allowDelivery: {
    label: 'Allow Delivery',
    icon: 'iparcelbox:allowDelivery',
    service: 'lock.unlock',
    key: 'allowDelivery'
  },
  emptyBox: {
    label: 'Empty Box',
    icon: 'mdi:lock-open',
    service: 'lock.open',
    key: 'emptyBox'
  },
  lockBox: {
    label: 'Lock Box',
    icon: 'mdi:lock',
    service: 'lock.lock',
    key: 'lockBox'
  }
}

@customElement('iparcelbox-card')
export class IParcelBoxCard extends LitElement {

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('boilerplate-card-editor');
  }

  public static getStubConfig(): object {
    return {};
  }


  @property({ attribute: false }) public _hass!: HomeAssistant;
  @state() private config!: ParcelBoxCardConfig;
  @property() stateObj;
  @property() isAsleep;
  @state() private buttonTimeout: any;


  static get styles(): CSSResult {
    return css`

    .background {
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
    }
    .title {
    font-size: 16px;
    padding: 12px 16px 0px;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    }
    .header {
    font-size: 24px;
    padding: 16px 16px 6px;
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    }
    .flex {
    display: flex;
    padding: 0px 16px 16px;
    align-items: center;
    justify-content: space-evenly;
    cursor: pointer;
    vertical-align: top;
    }
    .buttons {
    display: flex;
    padding: 5px 16px 8px;
    align-items: center;
    justify-content: space-evenly;
    }
    .status {
    font-size: 90%;
    padding: 10px 16px 8px;
    text-align: center;
    }
    .statusIcon ha-label-badge {
    font-size: 55%;
    }
    .statusText {
      font-size: 16px;
      padding-top: 6px;
      padding-bottom: 10px;
      display:inline-block;
    }
    .grid {
    display: grid;
    grid-template-columns: repeat(2, auto);
    cursor: default;
    }
    .grid-content {
    display: grid;
    align-content: baseline;
    grid-row-gap: 6px;
    }
    .grid-left {
    text-align: left;
    font-size: 110%;
    padding-left: 10px;
    border-left: 1px solid #EE7203;
    }
    .grid-right {
    text-align: right;
    padding-right: 10px;
    border-right: 1px solid #EE7203;
    }
    .red ha-label-badge {
         --ha-label-badge-color: var(--label-badge-red, #CB4A39);
         --label-badge-background-color: var(--label-badge-red, #CB4A39);
         --label-badge-text-color: white;
      }
     .green  ha-label-badge{
        --ha-icon-color: #28925D;
        --ha-label-badge-color: var(--label-badge-green, #28925D);
        --label-badge-background-color: var(--label-badge-green, #28925D);
        --label-badge-text-color: white;

    }
    .button  ha-label-badge{
        --label-badge-background-color: #043454;
        --label-badge-text-color: white;
        --ha-label-badge-color: #afc0c9;
        --ha-label-badge-title-width: 120px;
        --ha-label-badge-title-font-weight: 500
        cursor: default;
    }
    .button:hover  ha-label-badge{
      --label-badge-background-color: #2A5F83;
        --label-badge-text-color: white;
        --ha-label-badge-color: #afc0c9;
        /* --ha-label-badge-color: #043454; */
        --ha-label-badge-title-width: 120px;
        --ha-label-badge-title-font-weight: 600
    }
    .active  ha-label-badge{
      cursor: wait;
      --label-badge-background-color: green;
        --label-badge-text-color: white;
        --ha-label-badge-color: #EE7203;
        --ha-label-badge-title-width: 120px;
        --ha-label-badge-title-font-weight: 500
    }
    .hidden {
      display:none;
    }
    `
     ;
   }

  public setConfig(config: ParcelBoxCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config.device_name) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      // name: config.name,
      // entity: config.entity,
      show: {
          name: config.name ? true : false ,
          header: config.show_header != false,
          status: config.show_status != false,
          attributes: config.show_attributes != false,
          buttons: config.show_buttons != false,
      },
      header: header,
      status: status,
      attributes: attributes,
      buttons: buttons,
      styles: {
        background: config.image == 'none' ? 'color: var(--primary-text-color)  ' : config.image ? `background-image: url('${config.image}'); color: white; text - shadow: 0 0 10px black;` : `background-image: url('${defaultImage}'); color: white; text - shadow: 0 0 10px black;`,
        icon: `color: ${config.image == 'none' ? 'var(--paper-item-icon-color)' : 'white'};`,
        content: `padding: ${config.name ? '8px' : '16px'} 16px ${config.buttons !== false ? '8px' : '16px'};`,
      },
      ...config,
    };
    // console.log("config: " + JSON.stringify(this.config))
    this.getEntities();
  }

  getEntities(): any {
    const newEntities: EntityList = [];
    const deviceId = this.config.device_name;
    // console.log("Got Device ID: " + deviceId);
    // const mac = deviceId //.split("-")[1]

    const e = {
      type: "sensor",
      entity: "sensor." + deviceId + "_boxstatus"
    }
    newEntities.push(e);

    Object.keys(this.config.status).forEach(key => {
      const e = {
        type: this.config.status[key]["type"],
        entity: this.config.status[key]["type"] + "." + deviceId + "_" + this.config.status[key]["key"],
      };
      newEntities.push(e)
    });

    if (this.config.show.attributes) {
      Object.keys(this.config.attributes.right).forEach(key => {
        const e = {
          type: this.config.attributes.right[key]["type"],
          entity: this.config.attributes.right[key]["type"] + "." + deviceId + "_" + this.config.attributes.right[key]["key"],
        };
        newEntities.push(e)
      });
    }
    this.config.entities = newEntities;
  }



  set hass(hass) {
    const deviceId = this.config.device_name;
    // const mac = deviceId.split("-")
    // const statusSensor = "sensor.iparcelbox_" + mac[1] + "_boxstatus"

    const statusSensor = "sensor." + deviceId + "_boxstatus"

    if (hass && this.config) {
        this.stateObj = statusSensor in hass.states ? hass.states[statusSensor] : null;
    }
    this._hass = hass;

}


  callService(service, key, data = { 'device_id': this.config.device_id }): void {
    // console.log("Call service: " + this.config.device_id);
    this.activeButton(key);
    const [domain, name] = service.split('.');
    this._hass.callService(domain, name, data);
}

  activeButton(x): any {
    Object.keys(this.config.buttons).forEach(key => {
      if (key == x) {
        this.setClass(key, 'active');
      } else {
        this.setClass(key, 'button');
      }
    });
    this.buttonTimeout = setTimeout(this.clearButtons.bind(null, this), 10000);
  }


  clearButtons(x): any {
    Object.keys(x.config.buttons).forEach(key => {
        x.setClass(key, 'button');
    });
  }


  setClass(x, y): any {
    // console.log("Setting class of " + x + " to " + y)
    const element = this.shadowRoot?.querySelector('#' + x);
    if (element) {
      element!.className = y;
    }
    // } else {
    //   console.log("element #" + x + " not found.");
    // }
  }
  // https://lit-element.polymer-project.org/guide/lifecycle#shouldupdate
  protected shouldUpdate(changedProps): boolean {

    if (!this.config) {
      return false;
    }

    if (changedProps.has('stateObj')) {
      // console.log("Found status update")
      clearTimeout(this.buttonTimeout);
      Object.keys(this.config.buttons).forEach(key => {
        this.setClass(key, 'button');
      });
      // console.log("Clearing buttonTimeout");
    }

  return true;

  }

   // https://lit-element.polymer-project.org/guide/templates
  protected render(): TemplateResult | void {
    // console.log("State: " + JSON.stringify(this.config.state))
    // this.clearButtons(this);

    return html`

      <ha-card
        class="background"
        @action=${this._handleAction}
        style="${this.config.styles.background}"
      >
      ${this.config.show.name ?
                html`<div class="title">${this.config.name}</div>`
      : null}

      ${this.config.show.header ? html`
      <div class="header">${Object.values(this.config.header).filter(v => v).map(this.renderLabel.bind(this))}</div>
      ` : null}

      <div class="grid" style="${this.config.styles.content}">
      ${this.config.show.status ? html`
      <div class="grid-content grid-left">${Object.values(this.config.status).filter(v => v).map(this.renderStatus.bind(this))}</div>
      ` : null}
      ${this.config.show.attributes ? html`
      <div class="grid-content grid-right">${Object.values(this.config.attributes.right).filter(v => v).map(this.renderAttribute.bind(this))}</div>
      ` : null}

      </div>


      ${this.config.show.buttons ? html`
      <div id="buttons" class="flex ${this.isAsleep ? 'hidden' : ''}">
        ${Object.values(this.config.buttons).filter(v => v).map(this.renderButton.bind(this))}
      </div>
      <div id="nobuttons" class="flex status ${this.isAsleep ? '' : 'hidden'}">
        Action butons not available when box is sleeping.<br>Press the box button on your iParcelBox to wake it up.
      </div>

      ` : null}

      </ha-card>
    `;
  }


  // https://lit-element.polymer-project.org/guide/styles
  renderLabel(data): any {
    // console.log("RenderLabel: " + JSON.stringify(data))
    const deviceId = this.config.device_name;
    // const mac = deviceId.split("-")
    const sensor = data.type + "." + deviceId + "_" + data.key
    // console.log("Render label for sensor: " + sensor);
    const value = this._hass.states[sensor].state
    // console.log("Label: " + sensor + " (" + value + ")")
    // console.log("LabelData: " + JSON.stringify(this._hass.states[sensor]))

    const attribute = html`<div>${(data[value].label || '')}</div>`;

    return attribute
  }

  // https://lit-element.polymer-project.org/guide/styles
  renderAttribute(data): any {
    // console.log("RenderAttribute: " + JSON.stringify(data))
    const deviceId = this.config.device_name;
    // const mac = deviceId.split("-")
    const sensor = data.type + "." + deviceId + "_" + data.key
    const sensor2 = data.key2 ? data.type2 + "." + deviceId + "_" + data.key2 : null
    const isBattery = data.key == 'battery' ? true : false
    const isSleep = data.key == 'asleep' ? true : false

    // CALCULATE ICON
    let icontype = ""
    if (isBattery) {
      icontype = "mdi:battery"
      const batteryLevel = Math.ceil((parseInt(this._hass.states[sensor].state))/10)*10;
      // const isCharging = this._hass.states[sensor2].state == 'On' ? 'Charging' : ''

      if (sensor2) {
        icontype += this._hass.states[sensor2].state == 'On' ? '-charging' : '';
      }
      // console.log("Battery Level: " + batteryLevel);
      if (batteryLevel < 100) {
        icontype += '-' + batteryLevel
      }
      if (this._hass.states[sensor].state == 'Not installed') {
        icontype = "mdi:battery-off"
      }
    }
    if (isSleep) {
      icontype = "mdi:sleep"

      if (this._hass.states[sensor].state == 'False') {
        // icontype += "-off"
        icontype=""
      }
    }
    // console.log("Icon: " + icontype)

    let attribute = html`<div>${data.icon && this.renderIcon(data)}${(data.label || '') + this._hass.states[sensor].state + (data.unit || '')}</div>`;
    if (isBattery) {
        this._hass.states[sensor].state != 'Not installed' ?
          attribute = html`<div>${data.icon && this.renderBatteryIcon(icontype)}${(data.label || '') + this._hass.states[sensor].state + (data.unit || '')}</div>`
          :
          attribute = html``
    } else if (data.key == 'asleep') {
      if (this._hass.states[sensor].state == 'True') {
        this.isAsleep = true;

        attribute = html`<div>${data.icon && this.renderBatteryIcon(icontype)}${(data.label || '') + 'Asleep'}</div>`
      } else {
        this.isAsleep = false;
        attribute = html``
      }

    } else if (sensor2) {
      attribute = html`<div>${data.icon && this.renderIcon(data)}${(data.label || '') + this._hass.states[sensor].state + (data.unit || '') + ' (' + this._hass.states[sensor2].state + (data.unit2 || '') + ')'}</div>`;
    }

    return attribute

  }

  private _handleAction(): void {
    console.log("Calling handle action");
    // if (this.hass && this.config && ev.detail.action) {
    //   handleAction(this, this.hass, this.config, ev.detail.action);
    // }
  }

  renderStatus(data): any {
    const deviceId = this.config.device_name;
    // const mac = deviceId.split("-")[1]
    // const sensorId = data.type + ".iparcelbox_" + mac + "_" + data.key

    const sensorId = data.type + "." + deviceId + "_" + data.key

    const computeFunc = data.compute || (v => v);

    const value = computeFunc(this._hass.states[sensorId].state + (data.unit || ''));
    const statusOptions = (data[this._hass.states[sensorId].state] ? true : false)


    const status = statusOptions ?
      html`<div class="${data[this._hass.states[sensorId].state].color}">${data[this._hass.states[sensorId].state].icon && this.renderStatusIcon(data[this._hass.states[sensorId].state])}<span class="statusText">${data[this._hass.states[sensorId].state].label}</span></div>`
      :
      data.key == 'parcelcount' ?
        html`<div class="${value == 0 ? 'green' : 'red'}">${data.icon && this.renderStatusIcon(data)}<span class="statusText">${value} ${value == 1 ? `parcel` : `parcels`}</span></div>`
        :
        html`<div>${data.icon && this.renderStatusIcon(data)}<span class="statusText">${(data.label || '') + value}</span></div>`
    return status
    }


  renderIcon(data): any {
    const icon = data.icon;
      return html`<ha-icon icon="${icon}" style="margin-right: 5px; ${this.config.styles.icon}"></ha-icon>`;
  }

  renderBatteryIcon(icontype): any {
    const icon = icontype;
      return html`<ha-icon icon="${icon}" style="margin-right: 5px; ${this.config.styles.icon}"></ha-icon>`;
  }

  renderStatusIcon(data): any {
      return html`<span class="statusIcon"><ha-label-badge
                   style="margin-right: 5px;  ${this.config.styles.icon}"
                   >
                   <ha-icon icon="${data.icon}"></ha-icon>
                   </ha-label-badge></span>`;
  }


  renderButton(data): any {
    // console.log("Button data: " + data.key + " " + data.service);
    return data && data.show !== false
      ? html`<div class="button" id="${data.key}"><ha-label-badge
            @click="${() => this.callService(data.service, data.key)}"
            description="${data.label || ''}"
            style="${this.config.styles.icon}">
            <ha-icon icon="${data.icon}"></ha-icon>
  </ha-label-badge></div>`
        : null;
  }
  //




  getCardSize(): number {
    if (this.config.show.name && this.config.show.buttons) return 4;
    if (this.config.show.name || this.config.show.buttons) return 3;
    return 2;
  }

}
