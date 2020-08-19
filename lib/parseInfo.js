const redis = require('./redisSingleton');
const INFO_SECTIONS = ['all', 'default', 'server', 'clients', 'memory', 'persistence', 'stats', 'replication', 'cpu', 'cluster', 'keyspace'];

module.exports.redisGetInfo = (section = 'default') => {

    let returnInfo = {}
    let redisLatency;
    return new Promise(function(resolve, reject) {

        if(section){
            if(typeof section !== 'string' || !INFO_SECTIONS.includes(section.toLocaleLowerCase())){
                reject(`section must be a string and should be either: ${String(INFO_SECTIONS).replace(/,/g, ' | ')}`);
            }
        }

        let redisLatencyStart = new Date(Date.now()).getTime();
        redis.info(section)
        .then(response => {
            redisLatency = new Date(Date.now()).getTime() - redisLatencyStart;
            processData(response);

        })
        .catch(error => {
            reject(error);
        })

        function processData(data){
            let splitResponse = data.split('\r\n');
    
                let sectionName;
                for(let i = 0; i < splitResponse.length; i++){
                    if(splitResponse[i][0] === '#' && !sectionName){
                        sectionName = splitResponse[i].replace('# ', '');
                        sectionName = sectionName.toLocaleLowerCase();
                        returnInfo[sectionName] = {};
    
                    }else if(sectionName && splitResponse[i][0] !== '#' && splitResponse[i] !== ''){
                        let splittedParameter = splitResponse[i].split(':');
                        returnInfo[sectionName][splittedParameter[0]] = (!isNaN(splittedParameter[1]) ? Number(splittedParameter[1]) : splittedParameter[1]);
    
                    }else if(splitResponse[i] === '' && i < splitResponse.length-2){
                        sectionName = undefined;
    
                    }else{
                        returnInfo.instance = {};
                        returnInfo.instance.options = redis.options;
                        returnInfo.stats.latency = redisLatency;
                        resolve(returnInfo);
                    }
                }
        }

    })

}