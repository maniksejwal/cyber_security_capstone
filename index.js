const cool = require('cool-ascii-faces')
const express = require('express')
const bodyParser = require('body-parser');
const path = require('path')
const helmet = require('helmet')
//const session = require('express-session')
const cookieSession = require('cookie-session')
const CryptoJS = require('crypto-js')
const csrf = require('csurf')

const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

var app = express()
var parseForm = bodyParser.urlencoded({ extended: false })
var csrfProtection = csrf({ cookie: false })
//.use(express.static(path.join(__dirname, 'public')))

app.use(parseForm);
app.use(bodyParser.json());
app.use(cookieSession({
	name: 'session',
	keys: ['teri maa', 'ki aankh']
}))
//app.use(csrfProtection)
app.use(helmet())
app.set('trust proxy', 1) // trust first proxy
/*app.use(session({
  name: 'session_0',
  secret: 'teri ma ki aankh',
  resave: false,
  rolling: true,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 60*1000*5 } // age = 5 minutes
}))*/

app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
 
  // handle CSRF token errors here
  res.status(403)
  res.send('form tampered with')
})
// req.session.cookir.expires = new Date(Date.now() + eta)

app
.set('views', path.join(__dirname, 'views'))
.set('view engine', 'ejs')
.get('/', (req, res) => res.render('pages/index'))
.get('/cool', (req, res) => res.send(cool()))
.get('/times', (req, res) => res.send(showTimes()))
.get('/db', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM test_table;');
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
      const result = await client.query('SELECT * FROM user_table;');
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
.get('/login', (req, res) => res.sendfile('login.html'))		// TODO max number of attempts
.get('/send', (req, res) => {
	user = req.query.user
	console.log(user)
	res.render('pages/send', {user: user})
})

.get('/message', (req, res) => {
	messageid = req.query.messageid

	async function f() {
		try {
			const client = await pool.connect()
			//query_text = `SELECT * from Messages WHERE messageid='${messageid}';` 
			query_text = 'SELECT * from Messages WHERE messageid=$1;'
			values = [messageid] 
			message = await client.query(query, values);
			console.log('message = ' + JSON.stringify(message))
			message = message.rows[0]

			res.render('pages/message', {sender:message.sender, receiver:message.receiver, content:message.message})
		        client.release();
		} catch (err) {
		        console.error(err);
		        res.send("Error " + err);
		}
	}
	f()
})

.get('/dbdump', (req, res) => res.download('latest.dump'))

	.post('/register', (req, res) => {
		console.log(0)
		var username = req.body.user_name;
		var password = req.body.password;
		console.log("Log.UserName = " + username + "\nLog.passwd = " + password)

		password_hash = CryptoJS.SHA3(password)
		console.log('hash= ' + password_hash)
		console.log('hash= ' + password_hash)
		
		async function f(res) {
		    try {
			   
		      const client = await pool.connect()
		      // query = "INSERT into user_table values('" + username + "', '" + password_hash + "');"
		      query = "INSERT into user_table(username, password) VALUES($1, $2);"
		      values = [username, password_hash.toString(CryptoJS.enc.Hex)]
		      const result = await client.query(query, values);
		      const results = { 'results': (result) ? result : null};
		      res.send('<h1>Registration successful</h1><br/><br/> <a href="/login">Login</a>');
		      client.release();
		    } catch (err) {
		      console.error(err);
		      res.send("Error " + err);
		    }
		}
		f(res);
	})

	.post('/login', (req,res) => {
		var username=req.body.user_name;
		var password=req.body.password;
		async function f(res) {
                    try {
			    await home(res, username, password)
                    } catch (err) {
			    console.error(err);
			    res.send("Error " + err);
                    }
                }
                f(res);
	})

	.post('/send', (req, res) => {
		sender = req.query.user;
		receiver = req.body.username;
		content = req.body.content;

		async function f() {
		    try {
		      const client = await pool.connect()
		      query = `INSERT into Messages values('${sender}', '${receiver}', '${content}', '${parseInt(Math.random()*100)}');`
		      console.log(query)
		      const result = await client.query(query);
		      const results = { 'results': (result) ? result : null};
		      res.send('<h1>Message sent</h1><br/><br/><a href="/home">Home</a>');
		      client.release();
		    } catch (err) {
		      console.error(err);
		      res.send("Error " + err);
		    }
		}
		f();
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

async function home(res, username, password){
	const client = await pool.connect()
	password_hash = CryptoJS.SHA3(password)
	query = 'SELECT * from user_table WHERE username=$1 and password=$2;'
	values = [username, password_hash]

	const result = await client.query(query, values);
	console.log(result)
	user = result.rows[0].username;

	message_query = 'SELECT * FROM Messages WHERE Receiver=$1;'
	values = [user]

	message_result = await client.query(message_query, values);
	messages = message_result.rows;

	messages_html = ""
	for (i=0; i<messages.length; i++) 
		messages_html += `<a href="/message?messageid=${messages[i].messageid}">Message from ${messages[i].sender}</a>`;

      //const results = { 'results': (result) ? result : null};
      res.send(`<center><h1>Message Center<h1></center><br/><br/>\
	      <a href="/send?user=${user}">Send a new message</a><br/><br/>\
	      <h3>Your messages</h3>\
	      ${messages_html}`
      );
	    console.log(5)
      client.release();
}


//app.listen(3000,function(){
// console.log("Started on PORT 3000");
//})
