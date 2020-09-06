# redis-monit
A simple redis monitor written in Javascript (Node.js.) It comes with a web interface with HTTP basic authentication and the data is extracted from the *info* command of redis.

![redis-monit](https://s7.gifyu.com/images/bENWDy6jy1.gif "redis-monit")
***
## Why?
This project has many purposes, but the main one was that I needed a redis monitor that was simple and I couldn't find one that I liked and was suited for my enviroment.
You can use redis-monit in two ways: if you are already using Node.js or if you are not. The former should be the most common one.
***
## What does it monitor?
Basic but useful information extracted from the *info* command. The list of commands allongs with an explanation of what they mean can be found [here.](https://www.datadoghq.com/blog/how-to-monitor-redis-performance-metrics/)
*TL;DR:*
* latency
* instantaneous_ops_per_sec
* hit rate (calculated)
* used_memory
* mem_fragmentation_ratio
* evicted_keys
* blocked_clients
* connected_clients
* connected_slaves
* master_last_io_seconds_ago (if available)
* keyspace
* rdb_last_save_time
* rdb_changes_since_last_save
* rejected_connections
* keyspace_misses
* master_link_down_since_seconds (if available)
***
## Zoom
In the charts, you can zoom in by dragging. To reset the zoom, double click the chart.
***
## Install
As I mentioned before, there are two ways to do this:
### I'm already using Node.js
If you're using Node.js already then you must:
1. Clone this repository: git clone https://github.com/decacis/redis-monit.git
2. Run in the project's root directory: npm install
3. Adjust your project's [settings.](#settings)
4. Run either: npm start OR node index.js
> Optionally, you may enable redis-monit to run on startup (in case your server restarts or something like that):
5. Install [pm2](https://github.com/Unitech/pm2) globally: npm install pm2 -g
6. Add redis-monit to the pm2 list: pm2 start index.js (you shouldn't do step 4 if you do this.)
7. Generate a startup script: pm2 startup
8. Freeze your process list across server restart: pm2 save

For more information about pm2 please refer to [their repository.](https://github.com/Unitech/pm2)
### I'm NOT using Node.js
If you preffer not to use Node.js **in your redis server** then you should,
In your development computer:
1. Download and install [Node.js](https://nodejs.org/en/) (LTS version should be fine, also npm comes included)
2. Verify your installation running the following command on the command line: node -v AND npm -v (they should output your Node.js and NPM version)
3. Clone this repository (git clone https://github.com/decacis/redis-monit.git)
4. Run in the project's root directory: npm install
5. Adjust your project's [settings](#settings)
6. Install the [pkg](https://www.npmjs.com/package/pkg) package globally running: npm install -g pkg
7. In the project's root directory run: pkg -c package.json index.js --options max_old_space_size=40 --out-path ./dist
> This will create linux, macos and windows binaries. The architecture depends on the computer's architecture where you run the command. The "--options max_old_space_size=40" means that the maximum memory that the binary can use is 40 Mb. "--out-path ./dist" is the directory where the binaries are placed. You can read more about this configuration on the [pkg's repository.](https://github.com/vercel/pkg)
8. That's it! To deploy redis-monit you should include: the binary file and the settings.json file that you are going to use. They must be in the same folder.
***
## Settings
redis-monit can be configured with various settings:
#### statsLogPath : String (default: "")
If specified, redis-monit will save logs to this file. It must be a absolute path and a json file, for example "/www/mywebsite/logs.json". Leave it blank and redis-monit will save logs to a file located in the tmp path.
#### enableAnimations : Boolean (default: true)
Weather the web interface of redis-monit will show animations or not. No animations improve performance on the client side (browser), but there's no effect on the server performance.
#### autostart : Boolean (default: true)
Weather the log colletion will start automatically when the server starts. If disabled, you must manually start collecting logs by pressing "Restart stats (will reset them)" on the web interface.
#### deleteLogsOnStart : Boolean (default: true)
Weather the previous logs will be deleted when the service starts. Useful to automatically delete previous data if the server restarts.
#### pollTimeSeconds : Integer (default: 10)
The interval in seconds in which redis-monit will ask for new information. It shouldn't be too low, probably 2 to 4 seconds should be the minimum.
#### logsToKeep : Integer (default: 90)
The number of logs to keep. It shouldn't be too high. If it's too high it will be harder to read the data in the charts. If you multiply this number by the value of *pollTimeSeconds* and then divide it by 60 (seconds) you get how many minutes it will log.
#### credentials : Object
You shouldn't manually change this unless you know what you are doing. This object stores the credentials for the HTTP basic authentication. More info in [authentication.](#authentication)
#### port : Integer (default: 3141)
The port where the web interface will be served.
#### redisConnection : Object|String
The redis credentials. It can be an object or a string. Examples:
```javascript
{
  "port": 6379,
  "host": "127.0.0.1",
  "family": 4,
  "password": "12345",
  "db": 0
}
```
If using TLS encryption:
```javascript
// Connect to 127.0.0.1:6380, db 4, using password "authpassword":
"redis://:authpassword@127.0.0.1:6380/4"
```
More information about this can be found [here.](https://github.com/luin/ioredis/blob/master/API.md#new_Redis_new)
***
## Authentication
redis-monit uses HTTP basic authentication to secure the web interface. Also, the passwords are hashed using the [bcrypt password-hashing function.](https://en.wikipedia.org/wiki/Bcrypt)

The default user and password are:
```javascript
username: rmadmin
password: rmadmin
```
To add a new user you should run the script or the binary with: --add-user username:password. Example:
```javascript
node index.js --add-user username:password

// If you are not running nodejs then it's basically the same
binary-name --add-user username:password
```
To delete the default user add the --delete-default-user flag. Example:
```javascript
node index.js --delete-default-user

// flags can be combined
node index.js --add-user username:password --delete-default-user

// If you are not running nodejs then it's basically the same
binary-name.exe --add-user username:password --delete-default-user
```
***
## License
MIT License

Copyright (c) 2020 Daniel Castellanos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
