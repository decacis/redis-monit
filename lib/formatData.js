const { redisGetInfo } = require('./parseInfo');
const fs = require('fs');
const path = require('path');
const os = require('os');
const settings = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'settings.json'), { encoding: 'utf8' }));

let statsLogPath = (settings.statsLogPath !== '' ? settings.statsLogPath : path.join(os.tmpdir(), 'redis_monit_log_history.json'));

module.exports = (deleteBefore) => {
    return new Promise(function (resolve, reject){
        let logList;
        fs.access(statsLogPath, fs.F_OK, (err) => {
            if (err) {
                // File doesn't exists
                fs.writeFile(statsLogPath, '[]', { encoding: 'utf8' }, err => {
                    if(err) reject(err);

                    // File created
                    logList = [];
                    gettingInfo();
                })
            }else{
                if(deleteBefore){
                    fs.unlink(statsLogPath, unl_err => {
                        if(!unl_err){
                            fs.writeFile(statsLogPath, '[]', { encoding: 'utf8' }, w_err => {
                                if(w_err) reject(w_err);
            
                                // File created
                                fileExistsReadIt();
                            })
                        }else{
                            reject(unl_err)
                        }
                    })
                    
                }else{
                    fileExistsReadIt();
                }

                function fileExistsReadIt(){
                    // File exists
                    fs.readFile(statsLogPath, (read_err, read_data) => {
                        if(!read_err){
                            try {
                                logList = JSON.parse(read_data);
                                gettingInfo();
                            } catch (json_parse_err) {
                                reject(json_parse_err)
                            }
                        }else{
                            reject(read_err);
                        }
                    })
                }
            }
        })

        function gettingInfo(){
            redisGetInfo()
            .then(redisInfo => {
                let usefulInfo = {};

                // Timestamp
                usefulInfo.timestamp = new Date(Date.now()).getTime();

                // Instance
                usefulInfo.instance = {}
                usefulInfo.instance.id = `${redisInfo.instance.options.host}:${redisInfo.instance.options.port}`
                usefulInfo.instance.redis_version = redisInfo.server.redis_version;
                usefulInfo.instance.process_id = redisInfo.server.process_id;
                usefulInfo.instance.uptime_in_seconds = redisInfo.server.uptime_in_seconds;
                usefulInfo.instance.uptime_in_days = redisInfo.server.uptime_in_days;
                usefulInfo.instance.gcc_version = redisInfo.server.gcc_version;
                usefulInfo.instance.role = redisInfo.replication.role;
                usefulInfo.instance.connected_slaves = redisInfo.replication.connected_slaves;
                usefulInfo.instance.aof_enabled = Boolean(redisInfo.persistence.aof_enabled);
                usefulInfo.instance.maxmemory_human = redisInfo.memory.maxmemory_human;
                usefulInfo.instance.maxmemory_policy = redisInfo.memory.maxmemory_policy;

                // Basic
                usefulInfo.basic = {};
                usefulInfo.basic.connected_clients = redisInfo.clients.connected_clients;
                usefulInfo.basic.connected_slaves = redisInfo.replication.connected_slaves;
                if(redisInfo.replication.master_last_io_seconds_ago){
                    usefulInfo.basic.master_last_io_seconds_ago = redisInfo.replication.master_last_io_seconds_ago;
                }
                if(Object.keys(redisInfo.keyspace).length > 0){
                    // One or more dbs
                    usefulInfo.basic.keyspace = {};
                    Object.keys(redisInfo.keyspace).forEach(db => {
                        usefulInfo.basic.keyspace[db] = parseDbs(redisInfo.keyspace[db]);

                        if(logList.length > 0){
                            for(let i = 0; i < logList.length; i++){
                                if(Object.keys(logList[i].basic.keyspace).length > 0){

                                    Object.keys(logList[i].basic.keyspace).forEach(db2 =>{
                                        if(Object.keys(redisInfo.keyspace).length > 0 && !Object.keys(redisInfo.keyspace).includes(db2)){
                                            usefulInfo.basic.keyspace[db2] = {
                                                keys: 0,
                                                expires: 0,
                                                avg_ttl: 0
                                            }
                                        }
                                    })
                                }
                            }
                        }
                    })
                // No dbs now
                }else{
                    usefulInfo.basic.keyspace = {};
                    if(logList.length > 0){
                        for(let i = 0; i < logList.length; i++){
                            if(Object.keys(logList[i].basic.keyspace).length > 0){

                                Object.keys(logList[i].basic.keyspace).forEach(db2 =>{
                                    usefulInfo.basic.keyspace[db2] = {
                                        keys: 0,
                                        expires: 0,
                                        avg_ttl: 0
                                    }
                                })
                            }
                        }
                    }
                }

                // Performance
                usefulInfo.performance = {};
                usefulInfo.performance.latency_ms = redisInfo.stats.latency;
                usefulInfo.performance.instantaneous_ops_per_sec = redisInfo.stats.instantaneous_ops_per_sec;
                usefulInfo.performance.hit_rate = (redisInfo.stats.keyspace_hits > 0 ? (redisInfo.stats.keyspace_hits / (redisInfo.stats.keyspace_hits + redisInfo.stats.keyspace_misses)) : 0);

                // Memory
                usefulInfo.memory = {};
                usefulInfo.memory.used_memory = redisInfo.memory.used_memory;
                usefulInfo.memory.mem_fragmentation_ratio = redisInfo.memory.mem_fragmentation_ratio;
                usefulInfo.memory.evicted_keys = redisInfo.stats.evicted_keys;
                usefulInfo.memory.blocked_clients = redisInfo.clients.blocked_clients;

                // Persistence
                usefulInfo.persistence = {};
                usefulInfo.persistence.rdb_last_save_time_ms = redisInfo.persistence.rdb_last_save_time*1000;
                usefulInfo.persistence.rdb_changes_since_last_save = redisInfo.persistence.rdb_changes_since_last_save;

                // Error
                usefulInfo.error = {};
                usefulInfo.error.rejected_connections = redisInfo.stats.rejected_connections;
                usefulInfo.error.keyspace_misses = redisInfo.stats.keyspace_misses;
                if(redisInfo.replication.master_link_down_since_seconds){
                    usefulInfo.error.master_link_down_since_ms = redisInfo.replication.master_link_down_since_seconds*1000;
                }

                if(settings.logsToKeep > 0 && logList.length === settings.logsToKeep) logList.pop();
                logList.unshift(usefulInfo);

                fs.writeFile(statsLogPath, JSON.stringify(logList), { encoding: 'utf8' }, w_err => {
                    if(!w_err){
                        resolve(logList);
                    }else{
                        reject(w_err);
                    }
                })

            })
            .catch(redisInfoError => {
                reject(redisInfoError);
            })
        }

        function parseDbs(dbstring){
            let returnDbstringObj = {};
            let splitParameters = dbstring.split(',');

            splitParameters.forEach(param => {
                let splitParam = param.split('=');

                returnDbstringObj[splitParam[0]] = (!isNaN(splitParam[1]) ? Number(splitParam[1]) : splitParam[1]);
            })

            return returnDbstringObj;
        }

    })
}