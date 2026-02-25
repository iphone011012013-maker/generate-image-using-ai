/**
 * Main Application Script
 * Handles UI interactions and application logic
 */

class ImageGeneratorApp {
    constructor() {
        this.elements = {};
        this.isGenerating = false;
        this.currentImageUrl = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Setup the application
     */
    setup() {
        this.cacheElements();
        this.initializeHelpers();
        this.bindEvents();
        this.loadSavedData();
        this.updateUI();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Form elements
            apiKeyInput: document.getElementById('apiKey'),
            promptInput: document.getElementById('prompt'),
            imageForm: document.getElementById('imageForm'),
            generateBtn: document.getElementById('generateBtn'),
            imageStyle: document.getElementById('imageStyle'),
            imageQuality: document.getElementById('imageQuality'),
            removeWatermark: document.getElementById('removeWatermark'),
            
            // Toggle buttons
            themeToggle: document.getElementById('themeToggle'),
            languageToggle: document.getElementById('languageToggle'),
            toggleApiKey: document.getElementById('toggleApiKey'),
            
            // Result elements
            resultSection: document.getElementById('resultSection'),
            imageContainer: document.getElementById('imageContainer'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            imageResult: document.getElementById('imageResult'),
            generatedImage: document.getElementById('generatedImage'),
            
            // Action buttons
            downloadBtn: document.getElementById('downloadBtn'),
            copyBtn: document.getElementById('copyBtn'),
            newImageBtn: document.getElementById('newImageBtn'),
            
            // Other elements
            charCount: document.getElementById('charCount')
        };
    }

    /**
     * Initialize helper modules
     */
    initializeHelpers() {
        ThemeHelper.init();
        LanguageHelper.init();
        ToastHelper.init();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        this.elements.imageForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => {
            ThemeHelper.toggle();
            ToastHelper.info(
                LanguageHelper.getCurrentLanguage() === 'ar' 
                    ? 'تم تغيير الوضع' 
                    : 'Theme changed'
            );
        });
        
        // Language toggle
        this.elements.languageToggle.addEventListener('click', () => {
            LanguageHelper.toggle();
            ToastHelper.info(
                LanguageHelper.getCurrentLanguage() === 'ar' 
                    ? 'تم تغيير اللغة' 
                    : 'Language changed'
            );
        });
        
        // API key visibility toggle
        this.elements.toggleApiKey.addEventListener('click', () => this.toggleApiKeyVisibility());
        
        // Prompt character counter
        this.elements.promptInput.addEventListener('input', () => this.updateCharCounter());
        
        // API key input validation
        this.elements.apiKeyInput.addEventListener('input', 
            Utils.debounce(() => this.validateApiKey(), 500)
        );
        
        // Action buttons
        this.elements.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.elements.copyBtn.addEventListener('click', () => this.copyImageUrl());
        this.elements.newImageBtn.addEventListener('click', () => this.resetForm());
        
        // Auto-save API key and prompt
        this.elements.apiKeyInput.addEventListener('change', () => this.saveApiKey());
        this.elements.promptInput.addEventListener('input',
            Utils.debounce(() => this.savePrompt(), 1000)
        );

        // Example items click handlers
        document.querySelectorAll('.example-item').forEach(item => {
            item.addEventListener('click', () => {
                const text = item.textContent.trim();
                this.elements.promptInput.value = text;
                this.updateCharCounter();
                this.savePrompt();

                // Show success message
                ToastHelper.success(
                    LanguageHelper.getCurrentLanguage() === 'ar'
                        ? 'تم نسخ المثال إلى حقل الوصف'
                        : 'Example copied to description field'
                );
            });
        });
    }

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        // Load API key
        const savedApiKey = StorageHelper.load(StorageHelper.keys.API_KEY);
        if (savedApiKey) {
            this.elements.apiKeyInput.value = savedApiKey;
        }
        
        // Load last prompt
        const savedPrompt = StorageHelper.load(StorageHelper.keys.LAST_PROMPT);
        if (savedPrompt) {
            this.elements.promptInput.value = savedPrompt;
            this.updateCharCounter();
        }
    }

    /**
     * Update UI state
     */
    updateUI() {
        this.updateCharCounter();
        this.updateGenerateButton();
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isGenerating) return;
        
        const apiKey = this.elements.apiKeyInput.value.trim();
        const prompt = this.elements.promptInput.value.trim();
        const style = this.elements.imageStyle.value;
        const quality = this.elements.imageQuality.value;
        const removeWatermark = this.elements.removeWatermark.checked;
        
        // Validate inputs
        if (!apiKey) {
            ToastHelper.error(
                LanguageHelper.getCurrentLanguage() === 'ar' 
                    ? 'يرجى إدخال مفتاح API' 
                    : 'Please enter API key'
            );
            this.elements.apiKeyInput.focus();
            return;
        }
        
        if (!prompt) {
            ToastHelper.error(
                LanguageHelper.getCurrentLanguage() === 'ar' 
                    ? 'يرجى إدخال وصف للصورة' 
                    : 'Please enter image description'
            );
            this.elements.promptInput.focus();
            return;
        }
        
        await this.generateImage(apiKey, prompt, style, quality, removeWatermark);
    }

    /**
     * Generate image using Gemini API
     */
    async generateImage(apiKey, prompt, style, quality, removeWatermark) {
        try {
            this.setGeneratingState(true);
            this.showResultSection();
            this.showLoadingSpinner();
            
            // Create enhanced prompt with style and quality
            const enhancedPrompt = this.enhancePromptWithOptions(prompt, style, quality, removeWatermark);

            // Generate image
            const result = await window.GeminiAPI.generateImage(apiKey, enhancedPrompt);
            
            if (result.success) {
                this.displayGeneratedImage(result.imageUrl, prompt);
                ToastHelper.success(
                    LanguageHelper.getCurrentLanguage() === 'ar' 
                        ? 'تم توليد الصورة بنجاح!' 
                        : 'Image generated successfully!'
                );
                
                // Save to history
                this.saveToHistory(result);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Image generation error:', error);
            ToastHelper.error(error.message);
            this.hideResultSection();
        } finally {
            this.setGeneratingState(false);
            this.hideLoadingSpinner();
        }
    }

    /**
     * Set generating state
     */
    setGeneratingState(isGenerating) {
        this.isGenerating = isGenerating;
        this.elements.generateBtn.disabled = isGenerating;
        
        const btnText = this.elements.generateBtn.querySelector('span');
        if (isGenerating) {
            btnText.textContent = LanguageHelper.getCurrentLanguage() === 'ar' 
                ? 'جاري التوليد...' 
                : 'Generating...';
        } else {
            btnText.textContent = LanguageHelper.getCurrentLanguage() === 'ar' 
                ? 'توليد الصورة' 
                : 'Generate Image';
        }
    }

    /**
     * Show result section
     */
    showResultSection() {
        this.elements.resultSection.style.display = 'block';
        this.elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Hide result section
     */
    hideResultSection() {
        this.elements.resultSection.style.display = 'none';
    }

    /**
     * Show loading spinner
     */
    showLoadingSpinner() {
        this.elements.loadingSpinner.style.display = 'block';
        this.elements.imageResult.style.display = 'none';
    }

    /**
     * Hide loading spinner
     */
    hideLoadingSpinner() {
        this.elements.loadingSpinner.style.display = 'none';
    }

    /**
     * Display generated image
     */
    displayGeneratedImage(imageUrl, prompt) {
        this.currentImageUrl = imageUrl;
        this.elements.generatedImage.src = imageUrl;
        this.elements.generatedImage.alt = prompt;
        
        this.elements.imageResult.style.display = 'block';
        this.hideLoadingSpinner();
    }

    /**
     * Toggle API key visibility
     */
    toggleApiKeyVisibility() {
        const input = this.elements.apiKeyInput;
        const icon = this.elements.toggleApiKey.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    /**
     * Update character counter
     */
    updateCharCounter() {
        const count = this.elements.promptInput.value.length;
        this.elements.charCount.textContent = count;
        
        // Change color based on limit
        if (count > 450) {
            this.elements.charCount.style.color = 'var(--error-color)';
        } else if (count > 400) {
            this.elements.charCount.style.color = 'var(--warning-color)';
        } else {
            this.elements.charCount.style.color = 'var(--text-muted)';
        }
    }

    /**
     * Update generate button state
     */
    updateGenerateButton() {
        const hasApiKey = this.elements.apiKeyInput.value.trim().length > 0;
        const hasPrompt = this.elements.promptInput.value.trim().length > 0;
        
        this.elements.generateBtn.disabled = !hasApiKey || !hasPrompt || this.isGenerating;
    }

    /**
     * Validate API key
     */
    async validateApiKey() {
        const apiKey = this.elements.apiKeyInput.value.trim();
        
        if (!apiKey) return;
        
        if (!window.GeminiAPI.validateApiKey(apiKey)) {
            ToastHelper.warning(
                LanguageHelper.getCurrentLanguage() === 'ar'
                    ? 'تنسيق مفتاح API غير صحيح. يجب أن يبدأ بـ AIza'
                    : 'Invalid API key format. Must start with AIza'
            );
        }
    }

    /**
     * Save API key to localStorage
     */
    saveApiKey() {
        const apiKey = this.elements.apiKeyInput.value.trim();
        if (apiKey) {
            StorageHelper.save(StorageHelper.keys.API_KEY, apiKey);
        }
    }

    /**
     * Save prompt to localStorage
     */
    savePrompt() {
        const prompt = this.elements.promptInput.value.trim();
        if (prompt) {
            StorageHelper.save(StorageHelper.keys.LAST_PROMPT, prompt);
        }
    }

    /**
     * Download generated image
     */
    downloadImage() {
        if (!this.currentImageUrl) return;
        
        const filename = `ai-generated-image-${Date.now()}.jpg`;
        Utils.downloadFile(this.currentImageUrl, filename);
        
        ToastHelper.success(
            LanguageHelper.getCurrentLanguage() === 'ar' 
                ? 'تم بدء التحميل' 
                : 'Download started'
        );
    }

    /**
     * Copy image URL to clipboard
     */
    async copyImageUrl() {
        if (!this.currentImageUrl) return;
        
        const success = await Utils.copyToClipboard(this.currentImageUrl);
        
        if (success) {
            ToastHelper.success(
                LanguageHelper.getCurrentLanguage() === 'ar' 
                    ? 'تم نسخ رابط الصورة' 
                    : 'Image URL copied'
            );
        } else {
            ToastHelper.error(
                LanguageHelper.getCurrentLanguage() === 'ar' 
                    ? 'فشل في نسخ الرابط' 
                    : 'Failed to copy URL'
            );
        }
    }

    /**
     * Reset form for new image
     */
    resetForm() {
        this.elements.promptInput.value = '';
        this.updateCharCounter();
        this.hideResultSection();
        this.currentImageUrl = null;
        
        // Remove saved prompt
        StorageHelper.remove(StorageHelper.keys.LAST_PROMPT);
        
        // Focus on prompt input
        this.elements.promptInput.focus();
    }

    /**
     * Enhance prompt with style and quality options
     */
    enhancePromptWithOptions(prompt, style, quality, removeWatermark) {
        let enhancedPrompt = prompt;

        // Add style modifiers
        const styleModifiers = {
            'realistic': 'photorealistic, highly detailed, natural lighting',
            'artistic': 'artistic, creative, expressive, beautiful composition',
            'cartoon': 'cartoon style, animated, colorful, fun',
            'photography': 'professional photography, sharp focus, perfect lighting',
            'painting': 'oil painting, artistic brushstrokes, masterpiece',
            'digital-art': 'digital art, concept art, trending on artstation'
        };

        // Add quality modifiers
        const qualityModifiers = {
            'standard': 'good quality',
            'high': 'high quality, detailed, sharp',
            'ultra': 'ultra high quality, 4k, masterpiece, highly detailed, sharp focus'
        };

        // Combine prompt with modifiers
        enhancedPrompt += `, ${styleModifiers[style] || styleModifiers.realistic}`;
        enhancedPrompt += `, ${qualityModifiers[quality] || qualityModifiers.standard}`;

        // Add watermark removal if requested
        if (removeWatermark) {
            enhancedPrompt += ', no watermark, no logo, no text, clean image, professional';
        }

        return enhancedPrompt;
    }

    /**
     * Save generated image to history
     */
    saveToHistory(result) {
        const history = StorageHelper.load(StorageHelper.keys.GENERATED_IMAGES, []);

        const entry = {
            id: Utils.generateId(),
            prompt: result.prompt,
            imageUrl: result.imageUrl,
            timestamp: result.timestamp
        };

        // Add to beginning of array and limit to 50 entries
        history.unshift(entry);
        if (history.length > 50) {
            history.splice(50);
        }

        StorageHelper.save(StorageHelper.keys.GENERATED_IMAGES, history);
    }
}

// Initialize the application when the script loads
const app = new ImageGeneratorApp();
