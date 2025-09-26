/**
 * Claudyne Parent Interface - User Data Manager
 * Centralizes user data access and management
 */

class UserManager {
    constructor() {
        this.currentUser = null;
        this.currentFamily = null;
        this.loadUserData();
    }

    // Load user data from localStorage
    loadUserData() {
        try {
            const userStr = localStorage.getItem('claudyne_user');
            const familyStr = localStorage.getItem('claudyne_family');

            if (userStr) {
                this.currentUser = JSON.parse(userStr);
            }

            if (familyStr) {
                this.currentFamily = JSON.parse(familyStr);
            }
        } catch (error) {
            console.warn('[UserManager] Error loading user data:', error);
        }
    }

    // Save user data from API response
    saveUserData(loginResponse) {
        try {
            if (loginResponse?.data?.user) {
                this.currentUser = loginResponse.data.user;
                localStorage.setItem('claudyne_user', JSON.stringify(this.currentUser));
            }

            if (loginResponse?.data?.family) {
                this.currentFamily = loginResponse.data.family;
                localStorage.setItem('claudyne_family', JSON.stringify(this.currentFamily));
            }
        } catch (error) {
            console.warn('[UserManager] Error saving user data:', error);
        }
    }

    // Get current user
    getUser() {
        return this.currentUser || {
            firstName: 'Utilisateur',
            lastName: '',
            email: 'user@claudyne.com'
        };
    }

    // Get current family
    getFamily() {
        return this.currentFamily || {
            name: 'Ma Famille',
            displayName: 'Ma Famille'
        };
    }

    // Get user's full name
    getUserFullName() {
        const user = this.getUser();
        return `${user.firstName} ${user.lastName}`.trim();
    }

    // Get user's first name
    getUserFirstName() {
        const user = this.getUser();
        return user.firstName || 'Utilisateur';
    }

    // Get family name
    getFamilyName() {
        const family = this.getFamily();
        return family.displayName || family.name || 'Ma Famille';
    }

    // Get user ID
    getUserId() {
        const user = this.getUser();
        return user.id || 'guest-user';
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!(this.currentUser && localStorage.getItem('claudyne_token'));
    }

    // Clear user data (logout)
    clearUserData() {
        this.currentUser = null;
        this.currentFamily = null;
        localStorage.removeItem('claudyne_user');
        localStorage.removeItem('claudyne_family');
        localStorage.removeItem('claudyne_token');
        localStorage.removeItem('claudyne_refresh_token');
    }
}

// Create and export singleton instance
export const userManager = new UserManager();
export default userManager;