const express = require('express')
const path = require("path")
const app = express()
const port = 5000
const cors = require('cors')
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser');
const products = require('./Router/products')
const auth = require('./Router/auth')
const {router} = require('./Router/user')
const cart = require('./Router/cart')
const { con } = require('./Controller/db_connection')
const Category = require('./Model/Category')
const session = require('express-session')
const invoice = require('./Router/invoice')

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

    const query_subcategories = 'SELECT * FROM `Podkategorie`'
    con.executeQuery(query_subcategories, [], res, (sub) => {
        const query_categories = "SELECT * FROM Kategorie"
        const sub_categories = sub
        con.executeQuery(query_categories, [], res, (categories) => {
            const query_books = "SELECT * FROM Książki"
            req.categories = []
            categories.forEach((item, idx) => {
                const sub_categories_array = sub_categories.filter(el => el.kategoria_id === item.id)
                req.categories.push(new Category(item.id, item.Tytuł, sub_categories_array))
            })
            con.executeQuery(query_books, [], res, (books) => {
                req.books = books
                next()
            })

        })
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
app.use('/user', router)
app.use('/cart', cart)
app.use("/invoice", invoice)

app.use((req, res, next) => {
    res.status(404).render('./404.ejs');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

