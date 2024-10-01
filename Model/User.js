const crypto = require('crypto')
class User {
    constructor(email, password, phone, login){
        this.login = login
        this.email = email
        this.password = password
        this.phone = phone
    }

    static hashPassword = (password) => {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    static isLogged = (req) => {
        if(req.cookies['User']){
            return JSON.parse(req.cookies['User']).id
        }
        return null
    }
}


module.exports = User