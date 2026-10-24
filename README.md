[README_EN.md](https://github.com/user-attachments/files/33900979/README_EN.md)
# 1 in 8 Billion — Birthplace Picker

A userscript for [1in8b.life](https://1in8b.life/) that lets you manually choose the country where your character begins life, instead of letting the game select a country based on statistics.

> **Note:** This is an unofficial, community-created tool. It is not affiliated with or endorsed by 1in8b.life. Changes to the original website may require updates to the userscript.

## Quick Installation

### Step 1 — Install Tampermonkey

Tampermonkey is a browser extension for managing userscripts. Install it from your browser's official extension store:

- [Chrome / Chromium](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/)

### Step 2 — Install the Userscript

1. Make sure Tampermonkey is enabled.
2. Open the direct installation link below:

   **[Install 1in8b — Birthplace Picker](https://raw.githubusercontent.com/Raiiito/1in8b-birth-picker/main/1in8b-birth-picker.user.js)**

3. On the Tampermonkey page that opens, review the script name and click **Install**.

### Step 3 — Use the Script

1. Open [1in8b.life](https://1in8b.life/).
2. If the page was already open, reload it. If necessary, press `Ctrl + F5` to perform a hard refresh.
3. Click the **🌍 Birthplace** button in the bottom-left corner.
4. Search by country name or three-letter ISO code, such as `VNM`.
5. Select a country. Your choice is saved in the browser and applied the next time you start a life.
6. To return to random selection, open the picker and choose **🎲 Random (default)**.

## Usage Notes

- The birthplace choice is saved in the page's `localStorage` under the key `bornpicker.iso`. This data stays in the current browser.
- The picker only forces the country for your main character. Characters used for comparison continue to follow the game's normal logic.
- When entering a class code in education mode, the script does not force a country, to avoid skewing the class's overall results.
- The script hooks into JavaScript functions on the running page. If the developers of 1in8b.life change the site's code, the script may stop working until it is updated.

## Troubleshooting

**The “Birthplace” button is missing**

1. Make sure Tampermonkey is enabled.
2. Open Tampermonkey and make sure the `1 in 8 Billion — Birthplace Picker` script is enabled.
3. Reload the page using `Ctrl + F5`.
4. Try disabling and re-enabling the script, then reload the page.

**The button displays “not connected”**

This means the script could not find the game's internal functions or data. Reload the page and try again. If the problem persists, the game's code may have changed. Open [Issues](https://github.com/Raiiito/1in8b-birth-picker/issues) and provide details about the error (do not post personal information).

**Check the script using the Console**

Open DevTools by pressing `F12`, select the **Console** tab, and run these commands:

```js
bornPicker.get();       // View the currently selected country code
bornPicker.set('VNM');  // Select Vietnam
bornPicker.set('');     // Return to random mode
bornPicker.list();      // View the list of countries
bornPicker.hooked;      // Check whether the script has connected to the game
```

## Updates

The userscript defines `@updateURL` and `@downloadURL` pointing to the version on the `main` branch. To release an update:

1. Edit `1in8b-birth-picker.user.js` in the repository.
2. Increase the `@version` value in the `==UserScript==` metadata block (for example, `1.0.0` → `1.0.1`).
3. Commit the changes. Tampermonkey will check for updates according to its schedule and your browser settings. You can also check manually in the Tampermonkey dashboard.

## Source Code

- Repository: [Raiiito/1in8b-birth-picker](https://github.com/Raiiito/1in8b-birth-picker)
- Userscript: [1in8b-birth-picker.user.js](https://github.com/Raiiito/1in8b-birth-picker/blob/main/1in8b-birth-picker.user.js)
- Installation link: [Raw userscript](https://raw.githubusercontent.com/Raiiito/1in8b-birth-picker/main/1in8b-birth-picker.user.js)
