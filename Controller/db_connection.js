const mysql = require('mysql')


class DBhandler {
    constructor( host, user, password, database ){
        this.connection = mysql.createConnection({
            host,
            user,
            password,
            database 
          });
    }

    query(sql_query, values = []){
        return new Promise((resolve, reject) => {
            this.connection.query(sql_query, values, (err, result) => {
                if(err){
                    console.log(err)
                    throw reject(err)
                }
                resolve(result)
            })
        })

    }

    executeQuery = (query, params = [], res, onSuccess) => {
        this.query(query, params)
            .then(result => onSuccess(result))
            .catch(err => {
                console.log(err);
                res.render('./error.ejs', {message : 'Wystąpił błąd podczas przetwarzania twojego zapytania w bazie danych'})
            });
    };
}

const con = new DBhandler("localhost", "root", "", "Library")



module.exports = { con }