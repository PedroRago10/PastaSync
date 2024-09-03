const userModel = {
    id: null,
    name: null,
    email: null,
    role: null,
    imageUrl: null,
    companies: [],
    companyId: [],
    eventId: [],
    permissionName: null,
    permissionId: null,
    configurationsFrame: [],
    /**
     * Save the logged-in user's data.
     * @param {Object} userData - User data to be stored.
     */

    saveUserData(userData) {
        this.id = userData.id;
        this.name = userData.name;
        this.email = userData.email;
        this.imageUrl = userData.imageUrl;
        this.role = userData.role;
        this.companies = userData.companies || [];
        this.companyId = userData.companyId || '';
        this.eventId = userData.eventId || '';
        this.permissionId = userData.permissionId || '';
        this.permissionName = userData.permissionName || '';
    },

    /**
     * Clear the user data when logging out.
     */
    clearUserData() {
        this.id = null;
        this.name = null;
        this.email = null;
        this.imageUrl = null;
        this.role = null;
        this.companyId = [];
        this.companies = [];
        this.eventId = [];
        this.permissionId = null;
        this.permissionName = null;
    },

    /**
     * Get the logged-in user's data.
     * @returns {Object} - The logged-in user's data.
     */
    getUserData() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            imageUrl: this.imageUrl,
            companyId: this.companyId,
            companies: this.companies,
            eventId: this.eventId,
            permissionId: this.permissionId,
            permissionName: this.permissionName,
            configurationsFrame: this.configurationsFrame
        };
    },

    /**
     * Update the company data for the logged-in user.
     * @param {Array} matchingCompanies - The filtered matching companies.
     */
    updateCompanyData(matchingCompanies) {

        this.companies = matchingCompanies.map(company => ({
            id: company.id,
            name: company.name,
        }));

    },

    /**
     * Update the event data for the logged-in user.
     * @param {Array} matchingEvents - The filtered matching events.
     */
    updateEventData(matchingEvents) {
        this.events = matchingEvents.map(event => ({
            id: event._id,
            name: event.name,
        }));
    },


    /**
     * Update the companyId and eventId fields.
     * @param {String} newCompanyId - The new company ID.
     * @param {String} newEventId - The new event ID.
     */
    updateCompanyAndEventIds(newCompanyId, newEventId) {
        this.companyId = [newCompanyId];
        this.eventId = [newEventId];
    },

    /**
     * Update frames configs
     * @param {String} frame - The toogle status
     * @param {String} horizontal - The url image frame horizontal
     * @param {String} vertical - The url image frame vertical
     */
    updateFrameConfig(configurationsFrame) {
        this.configurationsFrame = configurationsFrame;
    }
};

module.exports = userModel;
