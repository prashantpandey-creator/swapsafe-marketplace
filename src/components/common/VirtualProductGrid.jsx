import React from 'react';
import { Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import ProductCard from './ProductCard';

/**
 * VirtualProductGrid
 * 
 * High-performance grid rendering for large product lists using react-window v2.
 * Uses virtualization to render only visible items for better performance.
 * Automatically responsive with AutoSizer.
 * 
 * @param {Array} products - List of product objects
 * @param {boolean} isLoading - Loading state
 */
const VirtualProductGrid = ({ products, isLoading }) => {
    // Responsive column calculation
    const getColumnCount = (width) => {
        if (width < 640) return 1;      // Mobile
        if (width < 1024) return 2;     // Tablet
        if (width < 1400) return 3;     // Desktop
        return 4;                       // Large Desktop
    };

    const GUTTER_SIZE = 24;
    const CARD_HEIGHT = 380; // Estimated card height including gaps

    // Cell component for react-window v2
    const CellComponent = ({ rowIndex, columnIndex, style, products, columnCount }) => {
        const index = rowIndex * columnCount + columnIndex;

        // If index is out of bounds (padding for last row)
        if (index >= products.length) return null;

        const product = products[index];

        // Adjust style to account for gutters
        const gutterStyle = {
            ...style,
            left: style.left + GUTTER_SIZE,
            top: style.top + GUTTER_SIZE,
            width: style.width - GUTTER_SIZE,
            height: style.height - GUTTER_SIZE
        };

        return (
            <div style={gutterStyle}>
                <ProductCard product={product} />
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="products-grid mt-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="product-card-skeleton">
                        <div className="skeleton-image"></div>
                        <div className="skeleton-info">
                            <div className="skeleton-line"></div>
                            <div className="skeleton-line short"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="no-results">
                <div className="no-results-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3>No Items Found</h3>
                <p>Try adjusting your search or filters to find what you're looking for.</p>
            </div>
        );
    }

    return (
        <div style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
            <AutoSizer>
                {({ height, width }) => {
                    const columnCount = getColumnCount(width);
                    const rowCount = Math.ceil(products.length / columnCount);
                    const columnWidth = width / columnCount;

                    return (
                        <Grid
                            className="virtual-grid-container custom-scrollbar"
                            cellComponent={CellComponent}
                            cellProps={{ products, columnCount }}
                            columnCount={columnCount}
                            columnWidth={columnWidth}
                            defaultHeight={height}
                            defaultWidth={width}
                            rowCount={rowCount}
                            rowHeight={CARD_HEIGHT}
                        />
                    );
                }}
            </AutoSizer>
        </div>
    );
};

export default VirtualProductGrid;
