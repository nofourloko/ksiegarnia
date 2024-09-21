const express = require('express')
const path = require("path")
const app = express()
const port = 5000
const cors = require('cors')
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser');
const products = require('./Router/products')
const auth = require('./Router/auth')
const user = require('./Router/user')
const cart = require('./Router/cart')
const { con } = require('./Controller/db_connection')
const Category = require('./Model/Category')
const session = require('express-session')

con.connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.use(session({
    secret: 'secret_key',
    resave: true,
    saveUninitialized: true
  }));

app.use("/", async (req, res, next) => {
    let sub_categories
    req.categories = []
    const sql = 'SELECT tytul, kategoria_id FROM `Podkategorie`'

    con.query(sql)
        .then( sub => {
            sub_categories = sub
            return con.select('Kategorie')      
        })
        .then( categories => {
            categories.forEach((item, idx) => {
                const sub_categories_array = sub_categories.filter(el => el.kategoria_id === item.id).map(el => el.tytul)
                req.categories.push(new Category(item.id, item.Tytuł, sub_categories_array))
            })
            return con.select('Książki')      
        })
        .then(books => {
            req.books = books
            next()
        })
        .catch((err) => {
            console.log(err)
            next()
        })
});

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors())
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.set('views', path.join(__dirname,  'views'));
app.use('/', products)
app.use('/auth', auth)
app.use('/user', user)
app.use('/cart', cart)
app.get('/', (req, res) => {})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})