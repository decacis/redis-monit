let charts = {
    basic: {},
    performance: {},
    memory: {},
    persistence: {},
    error: {}
};

let interv;
let ttlval;
let startStatsTimes = 0;
let autostart = true;
let animations = true;
let animationsObj = {};

// Zoom plugin
const zoom = {
    // Container for pan options
    pan: {
        enabled: false,
        mode: 'x'
    },
    // Container for zoom options
    zoom: {
        enabled: true,
        drag: {
                borderColor: 'rgba(225,225,225,0.3)',
                borderWidth: 5,
                backgroundColor: 'rgb(225,225,225)',
                animationDuration: 0
        },
        speed: 0.05,
        mode: 'x',
    }
}

window.addEventListener('load', () => {
    fetch('/info')
    .then(resp => {
        resp.json()
        .then(INFOJSON => {
            // Setting TTL
            ttlval = INFOJSON.ttl;

            autostart = INFOJSON.autostart;

            // Setting animations
            animations = INFOJSON.enableAnimations;
            if(!animations){
                animationsObj = {
                    animation: {
                        duration: 0
                    },
                    hover: {
                        animationDuration: 0
                    },
                    responsiveAnimationDuration: 0
                }
            }

            // Loading data
            if(autostart){
                document.getElementById('startStats').classList.add('disabled');
                loadData(true);
                interv = setInterval(() => {
                    loadData();
                }, INFOJSON.ttl*1000);
            }else{
                document.getElementById('stopStats').classList.add('disabled');
            }
        })
        .catch(INFOERR => {
            clearInterval(interv);
            alert(INFOERR);
        })
    })
    .catch(infoErr => {
        clearInterval(interv);
        alert(infoErr);
    })

    document.getElementById('stopStats').addEventListener('click', () => {
        toggleStats('stop')
    })
    document.getElementById('startStats').addEventListener('click', () => {
        toggleStats('start')
    })

    document.getElementById("draggableInfoInstanceClose").addEventListener('click', closeDraggable, false);

    document.getElementById('instanceInfoBtn').addEventListener('click', () => {
        if(document.getElementById('draggableInfoInstanceContainer').style.display !== 'none' && document.getElementById('draggableInfoInstanceContainer').style.display !== ''){
            closeDraggable(document.getElementById('draggableInfoInstanceContainer'), 'steve');
        }else{
            openDraggable(document.getElementById('draggableInfoInstanceContainer'));
        }
    })

    dragElement(document.getElementById("draggableInfoInstanceContainer"));
})

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "Header")) {
      // if present, the header is where you move the DIV from:
      document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }
  
    function dragMouseDown(e) {
    document.getElementById("draggableInfoInstanceContainerHeader").style.cursor = 'grabbing';
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:

      let newPosY;
      if((elmnt.offsetLeft - pos1) > 0){
        if(((elmnt.offsetLeft - pos1)+elmnt.offsetWidth) > window.innerWidth){
            newPosY = (window.innerWidth - elmnt.offsetWidth);
        }else{
            newPosY = (elmnt.offsetLeft - pos1);
        }
      }else{
          newPosY = 0;
      }

      let newPosX;
      if((elmnt.offsetTop - pos2) > 0){
        if(((elmnt.offsetTop - pos2)+elmnt.offsetHeight) > window.innerHeight){
            newPosX = (window.innerHeight - elmnt.offsetHeight);
        }else{
            newPosX = (elmnt.offsetTop - pos2);
        }
      }else{
            newPosX = 0;
      }
      
      elmnt.style.top = newPosX + "px";
      elmnt.style.left = newPosY + "px";
    }
  
    function closeDragElement() {
        document.getElementById("draggableInfoInstanceContainerHeader").style.cursor = 'grab';
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
}

function openDraggable(e){
    e.style.display = 'block';
    document.getElementById('instanceInfoBtn').innerText = 'Hide instance information';
}
function closeDraggable(e, type){
    let targetElem = type ? e.children[1].children[0] : e.target; // I'm trutly sorry for this
    let elementDraggable = (targetElem.parentElement).parentElement;
    elementDraggable.style.display = 'none';
    document.getElementById('instanceInfoBtn').innerText = 'Show instance information';
}

function loadData(renderCharts){
    fetch('/stats')
    .then(response => {

        // Get only section response
        let dat = {
            instance: {},
            basic: {},
            performance: {},
            memory: {},
            persistence: {},
            error: {}
        };
        response.json()
        .then(respJSON => {
            respJSON.forEach(element => {
                let timestamp = new Date(element.timestamp);

                Object.keys(element).forEach(section => {
                    // section = basic
                    if(section !== 'timestamp'){
                        Object.keys(element[section]).forEach(param => {
                            // param = connected_clients
                            if(param !== 'keyspace'){
                                if(param !== 'used_memory'){

                                    if(!dat[section][param]){
                                        dat[section][param] = [{y: element[section][param], x: timestamp}];
                                    }else{
                                        dat[section][param].push({y: element[section][param], x: timestamp});
                                    }

                                }else{

                                    let toInsert = round(element[section][param] / 1048576);
                                    if(!dat[section][param]){
                                        dat[section][param] = [{y: toInsert, x: timestamp}];
                                    }else{
                                        dat[section][param].push({y: toInsert, x: timestamp});
                                    }

                                }
                                
                            }else if(Object.keys(element[section][param]).length > 0){
                                Object.keys(element[section][param]).forEach(db => {
                                    // db = db0
                                    if(!dat[section][param]) dat[section][param] = {};

                                        // key = expires
                                        if(!dat[section][param][db]){
                                            dat[section][param][db] = [{
                                                label: 'Keys',
                                                borderColor: '#44bd32',
                                                data: [{y: element[section][param][db].keys, x: timestamp}],
                                                lineTension: 0
                                            },
                                            {
                                                label: 'Expires',
                                                borderColor: '#e84118',
                                                data: [{y: element[section][param][db].expires, x: timestamp}],
                                                lineTension: 0
                                            },
                                            {
                                                label: 'Average TTL (sec)',
                                                borderColor: '#487eb0',
                                                data: [{y: round(element[section][param][db].avg_ttl/1000), x: timestamp}],
                                                lineTension: 0
                                            }
                                        ];
                                        }else{
                                            dat[section][param][db][0].data.push({y: element[section][param][db].keys, x: timestamp})
                                            dat[section][param][db][1].data.push({y: element[section][param][db].expires, x: timestamp})
                                            dat[section][param][db][2].data.push({y: round(element[section][param][db].avg_ttl/1000), x: timestamp})
                                        }
                                })
                            }
                        })
                    }
                })

            });
            
            if(renderCharts){
                renderGraphs(dat);
            }else{
                updateCharts(dat);
            }
        })
        .catch(errr => {
            console.log(errr);
        })

        
        
    })
    .catch(err => {
        clearInterval(interv);
        alert(err);
    })
}


function renderGraphs(dt){

        // Instance info
        document.getElementById('redis_id').innerText = dt.instance.id[0].y;
        document.getElementById('redis_version').innerText = dt.instance.redis_version[0].y;
        document.getElementById('process_id').innerText = dt.instance.process_id[0].y;
        document.getElementById('uptime_in_seconds').innerText = dt.instance.uptime_in_seconds[0].y;
        document.getElementById('uptime_in_days').innerText = dt.instance.uptime_in_days[0].y;
        document.getElementById('gcc_version').innerText = dt.instance.gcc_version[0].y;
        document.getElementById('role').innerText = dt.instance.role[0].y;
        document.getElementById('connected_slaves').innerText = dt.instance.connected_slaves[0].y;
        document.getElementById('aof_enabled').innerText = dt.instance.aof_enabled[0].y;
        document.getElementById('maxmemory_human').innerText = dt.instance.maxmemory_human[0].y;
        document.getElementById('maxmemory_policy').innerText = dt.instance.maxmemory_policy[0].y;

        charts.basic.connected_clients = new Chart(document.getElementById('connectedClients').getContext('2d'), {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Connected clients',
                backgroundColor: '#487eb0',
                data: dt.basic.connected_clients,
                barPercentage: 0.95,
                categoryPercentage: 1
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    charts.basic.connected_slaves = new Chart(document.getElementById('connectedSlaves').getContext('2d'), {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Connected slaves',
                backgroundColor: '#487eb0',
                data: dt.basic.connected_slaves,
                barPercentage: 0.95,
                categoryPercentage: 1
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    let basicCharts = document.getElementById('basicCharts');
    while(basicCharts.children.length > 2){
        basicCharts.removeChild(basicCharts.lastChild);
    }
    if(dt.basic.keyspace && Object.keys(dt.basic.keyspace).length > 0){
        Object.keys(dt.basic.keyspace).forEach(key => {
            // key = db0
            let tempChartContainer = document.createElement('div');
                tempChartContainer.classList.add('chart');
            let tempChartCanvas = document.createElement('canvas');
                tempChartContainer.appendChild(tempChartCanvas);
                basicCharts.appendChild(tempChartContainer);
            new Chart(tempChartCanvas.getContext('2d'), {
                // The type of chart we want to create
                type: 'line',
                // The data for our dataset
                data: {
                    datasets: dt.basic.keyspace[key]
                },
                // Configuration options go here
                options: {
                    ...animationsObj,
                    plugins: {
                        zoom
                    },
                    title: {
                        display: true,
                        text: key
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                suggestedMin: 0,
                                suggestedMax: 10
                            }
                        }],
                        xAxes: [{
                            type: 'time',
                            time: {
                                stepSize: ttlval,
                                unit: 'second'
                            }
                        }]
                    }
                }
            });
        })
    }
    if(dt.basic.master_last_io_seconds_ago){
        document.getElementById('masterLastIoSecondsAgoTitle').innerText = 'Last time slave instance checked with master:';
        document.getElementById('masterLastIoSecondsAgo').innerText = new Date(new Date(Date.now()).getTime() - (dt.basic.master_last_io_seconds_ago*1000)).toLocaleString();

    }else if(document.getElementById('masterLastIoSecondsAgoTitle').innerText !== ''){
        document.getElementById('masterLastIoSecondsAgoTitle').innerText = '';
        document.getElementById('masterLastIoSecondsAgo').innerText = '';
    }

    // Performance
    charts.performance.latency_ms = new Chart(document.getElementById('latency').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Latency (ms)',
                borderColor: '#fbc531',
                data: dt.performance.latency_ms,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    charts.performance.instantaneous_ops_per_sec = new Chart(document.getElementById('instantaneousOpsPerSec').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Instantaneous ops per sec',
                borderColor: '#fbc531',
                data: dt.performance.instantaneous_ops_per_sec,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    charts.performance.hit_rate = new Chart(document.getElementById('hitRate').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Hit rate',
                borderColor: '#fbc531',
                data: dt.performance.hit_rate,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });

    // Memory
    charts.memory.used_memory = new Chart(document.getElementById('usedMemory').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Used memory (mb)',
                borderColor: '#9c88ff',
                data: dt.memory.used_memory,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 20 // 20 MB
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    charts.memory.mem_fragmentation_ratio = new Chart(document.getElementById('memFragmentationRatio').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Memory fragmentation ratio',
                borderColor: '#9c88ff',
                data: dt.memory.mem_fragmentation_ratio,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 10
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    charts.memory.evicted_keys = new Chart(document.getElementById('evictedKeys').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Evicted keys',
                borderColor: '#9c88ff',
                data: dt.memory.evicted_keys,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    charts.memory.blocked_clients = new Chart(document.getElementById('blockedClients').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Blocked clients',
                borderColor: '#9c88ff',
                data: dt.memory.blocked_clients,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });

    // Persistence
    document.getElementById('lastSaveTime').innerText = new Date(dt.persistence.rdb_last_save_time_ms[0].y).toLocaleString();
    charts.persistence.rdb_changes_since_last_save = new Chart(document.getElementById('rdbChangesSinceLastSave').getContext('2d'), {
        // The type of chart we want to create
        type: 'bar',
        // The data for our dataset
        data: {
            datasets: [{
                label: '[RDB] Changes since last save',
                backgroundColor: '#44bd32',
                data: dt.persistence.rdb_changes_since_last_save,
                barPercentage: 0.95,
                categoryPercentage: 1
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 50
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });

    // Error
    charts.error.rejected_connections = new Chart(document.getElementById('rejectedConnections').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Rejected connections',
                borderColor: '#e84118',
                data: dt.error.rejected_connections,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 50
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    charts.error.keyspace_misses = new Chart(document.getElementById('keyspaceMisses').getContext('2d'), {
        // The type of chart we want to create
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
                label: 'Keyspace misses',
                borderColor: '#e84118',
                data: dt.error.keyspace_misses,
                lineTension: 0
            }]
        },
        // Configuration options go here
        options: {
            ...animationsObj,
            plugins: {
                zoom
            },
            tooltips: {
                mode: 'nearest',
                intersect: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 50
                    }
                }],
                xAxes: [{
                    type: 'time',
                    time: {
                        stepSize: ttlval,
                        unit: 'second'
                    }
                }]
            }
        }
    });
    // master_link_down_since_seconds
    if(dt.basic.master_link_down_since_seconds){
        document.getElementById('masterLinkDownSinceSecondsTitle').innerText = 'Master-slave link has been lost for (should be 0):';
        document.getElementById('masterLinkDownSinceSeconds').innerText = dt.basic.master_link_down_since_seconds;

    }else if(document.getElementById('masterLinkDownSinceSecondsTitle').innerText !== ''){
        document.getElementById('masterLinkDownSinceSecondsTitle').innerText = '';
        document.getElementById('masterLinkDownSinceSeconds').innerText = '';
    }
}

function updateCharts(dt)

    // Instance info
    document.getElementById('redis_id').innerText = dt.instance.id[0].y;
    document.getElementById('redis_version').innerText = dt.instance.redis_version[0].y;
    document.getElementById('process_id').innerText = dt.instance.process_id[0].y;
    document.getElementById('uptime_in_seconds').innerText = dt.instance.uptime_in_seconds[0].y;
    document.getElementById('uptime_in_days').innerText = dt.instance.uptime_in_days[0].y;
    document.getElementById('gcc_version').innerText = dt.instance.gcc_version[0].y;
    document.getElementById('role').innerText = dt.instance.role[0].y;
    document.getElementById('connected_slaves').innerText = dt.instance.connected_slaves[0].y;
    document.getElementById('aof_enabled').innerText = dt.instance.aof_enabled[0].y;
    document.getElementById('maxmemory_human').innerText = dt.instance.maxmemory_human[0].y;
    document.getElementById('maxmemory_policy').innerText = dt.instance.maxmemory_policy[0].y;

    Object.keys(charts).forEach(sectionName => {

        Object.keys(charts[sectionName]).forEach(keyName => {
            charts[sectionName][keyName].data.datasets[0].data = dt[sectionName][keyName];
            charts[sectionName][keyName].update();
        })
    })

    // master_last_io_seconds_ago
    if(dt.basic.master_last_io_seconds_ago){
        document.getElementById('masterLastIoSecondsAgoTitle').innerText = 'Last time slave instance checked with master:';
        document.getElementById('masterLastIoSecondsAgo').innerText = new Date(new Date(Date.now()).getTime() - (dt.basic.master_last_io_seconds_ago*1000)).toLocaleString();

    }else if(document.getElementById('masterLastIoSecondsAgoTitle').innerText !== ''){
        document.getElementById('masterLastIoSecondsAgoTitle').innerText = '';
        document.getElementById('masterLastIoSecondsAgo').innerText = '';
    }

    document.getElementById('lastSaveTime').innerText = new Date(dt.persistence.rdb_last_save_time_ms[0].y).toLocaleString();

    let basicCharts = document.getElementById('basicCharts');
    while(basicCharts.children.length > 2){
        basicCharts.removeChild(basicCharts.lastChild);
    }
    if(dt.basic.keyspace && Object.keys(dt.basic.keyspace).length > 0){
        Object.keys(dt.basic.keyspace).forEach(key => {
            // key = db0
            let tempChartContainer = document.createElement('div');
                tempChartContainer.classList.add('chart');
            let tempChartCanvas = document.createElement('canvas');
                tempChartContainer.appendChild(tempChartCanvas);
                basicCharts.appendChild(tempChartContainer);
            new Chart(tempChartCanvas, {
                // The type of chart we want to create
                type: 'line',
                // The data for our dataset
                data: {
                    datasets: dt.basic.keyspace[key]
                },
                // Configuration options go here
                options: {
                    ...animationsObj,
                    plugins: {
                        zoom
                    },
                    bounds: 'ticks',
                    title: {
                        display: true,
                        text: key
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                suggestedMin: 0,
                                suggestedMax: 10
                            }
                        }],
                        xAxes: [{
                            type: 'time',
                            time: {
                                stepSize: ttlval,
                                unit: 'second'
                            }
                        }]
                    }
                }
            });
        })
    }

    // master_link_down_since_seconds
    if(dt.error.master_link_down_since_seconds){
        document.getElementById('masterLinkDownSinceSecondsTitle').innerText = 'Master-slave link has been lost for (should be 0):';
        document.getElementById('masterLinkDownSinceSeconds').innerText = dt.error.master_link_down_since_seconds;

    }else if(document.getElementById('masterLinkDownSinceSecondsTitle').innerText !== ''){
        document.getElementById('masterLinkDownSinceSecondsTitle').innerText = '';
        document.getElementById('masterLinkDownSinceSeconds').innerText = '';
    }

}

function round(n, p = 2) {
    let r = 0.5 * Number.EPSILON * n;
    let o = 1; while(p-- > 0) o *= 10;
    if(n < 0)
        o *= -1;
    return Math.round((n + r) * o) / o;
}

function toggleStats(mode){
    switch (mode) {
        case 'start':
            fetch('/startStats')
            .then(() => {
                document.getElementById('stopStats').classList.remove('disabled');
                document.getElementById('startStats').classList.add('disabled');
                /*
                    If autostart is disabled, we need to manually start the charts.
                    That means that they have to be generated. Here's a switch that
                    only fires once (when startStatsTimes = 0)
                */
                if(startStatsTimes > 0){
                    loadData();
                }else{
                    loadData(autostart ? false : true);
                    startStatsTimes++;
                }

                interv = setInterval(() => {
                    loadData();
                }, ttlval*1000);
            })
            .catch(err => {
                alert(err);
            })
            break;
    
        case 'stop':
            fetch('/stopStats')
            .then(() => {
                document.getElementById('stopStats').classList.add('disabled');
                document.getElementById('startStats').classList.remove('disabled');
                
                clearInterval(interv);
            })
            .catch(err => {
                alert(err);
            })
            break;
    }
}
