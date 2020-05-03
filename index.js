const cool = require('cool-ascii-faces')
const express = require('express')
const bodyParser = require("body-parser");
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  //ssl: true
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
.get('/login', (req, res) => res.sendfile('login.html'))

	.post('/register', (req, res) => {
		console.log(0)
		var user_name = req.body.username;
		var password = req.body.password;
		console.log("Log.UserName = " + user_name + "\nLog.passwd = " + password)

		async function f(res) {
		    try {
			    console.log(1)
		      const client = await pool.connect()
			    console.log(2)
		      const result = await client.query("INSERT into user_table values('" + user_name + "', '" + password + "');");
			    console.log(3)
		      const results = { 'results': (result) ? result : null};
			    console.log(4)
		      res.send('<h1>Registration successful</h1><br/><br/> <a href="/login">Login</a>');
			    console.log(5)
		      client.release();
		    } catch (err) {
		      console.error(err);
		      res.send("Error " + err);
		    }
		}
		console.log(6)
		f(res);
		console.log(7)
	})

	.post('/login', (req,res) => {
		var user_name=req.body.user;
		var password=req.body.password;
		console.log("User name = "+user_name+", password is "+password);
		async function f(res) {
                    try {
                            console.log(1)
                      const client = await pool.connect()
                            console.log(2)
			    query = "SELECT * from user_table where username='" + user_name + "';";// and password='" + password + "';"
			    console.log(query)
			    console.log(2.5)
                      const result = await client.query(query);
                            console.log(3)
			    console.log(result)

			    // messages = 
			    // console.log(3.1)
			    // console.log(messages)
			    // messages_html = ""
			    // for (i=0; i<messages.length; i++) 
			    //     messages_html += '<a href="' + messages[i] + '">Message from ' + sender + '</a>';
			    // console.log(3.2)
			    // console.log(messages_html)
			    // console.log(3.3)

                      const results = { 'results': (result) ? result : null};
                            console.log(4)
                      res.send('<h1>Logged in<h1><br/><br/>' +
			      '<a href="/new_message">Send a new message</a><br/><br/>' +
			      '<h3>Your messages</h3>' //+ 
			      // messages_html
		      );
                            console.log(5)
                      client.release();
                    } catch (err) {
                      console.error(err);
                      res.send("Error " + err);
                    }
                }
                console.log(6)
                f(res);
                console.log(7)
	})

.listen(PORT, () => console.log(`Listening on ${ PORT }`))

showTimes = () => {
  let result = ''
  const times = process.env.TIMES || 5
  for (i = 0; i < times; i++) {
    result += i + ' '
  }
  return result;
}



//app.listen(3000,function(){
// console.log("Started on PORT 3000");
//})
