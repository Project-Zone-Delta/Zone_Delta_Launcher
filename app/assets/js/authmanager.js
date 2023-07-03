/**
 * AuthManager
 * 
 * This module aims to abstract login procedures. Results from Mojang's REST api
 * are retrieved through our Mojang module. These results are processed and stored,
 * if applicable, in the config using the ConfigManager. All login procedures should
 * be made through this module.
 * 
 * @module authmanager
 */
// Requirements
const ConfigManager                     = require('./configmanager')
const { LoggerUtil }                    = require('helios-core')
const { RestResponseStatus }            = require('helios-core/common')

//const azAuth = require('azuriom-auth')
const { AZauth } = require('minecraft-java-core')
const auth = new AZauth('https://zone-delta.xyz');

const log                               = LoggerUtil.getLogger('AuthManager')

// Functions

/**
 * Add a Mojang account. This will authenticate the given credentials with Mojang's
 * authserver. The resultant data will be stored as an auth account in the
 * configuration database.
 * 
 * @param {string} email The account username (email if migrated).
 * @param {string} password The account password.
 * @param {number} a2f The account a2f
 * @returns {Promise.<Object>} Promise which resolves the resolved authenticated account object.
 */
exports.addMojangAccount = async function(email, password, a2f) {
    let result

    if (a2f === null)
        result = await auth.login(email, password);
    else
        result = await auth.login(email, password, a2f);

    if (result.A2F) 
        return {needA2F: true}

    if (result.error) 
        throw 'Unexpected result: ' + JSON.stringify(result)
    
    const ret = ConfigManager.addAzAuthAccount(result)
    ConfigManager.save()

    return ret
}

const AUTH_MODE                         = { FULL: 0, MS_REFRESH: 1, MC_REFRESH: 2 }

/**
 * Calculate the expiry date. Advance the expiry time by 10 seconds
 * to reduce the liklihood of working with an expired token.
 * 
 * @param {number} nowMs Current time milliseconds.
 * @param {number} epiresInS Expires in (seconds)
 * @returns 
 */
function calculateExpiryDate(nowMs, epiresInS) {
    return nowMs + ((epiresInS-10)*1000)
}

/**
 * Remove a Mojang account. This will invalidate the access token associated
 * with the account and then remove it from the database.
 * 
 * @param {string} uuid The UUID of the account to be removed.
 * @returns {Promise.<void>} Promise which resolves to void when the action is complete.
 */
exports.removeMojangAccount = async function(uuid){
    try {
        const authAcc                   = ConfigManager.getAuthAccount(uuid)
        const response                  = await MojangRestAPI.invalidate(authAcc.accessToken, ConfigManager.getClientToken())
        if(response.responseStatus === RestResponseStatus.SUCCESS) {
            ConfigManager.removeAuthAccount(uuid)
            ConfigManager.save()
            return Promise.resolve()
        } else {
            log.error('Error while removing account', response.error)
            return Promise.reject(response.error)
        }
    } catch (err){
        log.error('Error while removing account', err)
        return Promise.reject(err)
    }
}

/**
 * Remove a AzAuth account. This will invalidate the access token associated
 * with the account and then remove it from the database.
 * 
 * @param {string} uuid The UUID of the account to be removed.
 * @param {string} accessToken The UUID of the account to be removed.
 * @returns {Promise.<void>} Promise which resolves to void when the action is complete.
 */
exports.removeAzAuthAccount = async function(uuid, accessToken) {
    try {
        const authAcc = ConfigManager.getAuthAccount(uuid)
        ConfigManager.removeAuthAccount(uuid)
        ConfigManager.save()
        return Promise.resolve()
    } catch (err){
        log.error('Error while removing account', err)
        return Promise.reject(err)
    }
}

/**
 * Validate the selected account with Mojang's authserver. If the account is not valid,
 * we will attempt to refresh the access token and update that value. If that fails, a
 * new login will be required.
 * 
 * @returns {Promise.<boolean>} Promise which resolves to true if the access token is valid,
 * otherwise false.
 */
async function validateSelectedMojangAccount() {
    const current                       = ConfigManager.getSelectedAccount()

    return true;
}

/**
 * Validate the selected auth account.
 * 
 * @returns {Promise.<boolean>} Promise which resolves to true if the access token is valid,
 * otherwise false.
 */
exports.validateSelected = async function(){
    const current                       = ConfigManager.getSelectedAccount()
    
    return await validateSelectedMojangAccount()
}