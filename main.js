const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

class BetterCheckboxSettings {
    // Define the checkbox characters in data.json (or default here)
    basicCheckboxChars = ['/', 'x', '-', '>', '<'];
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
        this.addSettingTab(new BetterCheckboxSettingTab(this.app, this));
    }

    // Load settings from data.json; use defaults if not set.
    async loadSettings() {
        this.settings = Object.assign(new BetterCheckboxSettings(), await this.loadData());
    }

    // Save settings to data.json
    async saveSettings() {
        await this.saveData(this.settings);
    }

    // Main function to cycle the checkbox state
    cycleCheckbox(editor) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        // Build full cycle options, with blank as the first state.
        const cycleOptions = [' '].concat(this.settings.basicCheckboxChars);

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

            if (cycleOptions.includes(currentChar)) {
                // Get next character
                let currentIndex = cycleOptions.indexOf(currentChar);
                let nextIndex = (currentIndex + 1) % cycleOptions.length;
                let nextChar = cycleOptions[nextIndex];
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

class BetterCheckboxSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        // Store the list container so that it isn’t duplicated
        this.listContainer = null;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Better Checkbox Plugin Settings' });
        containerEl.createEl('p', { text: 'Create your own checkbox characters. Drag and drop the cards below to reorder them in the cycle!' });

        // Create or reattach the list container.
        if (!this.listContainer) {
            this.listContainer = containerEl.createDiv({ cls: 'checkbox-char-list' });
        } else {
            containerEl.appendChild(this.listContainer);
        }
        this.renderList(this.listContainer);

        // Add button to create a new character card.
        const addButton = containerEl.createEl('button', { text: 'Add New Character' });
        addButton.style.marginTop = '10px';
        addButton.onclick = () => {
            this.plugin.settings.basicCheckboxChars.push(' ');
            this.plugin.saveSettings();
            this.renderList(this.listContainer);
        };

        // Add a Save Settings button that saves settings and closes the tab.
        const saveButton = containerEl.createEl('button', { text: 'Save Settings', cls: 'mod-cta' });
        saveButton.style.marginTop = '10px';
        saveButton.onclick = async () => {
            await this.plugin.saveSettings();
            new Notice('Settings saved.');
            // Attempt to close the settings tab.
            if (this.app.setting && typeof this.app.setting.close === 'function') {
                this.app.setting.close();
            }
        };
    }

    renderList(listContainer) {
        listContainer.empty();
        const chars = this.plugin.settings.basicCheckboxChars;

        chars.forEach((char, index) => {
            // Create a draggable card for each character.
            const itemEl = listContainer.createDiv({ cls: 'checkbox-char-item' });
            itemEl.setAttr('draggable', 'true');
            itemEl.setAttr('data-index', index);

            // Drag handle.
            const dragHandle = itemEl.createEl('span', { text: '⠿', cls: 'drag-handle' });
            dragHandle.style.cursor = 'move';
            dragHandle.style.marginRight = '8px';

            // Input for the character.
            const inputEl = itemEl.createEl('input', { type: 'text', value: char });
            inputEl.style.width = '40px';
            inputEl.style.marginRight = '8px';
            inputEl.maxLength = 1;                      // Restrict input to 1 character.
            inputEl.onchange = (evt) => {
                const newValue = evt.target.value;
                // Do not allow blank input.
                if(newValue === ''){
                    evt.target.value = char;
                    new Notice('Blank values are not allowed.');
                    return;
                }
                this.plugin.settings.basicCheckboxChars[index] = newValue;
                this.plugin.saveSettings();
            };

            // Remove button.
            const removeButton = itemEl.createEl('button', { text: 'Remove', cls: 'remove-btn' });
            removeButton.style.marginLeft = 'auto';
            removeButton.onclick = () => {
                this.plugin.settings.basicCheckboxChars.splice(index, 1);
                this.plugin.saveSettings();
                this.renderList(listContainer);
            };

            // Drag events.
            itemEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
                itemEl.classList.add('dragging');
            });

            itemEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            itemEl.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const targetIndex = parseInt(itemEl.getAttribute('data-index'));
                if (draggedIndex === targetIndex) return;

                // Reorder the array.
                const movedItem = this.plugin.settings.basicCheckboxChars.splice(draggedIndex, 1)[0];
                this.plugin.settings.basicCheckboxChars.splice(targetIndex, 0, movedItem);
                this.plugin.saveSettings();
                this.renderList(listContainer);
            });

            itemEl.addEventListener('dragend', () => {
                itemEl.classList.remove('dragging');
            });
        });
    }
}