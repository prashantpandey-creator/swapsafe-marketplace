/**
 * ProductIdentificationStep Component
 * 
 * Cascading dropdown for Brand → Model → Variant selection
 * with unique ID input for Digital Twin verification.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ChevronDown, Check, AlertCircle,
    Smartphone, Laptop, Car, Watch, Headphones,
    ShoppingBag, Package, Fingerprint, Shield,
    Camera, Loader2
} from 'lucide-react';
import './ProductIdentificationStep.css';

// Category to icon mapping
const categoryIcons = {
    electronics: Smartphone,
    phones: Smartphone,
    laptops: Laptop,
    vehicles: Car,
    watches: Watch,
    audio: Headphones,
    fashion: ShoppingBag,
    sneakers: ShoppingBag,
    other: Package
};

// ID type instructions
const idTypeInstructions = {
    imei: {
        label: 'IMEI Number',
        icon: Fingerprint,
        placeholder: 'Enter 15-digit IMEI',
        hint: 'Dial *#06# on your phone to see it',
        inputMode: 'numeric',
        maxLength: 15
    },
    vin: {
        label: 'VIN (Vehicle Identification Number)',
        icon: Car,
        placeholder: 'Enter 17-character VIN',
        hint: 'Check dashboard or door sticker',
        inputMode: 'text',
        maxLength: 17
    },
    serial: {
        label: 'Serial Number',
        icon: Package,
        placeholder: 'Enter serial number',
        hint: 'Check product label or settings',
        inputMode: 'text',
        maxLength: 30
    },
    sku: {
        label: 'SKU / Model Code',
        icon: ShoppingBag,
        placeholder: 'e.g., DZ5485-612',
        hint: 'Check box or inside label',
        inputMode: 'text',
        maxLength: 20
    },
    isbn: {
        label: 'ISBN',
        icon: Package,
        placeholder: 'Enter 10 or 13 digit ISBN',
        hint: 'Check the back cover',
        inputMode: 'numeric',
        maxLength: 13
    }
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProductIdentificationStep = ({
    category,
    subcategory,
    onProductSelect,
    onUniqueIdChange,
    initialProductInfo = {},
    initialUniqueId = {}
}) => {
    // Product selection state
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(initialProductInfo.brand || '');
    const [selectedModel, setSelectedModel] = useState(initialProductInfo.model || '');
    const [selectedVariant, setSelectedVariant] = useState(initialProductInfo.variant || '');
    const [productDetails, setProductDetails] = useState(null);

    // Unique ID state
    const [uniqueIdValue, setUniqueIdValue] = useState(initialUniqueId.value || '');
    const [uniqueIdType, setUniqueIdType] = useState(initialUniqueId.type || 'serial');
    const [idValidation, setIdValidation] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    // UI state
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [brandSearch, setBrandSearch] = useState('');
    const [modelSearch, setModelSearch] = useState('');
    const [manualEntry, setManualEntry] = useState(false);
    const [manualBrand, setManualBrand] = useState('');
    const [manualModel, setManualModel] = useState('');

    // Load brands when category changes
    useEffect(() => {
        if (category) {
            loadBrands();
        }
    }, [category, subcategory]);

    // Load models when brand changes
    useEffect(() => {
        if (selectedBrand) {
            loadModels(selectedBrand);
        } else {
            setModels([]);
            setSelectedModel('');
            setProductDetails(null);
        }
    }, [selectedBrand]);

    // Load product details when model changes
    useEffect(() => {
        if (selectedBrand && selectedModel) {
            loadProductDetails();
        } else {
            setProductDetails(null);
        }
    }, [selectedBrand, selectedModel]);

    // Notify parent of product selection
    useEffect(() => {
        if (onProductSelect) {
            onProductSelect({
                brand: manualEntry ? manualBrand : selectedBrand,
                model: manualEntry ? manualModel : selectedModel,
                variant: selectedVariant,
                subcategory: productDetails?.subcategory || subcategory
            });
        }
    }, [selectedBrand, selectedModel, selectedVariant, manualBrand, manualModel, manualEntry]);

    // Notify parent of unique ID changes
    useEffect(() => {
        if (onUniqueIdChange && idValidation?.valid) {
            onUniqueIdChange({
                value: idValidation.cleaned,
                type: uniqueIdType,
                masked: idValidation.masked
            });
        }
    }, [idValidation]);

    const loadBrands = async () => {
        setLoadingBrands(true);
        try {
            const params = new URLSearchParams({ category });
            if (subcategory) params.append('subcategory', subcategory);

            const response = await fetch(`${API_URL}/products/brands?${params}`);
            const data = await response.json();
            setBrands(data || []);
        } catch (error) {
            console.error('Error loading brands:', error);
            setBrands([]);
        } finally {
            setLoadingBrands(false);
        }
    };

    const loadModels = async (brand) => {
        setLoadingModels(true);
        try {
            const params = new URLSearchParams({ brand, category });
            if (subcategory) params.append('subcategory', subcategory);

            const response = await fetch(`${API_URL}/products/models?${params}`);
            const data = await response.json();
            setModels(data || []);
        } catch (error) {
            console.error('Error loading models:', error);
            setModels([]);
        } finally {
            setLoadingModels(false);
        }
    };

    const loadProductDetails = async () => {
        try {
            const params = new URLSearchParams({
                brand: selectedBrand,
                model: selectedModel
            });

            const response = await fetch(`${API_URL}/products/lookup?${params}`);
            if (response.ok) {
                const data = await response.json();
                setProductDetails(data);

                // Set unique ID type based on product
                if (data.uniqueIdConfig?.type) {
                    setUniqueIdType(data.uniqueIdConfig.type);
                }
            }
        } catch (error) {
            console.error('Error loading product details:', error);
        }
    };

    // Debounced ID validation
    const validateUniqueId = useCallback(async (value) => {
        if (!value || value.length < 5) {
            setIdValidation(null);
            return;
        }

        setIsValidating(true);
        try {
            // First validate format
            const validateResponse = await fetch(`${API_URL}/products/validate-id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, type: uniqueIdType })
            });
            const validateResult = await validateResponse.json();

            if (!validateResult.valid) {
                setIdValidation(validateResult);
                return;
            }

            // Then check for duplicates
            const duplicateResponse = await fetch(`${API_URL}/products/check-duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, type: uniqueIdType })
            });
            const duplicateResult = await duplicateResponse.json();

            setIdValidation({
                ...validateResult,
                duplicate: duplicateResult.duplicate,
                existing: duplicateResult.existing
            });
        } catch (error) {
            console.error('Error validating ID:', error);
            setIdValidation({ valid: false, error: 'Validation failed' });
        } finally {
            setIsValidating(false);
        }
    }, [uniqueIdType]);

    // Debounce ID validation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (uniqueIdValue) {
                validateUniqueId(uniqueIdValue);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [uniqueIdValue, uniqueIdType, validateUniqueId]);

    const filteredBrands = brands.filter(brand =>
        brand.toLowerCase().includes(brandSearch.toLowerCase())
    );

    const filteredModels = models.filter(m =>
        m.model.toLowerCase().includes(modelSearch.toLowerCase())
    );

    const CategoryIcon = categoryIcons[subcategory] || categoryIcons[category] || Package;
    const IdTypeConfig = idTypeInstructions[uniqueIdType] || idTypeInstructions.serial;
    const IdIcon = IdTypeConfig.icon;

    return (
        <div className="product-identification-step">
            {/* Header */}
            <div className="pid-header">
                <div className="pid-icon-wrapper">
                    <CategoryIcon className="pid-category-icon" />
                </div>
                <div className="pid-header-text">
                    <h3>Identify Your Product</h3>
                    <p>Better identification = Better showcase photos & faster sales</p>
                </div>
            </div>

            {/* Brand Selection */}
            <div className="pid-field">
                <label>Brand</label>
                {!manualEntry ? (
                    <div className="pid-dropdown-container">
                        <button
                            className={`pid-dropdown-trigger ${selectedBrand ? 'has-value' : ''}`}
                            onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                            disabled={loadingBrands}
                        >
                            {loadingBrands ? (
                                <><Loader2 className="spin" size={16} /> Loading...</>
                            ) : selectedBrand ? (
                                <><Check size={16} className="text-green" /> {selectedBrand}</>
                            ) : (
                                <>Select brand</>
                            )}
                            <ChevronDown size={16} className={showBrandDropdown ? 'rotate' : ''} />
                        </button>

                        <AnimatePresence>
                            {showBrandDropdown && (
                                <motion.div
                                    className="pid-dropdown"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className="pid-dropdown-search">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search brands..."
                                            value={brandSearch}
                                            onChange={(e) => setBrandSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="pid-dropdown-list">
                                        {filteredBrands.length > 0 ? (
                                            filteredBrands.map(brand => (
                                                <button
                                                    key={brand}
                                                    className={`pid-dropdown-item ${selectedBrand === brand ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedBrand(brand);
                                                        setSelectedModel('');
                                                        setSelectedVariant('');
                                                        setShowBrandDropdown(false);
                                                        setBrandSearch('');
                                                    }}
                                                >
                                                    {brand}
                                                    {selectedBrand === brand && <Check size={14} />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="pid-dropdown-empty">
                                                No brands found
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="pid-manual-entry-btn"
                                        onClick={() => {
                                            setManualEntry(true);
                                            setShowBrandDropdown(false);
                                        }}
                                    >
                                        <Package size={14} /> Enter manually
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <input
                        type="text"
                        className="pid-text-input"
                        placeholder="Enter brand name"
                        value={manualBrand}
                        onChange={(e) => setManualBrand(e.target.value)}
                    />
                )}
            </div>

            {/* Model Selection */}
            <div className="pid-field">
                <label>Model</label>
                {!manualEntry ? (
                    <div className="pid-dropdown-container">
                        <button
                            className={`pid-dropdown-trigger ${selectedModel ? 'has-value' : ''}`}
                            onClick={() => setShowModelDropdown(!showModelDropdown)}
                            disabled={!selectedBrand || loadingModels}
                        >
                            {loadingModels ? (
                                <><Loader2 className="spin" size={16} /> Loading...</>
                            ) : selectedModel ? (
                                <><Check size={16} className="text-green" /> {selectedModel}</>
                            ) : (
                                <>Select model</>
                            )}
                            <ChevronDown size={16} className={showModelDropdown ? 'rotate' : ''} />
                        </button>

                        <AnimatePresence>
                            {showModelDropdown && (
                                <motion.div
                                    className="pid-dropdown"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className="pid-dropdown-search">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search models..."
                                            value={modelSearch}
                                            onChange={(e) => setModelSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="pid-dropdown-list">
                                        {filteredModels.length > 0 ? (
                                            filteredModels.map(m => (
                                                <button
                                                    key={m.model}
                                                    className={`pid-dropdown-item ${selectedModel === m.model ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedModel(m.model);
                                                        setSelectedVariant('');
                                                        setShowModelDropdown(false);
                                                        setModelSearch('');
                                                    }}
                                                >
                                                    <div>
                                                        {m.model}
                                                        {m.specifications?.msrp && (
                                                            <span className="pid-msrp">
                                                                ₹{m.specifications.msrp.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {selectedModel === m.model && <Check size={14} />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="pid-dropdown-empty">
                                                {!selectedBrand ? 'Select a brand first' : 'No models found'}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <input
                        type="text"
                        className="pid-text-input"
                        placeholder="Enter model name"
                        value={manualModel}
                        onChange={(e) => setManualModel(e.target.value)}
                    />
                )}
            </div>

            {/* Variant Selection (if product has variants) */}
            {productDetails?.variants?.length > 0 && (
                <div className="pid-field">
                    <label>Variant (optional)</label>
                    <div className="pid-variant-grid">
                        {productDetails.variants.map((v, i) => (
                            <button
                                key={i}
                                className={`pid-variant-btn ${selectedVariant === v.name ? 'selected' : ''}`}
                                onClick={() => setSelectedVariant(v.name)}
                            >
                                {v.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Manual Entry Toggle */}
            {manualEntry && (
                <button
                    className="pid-back-to-dropdown"
                    onClick={() => {
                        setManualEntry(false);
                        setManualBrand('');
                        setManualModel('');
                    }}
                >
                    ← Back to dropdown selection
                </button>
            )}

            {/* Unique ID Section */}
            <div className="pid-unique-id-section">
                <div className="pid-unique-id-header">
                    <IdIcon size={18} />
                    <div>
                        <h4>{IdTypeConfig.label}</h4>
                        <p>For product verification & anti-fraud protection</p>
                    </div>
                    <Shield size={18} className="text-gold" />
                </div>

                <div className="pid-unique-id-input-wrapper">
                    <input
                        type="text"
                        className={`pid-unique-id-input ${idValidation?.valid === true && !idValidation?.duplicate ? 'valid' :
                                idValidation?.valid === false || idValidation?.duplicate ? 'invalid' : ''
                            }`}
                        placeholder={IdTypeConfig.placeholder}
                        value={uniqueIdValue}
                        onChange={(e) => setUniqueIdValue(e.target.value)}
                        inputMode={IdTypeConfig.inputMode}
                        maxLength={IdTypeConfig.maxLength}
                    />

                    {isValidating && (
                        <Loader2 className="pid-validating-spinner spin" size={18} />
                    )}

                    {!isValidating && idValidation?.valid === true && !idValidation?.duplicate && (
                        <Check className="pid-valid-icon" size={18} />
                    )}

                    {!isValidating && (idValidation?.valid === false || idValidation?.duplicate) && (
                        <AlertCircle className="pid-invalid-icon" size={18} />
                    )}
                </div>

                {/* Validation message */}
                {idValidation && (
                    <div className={`pid-validation-message ${idValidation.valid && !idValidation.duplicate ? 'success' : 'error'
                        }`}>
                        {idValidation.valid && !idValidation.duplicate ? (
                            <>✓ Valid {uniqueIdType.toUpperCase()} - Will be shown as {idValidation.masked}</>
                        ) : idValidation.duplicate ? (
                            <>⚠️ This {uniqueIdType.toUpperCase()} is already registered to another listing</>
                        ) : (
                            <>⚠️ {idValidation.error}</>
                        )}
                    </div>
                )}

                {/* Hint */}
                <div className="pid-hint">
                    <Camera size={14} />
                    <span>{productDetails?.uniqueIdConfig?.instructions || IdTypeConfig.hint}</span>
                </div>

                {/* Optional badge */}
                <div className="pid-optional-note">
                    Optional, but verified products sell 40% faster
                </div>
            </div>
        </div>
    );
};

export default ProductIdentificationStep;
