// 源自：https://linux.do/t/topic/213559    油猴脚本 [Claude] Session Key (Token) \ 切换 & 管理
// ==UserScript==
// @name         [Claude] Session Key (Token) \切换&管理/ 20240919.0
// @version      20240919.0
// @description  优雅地 切换&管理 [Claude] Session Key (Token)；在原脚本的基础上，升级了管理界面和功能
// @author       xiaohan17, ethan-j... & 0_V (+ AI assistant)
//
// @match        https://claude.ai/*
// @match        https://claude.asia/*
// @match        https://demo.fuclaude.com/*
//
// @icon         https://claude.ai/favicon.ico
//
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
//
// @connect      ipapi.co
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        storageKey: 'claudeTokens',
        ipApiUrl: 'https://ipapi.co/country_code',
        defaultToken: {
            name: 'Token00',
            key: 'sk-key'
        },
        currentTokenKey: 'currentClaudeToken'
    };

    const theme = {
        light: {
            bgColor: '#fcfaf5',
            textColor: '#333',
            borderColor: '#ccc',
            buttonBg: '#f5f1e9',
            buttonHoverBg: '#e5e1d9',
            modalBg: 'rgba(0, 0, 0, 0.5)'
        },
        dark: {
            bgColor: '#2c2b28',
            textColor: '#f5f4ef',
            borderColor: '#3f3f3c',
            buttonBg: '#3f3f3c',
            buttonHoverBg: '#4a4a47',
            modalBg: 'rgba(0, 0, 0, 0.7)'
        }
    };

    const getStyles = (isDarkMode) => `
        :root {
            --bg-color: ${isDarkMode ? theme.dark.bgColor : theme.light.bgColor};
            --text-color: ${isDarkMode ? theme.dark.textColor : theme.light.textColor};
            --border-color: ${isDarkMode ? theme.dark.borderColor : theme.light.borderColor};
            --button-bg: ${isDarkMode ? theme.dark.buttonBg : theme.light.buttonBg};
            --button-hover-bg: ${isDarkMode ? theme.dark.buttonHoverBg : theme.light.buttonHoverBg};
            --modal-bg: ${isDarkMode ? theme.dark.modalBg : theme.light.modalBg};
        }
        .claude-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--modal-bg);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        .claude-modal-content {
            background-color: var(--bg-color);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            width: 400px;
            max-width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }
        .claude-modal h2 {
            margin-top: 0;
            margin-bottom: 15px;
            color: var(--text-color);
            font-size: 18px;
            font-weight: 600;
        }
        .claude-modal input, .claude-modal textarea, .claude-modal select {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 14px;
            background-color: var(--bg-color);
            color: var(--text-color);
            transition: border-color 0.3s ease;
        }
        .claude-modal input:focus, .claude-modal textarea:focus, .claude-modal select:focus {
            outline: none;
            border-color: #6e6e6e;
        }
        .claude-modal button {
            padding: 10px 16px;
            margin-right: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.1s;
            font-size: 14px;
            font-weight: 500;
        }
        .claude-modal button:active {
            transform: scale(0.98);
        }
        .claude-button-save {
            background-color: #b3462f;
            color: #ffffff;
        }
        .claude-button-save:hover {
            background-color: #a03d2a;
        }
        .claude-button-cancel {
            background-color: var(--button-bg);
            color: var(--text-color);
        }
        .claude-button-cancel:hover {
            background-color: var(--button-hover-bg);
        }
        .claude-button-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .claude-close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--text-color);
            padding: 5px;
            line-height: 1;
        }
        .claude-token-list {
            max-height: 300px;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        .claude-token-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid var(--border-color);
        }
        .claude-token-item:last-child {
            border-bottom: none;
        }
        .claude-add-token-button, .claude-bulk-import-button {
            margin-top: 15px;
            width: 100%;
        }
        #claude-toggle-button {
            position: fixed;
            top: 10px;
            right: 200px;
            z-index: 9998;
            width: 120px;
            height: 36px;
            background-color: transparent;
            border: none;
            border-radius: 0.375rem;
            font-size: 15px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: background-color 0.3s ease, color 0.3s ease;
            color: var(--text-color);
        }
        #claude-toggle-button:hover {
            background-color: var(--button-hover-bg);
        }
        #claude-container {
            position: fixed;
            top: 50px;
            right: 77px;
            z-index: 9999;
            background-color: var(--bg-color);
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: none;
            font-size: 14px;
            width: auto;
        }
        #claude-token-select {
            margin-right: 8px;
            font-size: 14px;
            width: 150px;
            background-color: var(--bg-color);
            color: var(--text-color);
            height: 36px;
            padding: 0 8px;
            line-height: 36px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right 8px center;
            background-size: 12px;
        }
        #claude-switch-button, #claude-manage-button {
            font-size: 14px;
            height: 36px;
            padding: 0 12px;
            line-height: 34px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.1s;
        }
        #claude-switch-button:active, #claude-manage-button:active {
            transform: scale(0.98);
        }
        .claude-preview-container {
            margin-top: 15px;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            background-color: var(--bg-color);
        }
        .claude-preview-title {
            font-size: 16px;
            margin-bottom: 10px;
            color: var(--text-color);
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 5px;
        }
        .claude-preview-item {
            margin-bottom: 8px;
            font-size: 14px;
            padding: 8px;
            border-radius: 4px;
            background-color: var(--button-bg);
        }
        .claude-preview-item:nth-child(even) {
            background-color: var(--button-hover-bg);
        }
        .claude-preview-name {
            font-weight: bold;
            color: #b3462f;
        }
        .claude-preview-key {
            font-family: monospace;
            word-break: break-all;
        }
        .claude-naming-rule {
            display: flex;
            flex-direction: column;
            margin-bottom: 15px;
        }
        .claude-naming-rule label {
            margin-bottom: 5px;
            color: var(--text-color);
        }
        .claude-naming-rule select, .claude-naming-rule input {
            width: 100%;
            margin-bottom: 10px;
        }
    `;

    const UI = {
        createElem(tag, styles) {
            const elem = document.createElement(tag);
            Object.assign(elem.style, styles);
            return elem;
        },

        createButton(text, styles, className) {
            const button = this.createElem('button', styles);
            button.textContent = text;
            button.className = className;
            return button;
        },

        createTokenSelect(isDarkMode) {
            const select = document.createElement('select');
            select.id = 'claude-token-select';
            return select;
        },

        createModal(title, content, includeCloseButton = false) {
            const modal = document.createElement('div');
            modal.className = 'claude-modal';
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('role', 'dialog');

            const modalContent = document.createElement('div');
            modalContent.className = 'claude-modal-content';

            const titleElem = document.createElement('h2');
            titleElem.textContent = title;
            modalContent.appendChild(titleElem);

            if (includeCloseButton) {
                const closeButton = document.createElement('button');
                closeButton.textContent = 'X';
                closeButton.className = 'claude-close-button';
                modalContent.appendChild(closeButton);
            }

            modalContent.appendChild(content);

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'claude-button-container';
            modalContent.appendChild(buttonContainer);

            modal.appendChild(modalContent);
            document.body.appendChild(modal);

            return {
                modal,
                buttonContainer,
                close: () => document.body.removeChild(modal)
            };
        }
    };

    const App = {
        init() {
            this.isDarkMode = document.documentElement.getAttribute('data-mode') === 'dark';
            this.injectStyles();
            this.tokens = this.loadTokens();
            this.createUI();
            this.setupEventListeners();
            this.updateTokenSelect();
            this.fetchIPCountryCode();
            this.observeThemeChanges();
            this.selectCurrentToken();
        },

        injectStyles() {
            this.styleElem = document.createElement('style');
            this.styleElem.textContent = getStyles(this.isDarkMode);
            document.head.appendChild(this.styleElem);
        },

        updateStyles() {
            this.styleElem.textContent = getStyles(this.isDarkMode);
        },

        loadTokens() {
            try {
                const savedTokens = GM_getValue(config.storageKey);
                return savedTokens && savedTokens.length > 0 ? savedTokens : [config.defaultToken];
            } catch (error) {
                console.error('Error loading tokens:', error);
                return [config.defaultToken];
            }
        },

        saveTokens() {
            try {
                GM_setValue(config.storageKey, this.tokens);
       } catch (error) {
                console.error('Error saving tokens:', error);
                alert('Failed to save tokens. Please try again.');
            }
        },

        createUI() {
            this.tokenSelect = UI.createTokenSelect(this.isDarkMode);
            this.toggleButton = UI.createButton('...', {}, 'claude-button-cancel');
            this.toggleButton.id = 'claude-toggle-button';
            this.switchButton = UI.createButton('应用', {}, 'claude-button-save');
            this.switchButton.id = 'claude-switch-button';
            this.manageButton = UI.createButton('管理', {}, 'claude-button-cancel');
            this.manageButton.id = 'claude-manage-button';

            this.container = UI.createElem('div', {});
            this.container.id = 'claude-container';

            const buttonContainer = UI.createElem('div', {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '8px',
            });

            buttonContainer.appendChild(this.tokenSelect);
            buttonContainer.appendChild(this.switchButton);
            buttonContainer.appendChild(this.manageButton);
            this.container.appendChild(buttonContainer);

            document.body.appendChild(this.container);
            document.body.appendChild(this.toggleButton);
        },

        setupEventListeners() {
            this.toggleButton.addEventListener('click', () => this.toggleContainer());
            this.switchButton.addEventListener('click', () => this.switchToken());
            this.manageButton.addEventListener('click', () => this.showManageTokensModal());

            document.addEventListener('click', (event) => {
                if (event.target.classList.contains('delete-token-button')) {
                    this.confirmDeleteToken(event.target.dataset.index);
                } else if (event.target.classList.contains('edit-token-button')) {
                    this.showEditTokenModal(event.target.dataset.index);
                } else if (event.target.classList.contains('claude-add-token-button')) {
                    this.showAddTokenModal();
                } else if (event.target.classList.contains('claude-bulk-import-button')) {
                    this.showBulkImportModal();
                }
            });
        },

        observeThemeChanges() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-mode') {
                        this.isDarkMode = document.documentElement.getAttribute('data-mode') === 'dark';
                        this.updateStyles();
                    }
                });
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-mode']
            });
        },

        toggleContainer() {
            this.container.style.display = this.container.style.display === 'none' ? 'block' : 'none';
        },

        updateTokenSelect() {
            this.tokenSelect.innerHTML = '';
            this.tokens.forEach((token, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = token.name;
                this.tokenSelect.appendChild(option);
            });
        },

        switchToken() {
            const selectedToken = this.tokens[this.tokenSelect.value];
            this.applyToken(selectedToken.key);
            GM_setValue(config.currentTokenKey, selectedToken.name);
        },

        applyToken(token) {
            const currentURL = window.location.href;

            if (currentURL.startsWith('https://claude.ai/')) {
                document.cookie = `sessionKey=${token}; path=/; domain=.claude.ai`;
                window.location.reload();
            } else {
                let loginUrl;
                if (currentURL.startsWith('https://demo.fuclaude.com/')) {
                    loginUrl = `https://demo.fuclaude.com/login_token?session_key=${token}`;
                } else if (currentURL.startsWith('https://claude.asia/')) {
                    loginUrl = `https://claude.asia/login_token?session_key=${token}`;
                }

                if (loginUrl) {
                    window.location.href = loginUrl;
                }
            }
        },

        showManageTokensModal() {
            const content = document.createElement('div');
            content.className = 'claude-token-manager';

            const tokenList = this.createTokenList();
            content.appendChild(tokenList);

            const addTokenButton = UI.createButton('📮 逐个添加 Token', {}, 'claude-add-token-button button claude-button-cancel');
            content.appendChild(addTokenButton);

            const bulkImportButton = UI.createButton('📥 批量导入 Tokens', {}, 'claude-bulk-import-button button claude-button-cancel');
            content.appendChild(bulkImportButton);

            const { modal, buttonContainer, close } = UI.createModal('📚 管理 Tokens', content, true);

            const closeButton = modal.querySelector('.claude-close-button');
            closeButton.addEventListener('click', close);
        },

        createTokenList() {
            const tokenList = document.createElement('div');
            tokenList.className = 'claude-token-list';

            this.tokens.forEach((token, index) => {
                const tokenItem = this.createTokenItem(token, index);
                tokenList.appendChild(tokenItem);
            });

            return tokenList;
        },

        createTokenItem(token, index) {
            const tokenItem = document.createElement('div');
            tokenItem.className = 'claude-token-item';
            tokenItem.dataset.index = index;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = token.name;
            tokenItem.appendChild(nameSpan);

            const buttonContainer = document.createElement('div');

            const editButton = UI.createButton('编辑', {}, 'edit-token-button claude-button-cancel');
            editButton.dataset.index = index;
            buttonContainer.appendChild(editButton);

            const deleteButton = UI.createButton('删除', {}, 'delete-token-button claude-button-save');
            deleteButton.dataset.index = index;
            buttonContainer.appendChild(deleteButton);

            tokenItem.appendChild(buttonContainer);

            return tokenItem;
        },

        showAddTokenModal() {
            const content = document.createElement('div');
            content.className = 'claude-add-token-form';

            const nameInput = document.createElement('input');
            nameInput.placeholder = 'Token 名称';
            nameInput.setAttribute('aria-label', 'Token 名称：');
            content.appendChild(nameInput);

            const keyInput = document.createElement('input');
            keyInput.placeholder = 'Token 密钥';
            keyInput.setAttribute('aria-label', 'Token 密钥：');
            content.appendChild(keyInput);

            const { modal, buttonContainer, close } = UI.createModal('📮 添加 Token', content);

            const addButton = UI.createButton('添加', {}, 'claude-button-save');
            addButton.addEventListener('click', () => {
                if (this.validateInput(nameInput.value, keyInput.value)) {
                    this.tokens.push({ name: nameInput.value, key: keyInput.value });
                    this.saveTokens();
                    this.updateTokenSelect();
                    this.updateManageTokensModal();
                    close();
                }
            });
            buttonContainer.appendChild(addButton);

            const cancelButton = UI.createButton('取消', {}, 'claude-button-cancel');
            cancelButton.addEventListener('click', close);
            buttonContainer.appendChild(cancelButton);
        },

        showEditTokenModal(index) {
            const token = this.tokens[index];
            const content = document.createElement('div');
            content.className = 'claude-edit-token-form';

            const nameInput = document.createElement('input');
            nameInput.value = token.name;
            nameInput.placeholder = 'Token 名称';
            nameInput.setAttribute('aria-label', 'Token 名称：');
            content.appendChild(nameInput);

            const keyInput = document.createElement('input');
            keyInput.value = token.key;
            keyInput.placeholder = 'Token 密钥';
            keyInput.setAttribute('aria-label', 'Token 密钥：');
            content.appendChild(keyInput);

            const { modal, buttonContainer, close } = UI.createModal('✍️ 编辑 Token', content);

            const saveButton = UI.createButton('保存', {}, 'claude-button-save');
            saveButton.addEventListener('click', () => {
                if (this.validateInput(nameInput.value, keyInput.value)) {
                    this.tokens[index] = { name: nameInput.value, key: keyInput.value };
                    this.saveTokens();
                    this.updateTokenSelect();
                    this.updateManageTokensModal();
                    close();
                }
            });
            buttonContainer.appendChild(saveButton);

            const cancelButton = UI.createButton('取消', {}, 'claude-button-cancel');
            cancelButton.addEventListener('click', close);
            buttonContainer.appendChild(cancelButton);
        },

        showBulkImportModal() {
            const content = document.createElement('div');
            content.className = 'claude-bulk-import-form';

            const textareaLabel = document.createElement('label');
            textareaLabel.innerHTML = '<strong>1️⃣ Tokens 粘贴区：</strong><br>'+'在这里粘贴您需要导入的 Tokens，每行一个！';
            textareaLabel.setAttribute('for', 'claude-bulk-import-textarea');
            content.appendChild(textareaLabel);

            const textarea = document.createElement('textarea');
            textarea.id = 'claude-bulk-import-textarea';
            textarea.placeholder = '';
            textarea.rows = 10;
            content.appendChild(textarea);

            const namingRuleContainer = document.createElement('div');
            namingRuleContainer.className = 'claude-naming-rule';

            const namingRuleContainerLabel = document.createElement('label');
            namingRuleContainerLabel.innerHTML = '<strong>2️⃣ Tokens 命名规则：</strong>';
            namingRuleContainerLabel.setAttribute('for', 'claude-naming-rule');
            namingRuleContainer.appendChild(namingRuleContainerLabel);

            const nameLabel = document.createElement('label');
            nameLabel.textContent = '名称前缀：';
            nameLabel.setAttribute('for', 'claude-name-prefix');
            namingRuleContainer.appendChild(nameLabel);

            const nameInput = document.createElement('input');
            nameInput.id = 'claude-name-prefix';
            nameInput.value = 'token';
            namingRuleContainer.appendChild(nameInput);

            const numberLabel = document.createElement('label');
            numberLabel.textContent = '名称起始编号：';
            numberLabel.setAttribute('for', 'claude-start-number');
            namingRuleContainer.appendChild(numberLabel);

            const numberInput = document.createElement('input');
            numberInput.id = 'claude-start-number';
            numberInput.type = 'number';
            numberInput.value = '1';
            namingRuleContainer.appendChild(numberInput);

            const orderLabel = document.createElement('label');
            orderLabel.textContent = '名称排序方式：';
            orderLabel.setAttribute('for', 'claude-order-select');
            namingRuleContainer.appendChild(orderLabel);

            const orderSelect = document.createElement('select');
            orderSelect.id = 'claude-order-select';
            orderSelect.innerHTML = `
                <option value="asc">顺序</option>
                <option value="desc">倒序</option>
            `;
            namingRuleContainer.appendChild(orderSelect);

            content.appendChild(namingRuleContainer);


            const previewContainer = document.createElement('div');
            previewContainer.className = 'claude-preview-container';

            const previewContainerLabel = document.createElement('label');
            previewContainerLabel.innerHTML = '<strong>3️⃣ Tokens 导入结果 预览：</strong>';
            previewContainerLabel.setAttribute('for', 'claude-preview-container');

            content.appendChild(previewContainerLabel);

            content.appendChild(previewContainer);

            const { modal, buttonContainer, close } = UI.createModal('📥 批量导入 Tokens', content);

            const importButton = UI.createButton('导入', {}, 'claude-button-save');
            importButton.addEventListener('click', () => {
                this.performBulkImport(textarea.value, nameInput.value, numberInput.value, orderSelect.value);
                close();
            });
            buttonContainer.appendChild(importButton);

            const cancelButton = UI.createButton('取消', {}, 'claude-button-cancel');
            cancelButton.addEventListener('click', close);
            buttonContainer.appendChild(cancelButton);

            const updatePreview = () => {
                this.previewBulkImport(textarea.value, nameInput.value, numberInput.value, orderSelect.value, previewContainer);
            };

            [textarea, nameInput, numberInput, orderSelect].forEach(elem => {
                elem.addEventListener('input', updatePreview);
            });

            updatePreview();
        },

        previewBulkImport(input, namePrefix, startNumber, order, previewContainer) {
            const tokens = this.parseTokens(input);
            const namedTokens = this.applyNamingRule(tokens, namePrefix, parseInt(startNumber), order);
            const claudePreviewTitle = document.createElement('div');
            claudePreviewTitle.innerHTML = '<div class="claude-preview-title">请核对下方导入结果：</div>';
            previewContainer.appendChild(claudePreviewTitle);

            namedTokens.forEach(token => {
                const previewItem = document.createElement('div');
                previewItem.className = 'claude-preview-item';
                previewItem.innerHTML = `
                    <span class="claude-preview-name">${token.name}:</span>
                    <span class="claude-preview-key">${token.key}</span>
                `;
                previewContainer.appendChild(previewItem);
            });

            if (namedTokens.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'claude-preview-item';
                emptyMessage.textContent = '等待... ';
                previewContainer.appendChild(emptyMessage);
            }
        },

        performBulkImport(input, namePrefix, startNumber, order) {
            const tokens = this.parseTokens(input);
            const namedTokens = this.applyNamingRule(tokens, namePrefix, parseInt(startNumber), order);
            this.tokens = [...this.tokens, ...namedTokens];
            this.saveTokens();
            this.updateTokenSelect();
            this.updateManageTokensModal();
        },

        parseTokens(input) {
            return input.split('\n')
                .map(line => line.trim())
                .filter(line => this.validateTokenKey(line))
                .map(key => ({ key }));
        },

        applyNamingRule(tokens, namePrefix, startNumber, order) {
            return tokens.map((token, index) => {
                const number = order === 'asc' ? startNumber + index : startNumber + tokens.length - 1 - index;
                const name = `${namePrefix}${number.toString().padStart(2, '0')}`;
                return { ...token, name };
            });
        },

        updateManageTokensModal() {
            const tokenList = document.querySelector('.claude-token-list');
            if (tokenList) {
                tokenList.innerHTML = '';
                this.tokens.forEach((token, index) => {
                    const tokenItem = this.createTokenItem(token, index);
                    tokenList.appendChild(tokenItem);
                });
            }
        },

        confirmDeleteToken(index) {
            if (confirm('确认删除该 Token？删除后将无法撤销！')) {
                this.deleteToken(index);
            }
        },

        deleteToken(index) {
            this.tokens.splice(index, 1);
            this.saveTokens();
            this.updateTokenSelect();
            this.updateManageTokensModal();
        },

        validateInput(name, key) {
            if (!name || !key) {
                alert('Token 名称和密钥都要填写！');
                return false;
            }
            if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
                alert('Token 名称只能包含字母、数字、下划线和连字符！');
                return false;
            }
            if (!this.validateTokenKey(key)) {
                alert('无效的 Token 密钥格式！');
                return false;
            }
            return true;
        },

        validateTokenKey(key) {
            return /^sk-ant-sid\d{2}-[A-Za-z0-9_-]*$/.test(key);
        },

        fetchIPCountryCode: (() => {
            let lastFetchTime = 0;
            const FETCH_INTERVAL = 60000; // 1 minute

            return function() {
                const now = Date.now();
                if (now - lastFetchTime < FETCH_INTERVAL) {
                    return;
                }

                lastFetchTime = now;
                this.toggleButton.innerHTML = '🌎 IP:&nbsp;&nbsp; <strong>Loading...</strong>';

                GM_xmlhttpRequest({
                    method: "GET",
                    url: config.ipApiUrl,
                    onload: (response) => {
                        if (response.status === 200) {
                            this.toggleButton.innerHTML = '🌎 IP:&nbsp;&nbsp; <strong>' + response.responseText.trim() + '</strong>';
                        } else {
                            this.toggleButton.innerHTML = '🌎 IP:&nbsp;&nbsp; <strong>ERROR</strong>';
                        }
                    },
                    onerror: () => {
                        this.toggleButton.innerHTML = '🌎 IP:&nbsp;&nbsp; <strong>ERROR</strong>';
                    }
                });
            };
        })(),

        selectCurrentToken() {
            const currentTokenName = GM_getValue(config.currentTokenKey);
            if (currentTokenName) {
                const tokenIndex = this.tokens.findIndex(token => token.name === currentTokenName);
                if (tokenIndex !== -1) {
                    this.tokenSelect.value = tokenIndex;
                }
            }
        }
    };

    // Initialize the application
    App.init();
})();
