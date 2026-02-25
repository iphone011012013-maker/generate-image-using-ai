/**
 * Helper Utilities Module
 * Contains utility functions for localStorage, notifications, and internationalization
 */

// Storage Helper
class StorageHelper {
    static keys = {
        API_KEY: 'gemini_api_key',
        THEME: 'app_theme',
        LANGUAGE: 'app_language',
        LAST_PROMPT: 'last_prompt',
        GENERATED_IMAGES: 'generated_images'
    };

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     */
    static save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} - Stored value or default
     */
    static load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    /**
     * Clear all app data from localStorage
     */
    static clearAll() {
        Object.values(this.keys).forEach(key => {
            this.remove(key);
        });
    }
}

// Toast Notification Helper
class ToastHelper {
    static container = null;

    /**
     * Initialize toast container
     */
    static init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    static show(message, type = 'info', duration = 5000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIcon(type);
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="${icon}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; cursor: pointer; color: inherit;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        this.container.appendChild(toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, duration);
        }

        return toast;
    }

    /**
     * Get icon for toast type
     * @param {string} type - Toast type
     * @returns {string} - Font Awesome icon class
     */
    static getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Show success toast
     * @param {string} message - Success message
     */
    static success(message) {
        this.show(message, 'success');
    }

    /**
     * Show error toast
     * @param {string} message - Error message
     */
    static error(message) {
        this.show(message, 'error');
    }

    /**
     * Show warning toast
     * @param {string} message - Warning message
     */
    static warning(message) {
        this.show(message, 'warning');
    }

    /**
     * Show info toast
     * @param {string} message - Info message
     */
    static info(message) {
        this.show(message, 'info');
    }
}

// Language Helper
class LanguageHelper {
    static currentLanguage = 'ar';
    static translations = {
        ar: {
            direction: 'rtl',
            name: 'العربية'
        },
        en: {
            direction: 'ltr',
            name: 'English'
        }
    };

    /**
     * Initialize language system
     */
    static init() {
        // Load saved language or detect from browser
        const savedLang = StorageHelper.load(StorageHelper.keys.LANGUAGE);
        const browserLang = navigator.language.startsWith('ar') ? 'ar' : 'en';
        this.currentLanguage = savedLang || browserLang;
        
        this.applyLanguage(this.currentLanguage);
    }

    /**
     * Apply language to the page
     * @param {string} lang - Language code
     */
    static applyLanguage(lang) {
        this.currentLanguage = lang;
        const html = document.documentElement;
        const body = document.body;
        
        // Set HTML attributes
        html.lang = lang;
        html.dir = this.translations[lang].direction;
        
        // Update all elements with data attributes
        document.querySelectorAll('[data-ar], [data-en]').forEach(element => {
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                element.textContent = text;
            }
        });

        // Update select options
        document.querySelectorAll('option[data-ar], option[data-en]').forEach(option => {
            const text = option.getAttribute(`data-${lang}`);
            if (text) {
                option.textContent = text;
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-ar-placeholder], [data-en-placeholder]').forEach(element => {
            const placeholder = element.getAttribute(`data-${lang}-placeholder`);
            if (placeholder) {
                element.placeholder = placeholder;
            }
        });

        // Update page title
        const titleElement = document.querySelector('title');
        if (titleElement) {
            const title = titleElement.getAttribute(`data-${lang}`);
            if (title) {
                titleElement.textContent = title;
            }
        }

        // Save language preference
        StorageHelper.save(StorageHelper.keys.LANGUAGE, lang);
    }

    /**
     * Toggle between Arabic and English
     */
    static toggle() {
        const newLang = this.currentLanguage === 'ar' ? 'en' : 'ar';
        this.applyLanguage(newLang);
    }

    /**
     * Get current language
     * @returns {string} - Current language code
     */
    static getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Check if current language is RTL
     * @returns {boolean} - True if RTL
     */
    static isRTL() {
        return this.translations[this.currentLanguage].direction === 'rtl';
    }
}

// Theme Helper
class ThemeHelper {
    static currentTheme = 'light';

    /**
     * Initialize theme system
     */
    static init() {
        // Load saved theme or detect from system
        const savedTheme = StorageHelper.load(StorageHelper.keys.THEME);
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.currentTheme = savedTheme || systemTheme;
        
        this.applyTheme(this.currentTheme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!StorageHelper.load(StorageHelper.keys.THEME)) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Apply theme to the page
     * @param {string} theme - Theme name (light/dark)
     */
    static applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // Save theme preference
        StorageHelper.save(StorageHelper.keys.THEME, theme);
    }

    /**
     * Toggle between light and dark themes
     */
    static toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    /**
     * Get current theme
     * @returns {string} - Current theme name
     */
    static getCurrentTheme() {
        return this.currentTheme;
    }
}

// Utility Functions
class Utils {
    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} - Success status
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    /**
     * Download file from URL
     * @param {string} url - File URL
     * @param {string} filename - Desired filename
     */
    static downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} - Formatted size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate random ID
     * @param {number} length - ID length
     * @returns {string} - Random ID
     */
    static generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

// Make helpers available globally
if (typeof window !== 'undefined') {
    window.StorageHelper = StorageHelper;
    window.ToastHelper = ToastHelper;
    window.LanguageHelper = LanguageHelper;
    window.ThemeHelper = ThemeHelper;
    window.Utils = Utils;
}
