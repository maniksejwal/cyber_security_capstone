// TODO Backend validation
const cool = require('cool-ascii-faces')
const express = require('express')
const bodyParser = require('body-parser');
const path = require('path')
const helmet = require('helmet')
const session = require('express-session')
const CryptoJS = require('crypto-js')
const validator = require('validator');
const { Pool } = require('pg');
const sleep = require('system-sleep');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
//const cookieSession = require('cookie-session')
//const csrf = require('csurf')

const PORT = process.env.PORT || 5000

var app = express()
var parseForm = bodyParser.urlencoded({ extended: false })
//var csrfProtection = csrf({ cookie: false })
//.use(express.static(path.join(__dirname, 'public')))

app.use(parseForm);
app.use(bodyParser.json());
/*app.use(cookieSession({
	name: 'session',
	keys: ['teri maa', 'ki aankh']
}))*/
//app.use(csrfProtection)
app.use(helmet())
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  name: 'session_0',
  secret: 'teri ma ki aankh',
  resave: true,
  rolling: true,
  saveUninitialized: true,
  cookie: { secure: true, maxAge: 60*1000*10 } // age = 5 minutes
}))
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


// -- Capstone -- //


	.get('/capstone', (req, res) => res.sendfile('splash.html'))
	.get('/register', (req, res) => res.sendfile('register.html'))
	.get('/login', (req, res) => res.sendfile('login.html'))		// TODO max number of attempts
	.get('/home', (req, res) => home(req, res))
	.get('/send', async (req, res) => {
		console.log('get send')
    try {
      const client = await pool.connect()
			sessionID = req.session.id
			console.log('sessionID = ' + sessionID)
			session_query = 'SELECT username FROM sessions WHERE sessionid=$1'
			values = [sessionID]
      const result = await client.query(session_query, values)
			user = result.rows[0].username
			res.render('pages/send')
		} catch (err) {
			console.error(err);
			res.send("Error " + err)
		}
	})

	.get('/message', async (req, res) => {
		console.log('get message')
		messageid = req.query.messageid
		try {
			const client = await pool.connect()
			query_text = 'SELECT * from Messages WHERE messageid=$1;'
			values = [messageid] 
			result = await client.query(query_text, values);
			console.log(result)
			message = result.rows[0]

			res.render('pages/message', {sender:message.sender, receiver:message.receiver, content:message.message})
			client.release();
		} catch (err) {
			console.error(err);
			res.send("Error " + err);
		}
	})

	.get('/dbdump', (req, res) => res.download('latest.dump'))

	.post('/register', async (req, res) => {
		var username = req.body.username;
		var password = req.body.password;

		password_hash = CryptoJS.SHA3(password)
		console.log('hash= ' + password_hash)
		console.log('hash= ' + password_hash)
		
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
	})

	.post('/login', async (req,res) => {
		// TODO
		// if (req.session.attempts) req.session.attempts++;
		// else req.session.attempts = 1;

	  var username=req.body.username;
	  var password=req.body.password;
	  try {
			const client = await pool.connect()

			password_hash = CryptoJS.SHA3(password)
			query = 'SELECT * from user_table WHERE username=$1 and password=$2;'
			values = [username, password_hash.toString(CryptoJS.enc.Hex)]

			const result = await client.query(query, values);
			if (result.rowCount === 0){
				// TODO : if username exists, increment attempt count
	      res.send('<br/><br/><center><h1>Invalid username or password<h1><br/><br/>' + 
					'<a href="login" class="button">Try again</a>' +
					'</center>'
				);
	      client.release();
				return;
			}
			
			// login successful
			user = result.rows[0].username;
			//req.session.views = true

			session_query = 'INSERT into sessions(sessionid, username) VALUES ($1, $2);'
			values = [req.session.id, user]
			await client.query(session_query, values);
			await home(req, res)
	  } catch (err) {
	   	console.error(err);
			res.send("Error " + err);
	    }
	})

	.post('/send', async (req, res) => {
		console.log('post send')
		sessionID = req.session.id
		console.log('send sessionID = ' + sessionID)
		receiver = req.body.username;
		content = req.body.content;
		console.log('send : received message data')
	  try {
	  	const client = await pool.connect()

			receiver_exists_query = 'SELECT username FROM user_table WHERE username=$1'
			receiver_exists_result = await client.query(receiver_exists_query, [receiver])
			console.log('receiver in database = ')
			console.log(receiver_exists_result)
			if (receiver_exists_result.rows.length === 1) console.log('length = 1')
			else console.log('length = 0')

			session_query = 'SELECT username FROM sessions WHERE sessionid=$1'
			values = [sessionID]
      result = await client.query(session_query, values)
			sender = result.rows[0].username
			console.log('send 1')
			
	   	query = 'INSERT into Messages values($1, $2, $3, $4);'
			values = [sender, receiver, content, parseInt(Math.random()*100)]
	   	result = await client.query(query, values);
			console.log('send 3')
	   	res.send('<h1>Message sent</h1><br/><br/><a href="/home">Home</a>');
	   	client.release();
	  } catch (err) {
	   	console.error(err);
	   	res.send("Error " + err);
	  }
	})

	.use(function(req, res, next){		// 404
		res.status(404).send('404 - Invalid URL - ' + req.originalUrl);
	})
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))


// -- Helpers -- //


showTimes = () => {
  let result = ''
  const times = process.env.TIMES || 5
  for (i = 0; i < times; i++) {
    result += i + ' '
  }
  return result;
}

async function home(req, res){
	// TODO end session
	sessionID = req.session.id
	console.log('home sessionID = ' + sessionID)
	try{
		const client = await pool.connect()
		user_query = 'SELECT username FROM sessions WHERE sessionid=$1;'
		values = [sessionID]
		result = await client.query(user_query, values)
		console.log(result)
		if (result.rows.length===0) res.send('invaid session')
		user = result.rows[0].username
		console.log(user)

		message_query = 'SELECT * FROM Messages WHERE Receiver=$1;'
		values = [user]

		message_result = await client.query(message_query, values);
		messages = message_result.rows;
		messages_html = ""
		for (i=0; i<messages.length; i++) 
			messages_html += `<a href="/message?messageid=${messages[i].messageid}">Message from ${messages[i].sender}</a>`;

	      //const results = { 'results': (result) ? result : null};
	      res.send(`<center><h1>Message Center<h1></center><br/><br/>\
					Hi ${user}<br/><br/>\
		      <a href="/send">Send a new message</a><br/><br/>\
		      <h3>Your messages</h3>\
		      ${messages_html}`
	      );
		    console.log('home 5')
	      client.release();
	} catch (err) {
		console.error(err);
		res.send("Error " + err);
	}
}


//app.listen(3000,function(){
// console.log("Started on PORT 3000");
//})
