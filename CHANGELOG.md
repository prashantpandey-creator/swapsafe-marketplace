# Changelog

## [Unreleased] - 2026-01-31

### Added
- **Inventory Management (Sellers)**
    - "Edit Listing" page allowing sellers to update titles, prices, descriptions, and images.
    - "Delete Listing" functionality with confirmation prompts.
    - integrated "Mark as Sold" action in Dashboard to manually close listings.
    - Real-time inventory fetching in Dashboard from backend API.

- **Order Management (Buyers)**
    - "My Orders" tab in Dashboard displaying full purchase history.
    - "Track Order" integration linking directly from order history.
    - Real-time order data fetching replacing mock transactions.
    - Logic for different order statuses: `payment_pending`, `paid` (In Escrow), `completed`.

- **Trust & Safety**
    - "Report Listing" button on Product Details page for flagging suspicious items.
    - Backend API endpoints for reporting and preliminary trust scoring.
    - User-friendly Empty States for Dashboard tabs (Listings, Orders).

- **Core & Polish**
    - `WishlistContext` implemented using LocalStorage for persistent "Saved Items".
    - Functional "Heart" icon on Product Cards to toggle wishlist status.
    - `/search` route alias ensuring search navigation works correctly.
    - Global Dashboard access with consolidated "Overview" stats.

### Changed
- **Dashboard**: Refactored to use `paymentAPI` and `listingsAPI` instead of mock data.
- **App Structure**: Wrapped application in `WishlistProvider` for global state access.
- **Product Card**: Updated to reflect real "Like" status and "Mark as Sold" actions.

### Fixed
- Fixed broken links in Header search.
- Resolved build errors related to missing CSS files.
- Corrected icon imports in Product Detail page.
