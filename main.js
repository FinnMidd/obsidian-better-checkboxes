const { Plugin, PluginSettingTab, Setting } = require('obsidian');

class CycleCheckboxSettings {
    useAllCheckboxChars = false;
}

module.exports = class CycleCheckboxPlugin extends Plugin {
    async onload() {
        await this.loadSettings();

        // Register the command
        this.addCommand({
        id: 'cycle-checkbox',
        name: 'Cycle Checkbox State',
        editorCallback: (editor, view) => {
            this.cycleCheckbox(editor);
        }
        });

        // Add the settings tab
        this.addSettingTab(new CycleCheckboxSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign(new CycleCheckboxSettings(), await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    cycleCheckbox(editor) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Define the checkbox characters based on the settings
        const basicCheckboxChars = [' ', '/', 'x', '-', '>', '<'];
        const extraCheckboxChars = ['?', '!', '*', '"', 'l', 'b', 'i', 'S', 'I', 'p', 'c', 'f', 'k', 'w', 'u', 'd', 'D', 'P', 'M'];

        // Concatenate based on settings
        const checkboxChars = this.settings.useAllCheckboxChars
            ? basicCheckboxChars.concat(extraCheckboxChars)
            : basicCheckboxChars;

        // Define regex to match any checkbox at the start of the line
        const checkboxRegex = /^- \[(.)\] ?(.*)/;

        // Check if line starts with a checkbox
        const match = line.match(checkboxRegex);
        let updatedLine;

        if (match) {
            const currentChar = match[1]; // Character inside the brackets
            const restOfLine = match[2]; // Rest of the line after the checkbox

            if (checkboxChars.includes(currentChar)) {
                // Get next character
                let currentIndex = checkboxChars.indexOf(currentChar);
                let nextIndex = (currentIndex + 1) % checkboxChars.length;
                let nextChar = checkboxChars[nextIndex];
                let nextState = `- [${nextChar}]`;

                // Build updated line
                updatedLine = `${nextState} ${restOfLine}`.trim();
            } else {
                // Unknown character, replace with '- [ ]'
                updatedLine = `- [ ] ${restOfLine}`.trim();
            }
        } else {
            // No checkbox, add '- [ ]' at the start
            updatedLine = `- [ ] ${line}`;
        }

        // Apply the update to the editor
        editor.setLine(cursor.line, updatedLine);

        // Move the cursor to the end of the line, after the updated text
        const newCursorPos = { line: cursor.line, ch: updatedLine.length };
        editor.setCursor(newCursorPos);
    }
};

class CycleCheckboxSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Cycle Checkbox Plugin Settings' });

        new Setting(containerEl)
            .setName('Use All Checkbox Characters')
            .setDesc('When enabled, cycles through all checkbox characters.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useAllCheckboxChars)
                .onChange(async (value) => {
                    this.plugin.settings.useAllCheckboxChars = value;
                    await this.plugin.saveSettings();
                }));
    }
}