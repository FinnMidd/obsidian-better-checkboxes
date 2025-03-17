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

        containerEl.createEl('h2', { text: 'Cycle Checkbox Plugin Settings' });
        containerEl.createEl('p', { text: 'Drag and drop the cards below to reorder the checkbox characters. The top item will be the first in the cycle.' });

        // Create a container for the draggable list.
        const listContainer = containerEl.createDiv({ cls: 'checkbox-char-list' });
        this.renderList(listContainer);

        // Add button to create a new character card.
        const addButton = containerEl.createEl('button', { text: 'Add New Character' });
        addButton.style.marginTop = '10px';
        addButton.onclick = () => {
            this.plugin.settings.basicCheckboxChars.push(' ');
            this.plugin.saveSettings();
            this.renderList(listContainer);
        };
    }

    renderList(listContainer) {
        listContainer.empty();
        const chars = this.plugin.settings.basicCheckboxChars;

        chars.forEach((char, index) => {
            // Create a container for each draggable card.
            const itemEl = listContainer.createDiv({ cls: 'checkbox-char-item' });
            itemEl.setAttr('draggable', 'true');
            itemEl.setAttr('data-index', index);

            // Create a drag handle.
            const dragHandle = itemEl.createEl('span', { text: '⠿', cls: 'drag-handle' });
            dragHandle.style.cursor = 'move';
            dragHandle.style.marginRight = '8px';

            // Create an input for the character.
            const inputEl = itemEl.createEl('input', { type: 'text', value: char });
            inputEl.style.width = '40px';
            inputEl.style.marginRight = '8px';

            inputEl.onchange = (evt) => {
                this.plugin.settings.basicCheckboxChars[index] = evt.target.value;
                this.plugin.saveSettings();
            };

            // Create a remove button.
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