const { Plugin, PluginSettingTab, Setting } = require('obsidian');

class CycleCheckboxSettings {
    // Define the checkbox characters in data.json (or default here)
    basicCheckboxChars = [' ', '/', 'x', '-', '>', '<'];
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

    // Load settings from data.json; use defaults if not set.
    async loadSettings() {
        this.settings = Object.assign(new CycleCheckboxSettings(), await this.loadData());
    }

    // Save settings to data.json
    async saveSettings() {
        await this.saveData(this.settings);
    }

    // Main function to cycle the checkbox state
    cycleCheckbox(editor) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Retrieve the checkbox characters from settings (stored in data.json)
        const checkboxChars = this.settings.basicCheckboxChars;

        // Define regex to match any checkbox at the start of the line
        const checkboxRegex = /^- \[(.)\] ?(.*)/;

        // Check if line starts with a checkbox
        const match = line.match(checkboxRegex);
        let updatedLine;

        // If there is a match, update the checkbox state
        // Else, add a new checkbox at the start of the line
        if (match) {
            const currentChar = match[1];   // Character inside the brackets
            const restOfLine = match[2];    // Rest of the line after the checkbox

            if (checkboxChars.includes(currentChar)) {
                // Get next character
                let currentIndex = checkboxChars.indexOf(currentChar);
                let nextIndex = (currentIndex + 1) % checkboxChars.length;
                let nextChar = checkboxChars[nextIndex];
                let nextState = `- [${nextChar}]`;

                // Build updated line
                updatedLine = `${nextState} ${restOfLine}`;
            } else {
                // Unknown character, replace with '- [ ]'
                updatedLine = `- [ ] ${restOfLine}`;
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

        containerEl.createEl('p', {
            text: 'The checkbox characters are defined in data.json.'
        });
    }
}