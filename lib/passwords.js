const bcrypt = require('bcryptjs');

module.exports.setPassword = (password) => {
    return new Promise(function(resolve, reject){
        bcrypt.genSalt(10, function(serr, salt) {
            if(!serr){
                bcrypt.hash(password, salt, function(herr, hash) {
                    if(!herr){
                        resolve(hash);
                    }else{
                        reject(herr);
                    }
                });
            }else{
                reject(serr);
            }
        });
    })
}

module.exports.comparePassword = (password, pwdHash) => {
    return new Promise(function(resolve, reject){
        bcrypt.compare(password, pwdHash)
        .then(res => {
            resolve(res);
        })
        .catch(err => {
            reject(err);
        })
    })
}