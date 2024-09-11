const express = require('express')
const path = require("path")
const app = express()
const port = 5000
const cors = require('cors')
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser');
const products = require('./Router/products')
const auth = require('./Router/auth')
const { con } = require('./Controller/db_connection')

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors())
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.set('views', path.join(__dirname,  'views'));
app.use('/', products)
app.use('/', auth)

con.connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})