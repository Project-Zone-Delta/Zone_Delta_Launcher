const fs = require('fs')
const path = require('path')
const request = require('request')
const { LoggerUtil } = require('helios-core')

const ConfigManager = require('./configmanager')

const logger = LoggerUtil.getLogger('DistroManager')

/**
 * Represents the download information
 * for a specific module.
 */
class Artifact {
    
    /**
     * Parse a JSON object into an Artifact.
     * 
     * @param {Object} json A JSON object representing an Artifact.
     * 
     * @returns {Artifact} The parsed Artifact.
     */
    static fromJSON(json){
        return Object.assign(new Artifact(), json)
    }

    /**
     * Get the MD5 hash of the artifact. This value may
     * be undefined for artifacts which are not to be
     * validated and updated.
     * 
     * @returns {string} The MD5 hash of the Artifact or undefined.
     */
    getHash(){
        return this.MD5
    }

    /**
     * @returns {number} The download size of the artifact.
     */
    getSize(){
        return this.size
    }

    /**
     * @returns {string} The download url of the artifact.
     */
    getURL(){
        return this.url
    }

    /**
     * @returns {string} The artifact's destination path.
     */
    getPath(){
        return this.path
    }

}
exports.Artifact

/**
 * Represents a the requirement status
 * of a module.
 */
class Required {
    
    /**
     * Parse a JSON object into a Required object.
     * 
     * @param {Object} json A JSON object representing a Required object.
     * 
     * @returns {Required} The parsed Required object.
     */
    static fromJSON(json){
        if(json == null){
            return new Required(true, true)
        } else {
            return new Required(json.value == null ? true : json.value, json.def == null ? true : json.def)
        }
    }

    constructor(value, def){
        this.value = value
        this.default = def
    }

    /**
     * Get the default value for a required object. If a module
     * is not required, this value determines whether or not
     * it is enabled by default.
     * 
     * @returns {boolean} The default enabled value.
     */
    isDefault(){
        return this.default
    }

    /**
     * @returns {boolean} Whether or not the module is required.
     */
    isRequired(){
        return this.value
    }

}
exports.Required

/**
 * Represents a server configuration.
 */
class Server {

    /**
     * Parse a JSON object into a Server.
     * 
     * @param {Object} json A JSON object representing a Server.
     * 
     * @returns {Server} The parsed Server object.
     */
    static fromJSON(json){

        const serv = Object.assign(new Server(), json)

        return serv
    }

    /**
     * @returns {string} The ID of the server.
     */
    getID(){
        return this.name
    }

    /**
     * @returns {string} The name of the server.
     */
    getName(){
        return this.displayName
    }

    /**
     * @returns {string} The description of the server.
     */
    getDescription(){
        return this.description
    }

    /**
     * @returns {string} The URL of the server's icon.
     */
    getIcon(){
        return this.icon
    }

    /**
     * @returns {string} The version of the server configuration.
     */
    getVersion(){
        return this.version
    }

    /**
     * @returns {string} The IP address of the server.
     */
    getAddress(){
        return this.address
    }

    /**
     * @returns {string} The minecraft version of the server.
     */
    getMinecraftVersion(){
        return this.loadder.minecraft_version
    }

    /**
     * @returns {boolean} Whether or not this server is the main
     * server. The main server is selected by the launcher when
     * no valid server is selected.
     */
    isMainServer(){
        return this.mainServer
    }

    /**
     * @returns {boolean} Whether or not the server is autoconnect.
     * by default.
     */
    isAutoConnect(){
        return this.autoconnect
    }

    getThis() {
        return this;
    }
}
exports.Server

/**
 * Represents the Distribution Index.
 */
class DistroIndex {

    /**
     * Parse a JSON object into a DistroIndex.
     * 
     * @param {Object} json A JSON object representing a DistroIndex.
     * 
     * @returns {DistroIndex} The parsed Server object.
     */
    static fromJSON(json){

        const servers = json.servers

        const distro = Object.assign(new DistroIndex(), json)
        console.log(servers)
        distro._resolveServers(json, servers)
        distro._resolveMainServer()

        return distro
    }

    _resolveServers(data, json){
        const arr = []
        for(let i = 0 ; i < json.length; i++){
            arr.push(Server.fromJSON(data[json[i]]))
        }
        this.servers = arr
    }

    _resolveMainServer(){

        for(let serv of this.servers){
            if(serv.mainServer){
                this.mainServer = serv.id
                return
            }
        }

        // If no server declares default_selected, default to the first one declared.
        this.mainServer = (this.servers.length > 0) ? this.servers[0].getID() : null
    }

    /**
     * @returns {string} The version of the distribution index.
     */
    getVersion(){
        return this.version
    }

    /**
     * @returns {string} The URL to the news RSS feed.
     */
    getRSS(){
        return this.rss
    }

    /**
     * @returns {Array.<Server>} An array of declared server configurations.
     */
    getServers(){
        return this.servers
    }

    /**
     * Get a server configuration by its ID. If it does not
     * exist, null will be returned.
     * 
     * @param {string} id The ID of the server.
     * 
     * @returns {Server} The server configuration with the given ID or null.
     */
    getServer(id){
        for(let serv of this.servers){
            if(serv.name === id){
                return serv
            }
        }
        return null
    }

    /**
     * Get the main server.
     * 
     * @returns {Server} The main server.
     */
    getMainServer(){
        return this.mainServer != null ? this.getServer(this.mainServer) : null
    }

}
exports.DistroIndex

exports.Types = {
    Library: 'Library',
    ForgeHosted: 'ForgeHosted',
    Forge: 'Forge', // Unimplemented
    LiteLoader: 'LiteLoader',
    ForgeMod: 'ForgeMod',
    LiteMod: 'LiteMod',
    File: 'File',
    VersionManifest: 'VersionManifest'
}

let DEV_MODE = false

const DISTRO_PATH = path.join(ConfigManager.getLauncherDirectory(), 'distribution.json')
const DEV_PATH = path.join(ConfigManager.getLauncherDirectory(), 'dev_distribution.json')

let data = null

/**
 * @returns {Promise.<DistroIndex>}
 */
exports.pullRemote = function(){
    
    return new Promise(async (resolve, reject) => {
        const distroURL = 'http://node.zone-delta.xyz:25008/'

        let distroInfos
        const distro = await fetch(distroURL)
        
        distroInfos = await distro.json()

        data = DistroIndex.fromJSON(distroInfos)
        console.log(data)

        resolve(data)
        return
    })
}

exports.setDevMode = function(value){
    if(value){
        logger.info('Developer mode enabled.')
        logger.info('If you don\'t know what that means, revert immediately.')
    } else {
        logger.info('Developer mode disabled.')
    }
    DEV_MODE = value
}

exports.isDevMode = function(){
    return DEV_MODE
}

/**
 * @returns {DistroIndex}
 */
exports.getDistribution = function(){
    return data
}