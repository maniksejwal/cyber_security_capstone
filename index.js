const cool = require('cool-ascii-faces')
const express = require('express')
const bodyParser = require("body-parser");
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

var app = express()
//.use(express.static(path.join(__dirname, 'public')))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app
.set('views', path.join(__dirname, 'views'))
.set('view engine', 'ejs')
.get('/', (req, res) => res.render('pages/index'))
.get('/cool', (req, res) => res.send(cool()))
.get('/times', (req, res) => res.send(showTimes()))
.get('/db', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM test_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
.get('/db2', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM user_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
.get('/capstone', (req, res) => res.sendfile('splash.html'))
.get('/register', (req, res) => res.sendfile('register.html'))
.listen(PORT, () => console.log(`Listening on ${ PORT }`))

showTimes = () => {
  let result = ''
  const times = process.env.TIMES || 5
  for (i = 0; i < times; i++) {
    result += i + ' '
  }
  return result;
}


app
	.post('/register', (req, res) => {
		console.log(0)
		var user_name = req.body.user;
		console.log(0.1)
		var password = req.body.password;
		console.log(0.2)

		async (req, res) => {
		    try {
			    console.log(1)
		      const client = await pool.connect()
			    console.log(2)
		      const result = await client.query('INSERT into user_table values(user_name, password)');
			    console.log(3)
		      const results = { 'results': (result) ? result : null};
			    console.log(4)
		      res.send('<h1>Registration status</h1><br/>' + results);
			    console.log(5)
		      client.release();
		    } catch (err) {
		      console.error(err);
		      res.send("Error " + err);
		    }
		}
	})

	.post('/login',function(req,res){
	var user_name=req.body.user;
	var password=req.body.password;
	console.log("User name = "+user_name+", password is "+password);
	res.end("yes");
});

//app.listen(3000,function(){
// console.log("Started on PORT 3000");
//)
