const { LoggerUtil } = require('helios-core')

const logger = LoggerUtil.getLogger('DistroManager')

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
     * 
     * @returns {number}
     */
    getMinRam() {
        return this.minRam
    }

    /**
     * 
     * @returns {string}
     */
    getMaxRam() {
        return this.maxRam
    }

    /**
     * @returns {boolean} Whether or not the server is autoconnect.
     * by default.
     */
    isAutoConnect(){
        return this.autoconnect
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
                this.mainServer = serv.name
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

let DEV_MODE = false

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