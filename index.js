process.env.NODE_ENV = process.pkg ? 'production' : process.env.NODE_ENV;
const fs = require('fs');
const path = require('path');
const os = require('os');
const settings = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'settings.json'), { encoding: 'utf8' }));
const passwords = require('./lib/passwords');

// Reading commands
if(process.argv.length > 0){
    // If addUser argument
    if(process.argv.includes('--add-user')){
        let credentialsIndex = process.argv.indexOf('--add-user')+1;
        if(!process.argv[credentialsIndex]){
            console.log('Unable to add user because no credentials string was passed.');
        }else{
            // Splitting credentials
            let splitCredentials = process.argv[credentialsIndex].split(':');
            if(splitCredentials.length === 0 || splitCredentials.length > 2){
                console.log('Unable to add user because no credentials valid string was passed. Ex. username:password');
            }else{
                // Getting password hash
                passwords.setPassword(splitCredentials[1])
                .then(pwdHash => {
                    // If the user also wants to delete the default user, then do so.
                    if(process.argv.includes('--delete-default-user') && settings.credentials.rmadmin){
                        delete settings.credentials.rmadmin;
                    }
                    settings.credentials[splitCredentials[0]] = pwdHash;
                    saveSettings();
                })
                .catch(pwdErr => {
                    console.log(pwdErr);
                })
            }
        }
    // If delete default user argument
    }else if(process.argv.includes('--delete-default-user')){
        if(process.argv.includes('--delete-default-user') && settings.credentials.rmadmin){
            delete settings.credentials.rmadmin
            saveSettings();
        }
    }
}

function saveSettings(){
    fs.writeFileSync(path.join(process.cwd(), 'settings.json'), JSON.stringify(settings), { encoding: 'utf8' });
}

const express = require('express');
const helmet = require('helmet');
const timeout = require('connect-timeout');
const server = express();
const statsExtractor = require('./lib/formatData');
const basicAuth = require('express-basic-auth');
const port = settings.port;

const statsLogPath = (settings.statsLogPath !== '' ? settings.statsLogPath : path.join(os.tmpdir(), 'redis_monit_log_history.json'));
let timer;
let alreadyStarted = false;

if(settings.autostart){
    alreadyStarted = true;
    statsExtractor(settings.deleteLogsOnStart)
    .then(() => {
        timer = setInterval(() => {
            statsExtractor();
        }, settings.pollTimeSeconds*1000);
    })
    .catch(error => {
        console.log(error);
    })
}

server.use(timeout(60000)); // Timeout after 1 minute
server.use(helmet({
    contentSecurityPolicy: false
}));
server.use(haltOnTimedout);
server.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
    }
}))
server.use(haltOnTimedout);
server.use(express.urlencoded({ extended: true, strict: false }));
server.use(haltOnTimedout);
server.use(express.json());
server.use(haltOnTimedout);
server.use(basicAuth({
    authorizeAsync: true,
    authorizer: async (username, password, authorize) => {
        const passwordHash = settings.credentials[username];
        if(passwordHash){
            passwords.comparePassword(password, passwordHash)
            .then(auth => {
                return authorize(null, auth);
            })
            .catch(err => {
                return authorize(err, false);
            })
        }else{
            return authorize(null, false);
        }
    },
    challenge: true
}));
server.use(haltOnTimedout);

// Routes
server.get('/info', (req, res) => {
    return res.status(200).json({ ttl: settings.pollTimeSeconds, enableAnimations: settings.enableAnimations, autostart: (!alreadyStarted ? settings.autostart : true) })
})
server.get('/stats', (req, res) => {
    fs.access(statsLogPath, fs.F_OK, (err) => {
        if (err) {
            // File doesn't exists
            fs.writeFile(statsLogPath, '[]', { encoding: 'utf8' }, err => {
                if(err) return res.status(500).json({ code: 1, msg: 'Error getting log history.', details: err });;
                return res.status(200).json([]);
            })
        }else{
            // File exists
            fs.readFile(statsLogPath, (read_err, read_data) => {
                if(!read_err){
                    try {
                        return res.status(200).json(JSON.parse(read_data));
                    } catch (json_parse_err) {
                        return res.status(500).json({ code: 1, msg: 'Error getting log history.', details: json_parse_err });
                    }
                }else{
                    return res.status(500).json({ code: 1, msg: 'Error getting log history.', details: read_err });
                }
            })
        }
    })
})
server.get('/stopStats', (req, res) => {
    clearInterval(timer);
    return res.status(200).json({ status: 'ok' });
})
server.get('/startStats', (req, res) => {
    alreadyStarted = true;
    clearInterval(timer);
    statsExtractor(settings.deleteLogsOnStart)
    .then(() => {
        timer = setInterval(() => {
            statsExtractor();
        }, settings.pollTimeSeconds*1000);
        return res.status(200).json({ status: 'ok' });
    })
    .catch(error => {
        console.log(error);
        return res.status(500).json({ status: 'error', details: error });
    })
})
server.use('/', express.static(path.join(__dirname, 'web')));

// Error handling
server.all('*', (req, res, next) => {
    const err = new Error('Not found.');
    err.status = 'error';
    err.statusCode = 404;
  
    next(err);
});
server.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
});
// End error handling

function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
}

server.listen(port, () => {
    console.log(`Server listening at localhost:${port}`)
})