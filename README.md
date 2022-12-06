# iParcelBox Card by [@gadget-man](https://www.github.com/gadget-man)

[![GH-release](https://img.shields.io/github/v/release/gadget-man/iparcelbox-card.svg?style=plastic)](https://github.com/gadget-man/iparcelbox-card/releases)
[![GH-downloads](https://img.shields.io/github/downloads/gadget-man/iparcelbox-card/total?style=plastic)](https://github.com/gadget-man/iparcelbox-card/releases)
[![GH-last-commit](https://img.shields.io/github/last-commit/gadget-man/iparcelbox-card.svg?style=plastic)](https://github.com/gadget-man/iparcelbox-card/commits/master)
[![GH-code-size](https://img.shields.io/github/languages/code-size/gadget-man/iparcelbox-card.svg?color=red&style=plastic)](https://github.com/gadget-man/iparcelbox-card)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=plastic)](https://github.com/hacs)

<img style="border: 5px solid #767676;border-radius: 10px;max-width: 350px;width: 100%;box-sizing: border-box;" src="https://github.com/gadget-man/iparcelbox-card/blob/master/examples/Screenshot.png" alt="Screenshot">

## Home-Assistant custom-integration

This Lovelace custom card requires the iParcelBox custom integration, available at [https://github.com/gadget-man/iparcelboxHA](https://github.com/gadget-man/iparcelboxHA).

## Install

iParcelBox Card is available from [HACS][hacs] as a custom repository.
In your HA HACS dashboard, select 'Frontend', then select the 3 dots in the top right corner of the screen and choose 'Custom Repositories'.
Enter `https://github.com/gadget-man/iparcelbox-card` and select `Lovelace` as the category.
If you don't have HACS installed, follow the [manual installation](#manual-installation) instructions.

## Configuration is done in the UI

You can configure this custom-card using the UI. Simply select the device from the list and update any of the optional settings.

<img style="border: 5px solid #767676;border-radius: 10px;max-width: 350px;width: 100%;box-sizing: border-box;" src="https://github.com/gadget-man/iparcelbox-card/blob/master/examples/Card_Config.png" alt="Configuration">

Alternatively you can manually add the integration and provide the relevant Device name, Device ID and other settings:

```yaml
type: custom:iparcelbox-card
device_name: iParcelBox-XXXXXXXX
device_id: XXXXXXXX
name: Front Driveway
show_header: true
show_status: true
show_attributes: true
show_buttons: true
image: /hacsfiles/iparcelbox-card/iparcelbox-card.png
```

By default, the custom-card will display a generic background. Select your own background by providing the file path, or enter 'none' in the image field to remove the background image.

## Options

| Name            | Type    | Requirement  | Description                               | Default            |
| --------------- | ------- | ------------ | ----------------------------------------- | ------------------ |
| type            | string  | **Required** | `custom:iparcelbox-card`                  |                    |
| device_name     | string  | **Required** | iParcelBox Integration device name        | `none`             |
| device_id       | string  | **Required** | iParcelBox Integration device ID.         | `none`             |
| name            | string  | **Optional** | Card name - will appear at the top        | `none`             |
| image           | string  | **Optional** | Path to image file - set 'none' for blank | `iParcelBox image` |
| show_header     | boolean | **Optional** | Show boxStatus in header                  | `true`             |
| show_status     | boolean | **Optional** | Show status icons on left                 | `true`             |
| show_attributes | boolean | **Optional** | Show attributes on rigt side              | `true`             |
| show_buttons    | boolean | **Optional** | Show allowDelivery, emptyBox, lockBox     | `true`             |

## iParcelBox Premium Subscription

An iParcelBox Premium subscription is required to connect your iParcelBox device to Home Assistant. More details can be found at https://www.iparcelbox.com/faqs/#premium

## Manual installation

1. Download `iparcelbox-card.js` and `iparcelbox-card.png` from the [latest release][releases] and move these files to a new `config/www/community/iparcelbox-card` folder.
2. Ensure you have advanced mode enabled (accessible via your username in the bottom left corner)
3. Go to Configuration -> Lovelace Dashboards -> Resources.
4. Add `/local/community/iparcelbox-card/iparcelbox-card.js` with type JS module.
5. Refresh the page? Or restart Home Assistant? The card should eventually be there.

## Contributions are welcome!

If you want to contribute to this please read the [Contribution guidelines](CONTRIBUTING.md)

[hacs]: https://hacs.xyz/
