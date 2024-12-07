const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const session = require('express-session');
const pool = require('./database');
const multer = require('../middleware/multer');

var searchKey = null;
var commentKey = null;

router.get('/', (req, res) => {
  if (req.session.loggedin) {
    res.render('index');
  } else {
    res.redirect('/login');
  }

})

router.get('/register', multer.single('image'), (req, res) => {
  res.render('register', {
    title: 'Registration',
    success: true,
    error: req.session.errors
  });
  req.session.errors = null;
})

router.post('/register',  (req, res) => {

  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var role = 'user';

  req.check('email', 'invalid email').isEmail()
  req.check('password', 'too short password').isLength({
    min: 4
  })
  req.check('password', 'password doesnt match').equals(req.body.passwordconfirm)

  let error = req.validationErrors();

  if (error) {

    req.session.errors = error;
    res.redirect('/register');

  } else {

    let tempE = 'select email from users where email = ?';
    let tempU = 'select username from users where username = ?';
    let tempI = `insert into users values(?, ?, ?, ?, ?, ?)`

    pool.query(tempU, [username], (err, result, fields) => {
      if (err) throw err

      if (result.length > 0) {
        console.log('username taken');
        res.render('register', {
          emailandusername: true,
          msg: 'Username is already taken'
        })
      } else {
        pool.query(tempE, [email], (err, result, fields) => {
          if (err) throw err

          if (result.length > 0) {
            res.render('register', {
              emailandusername: true,
              msg: 'Email is already taken'
            })
          } else {
            pool.query(tempI, [username, password, email, firstname, lastname, role], (err, result, fields) => {
              if (err) throw err
              else
                res.redirect('/login');
            })
          }
        })
      }
    })
  }
})


router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  if (username && password) {

    let q = 'select username, password, role from users where username = binary ? and password = ?';
    pool.query(q, [username, password], (err, result, fields) => {
      if (err) {
        throw err;
      }

      if (result.length > 0) {
        req.session.loggedin = true;
        req.session.username = username;
        req.session.role = result[0].role;
        console.log(`User ${username} logged in with ${req.session.role} authorization`)
        res.redirect('/');
      } else {
        console.log('password doesnt match');
        res.redirect('/login');
      }
    })

  }
})

router.get('/logout', (req, res) => {
  req.session.loggedin = false;
  res.redirect('/');
})


router.get('/search', (req, res) => {

  if (req.session.loggedin) {

    let query = `select * from comment, blogs where comment.blogID = blogs.blogId`

    res.render('search', {
      result: searchKey
    });

    searchKey = null;

  } else {
    res.redirect('/login');
  }

})

router.post('/search', (req, res) => {
  let keywords = req.body.searchText;
  let searchType = req.body.searchType;

  if(searchType === "blogs"){

  let q = 'select * from blogs where keywords like ? order by rating desc;';

  pool.query(q, ['%' + keywords + '%'], (err, result, fields) => {

    if (err) {
      throw err
    } else {
      searchKey = result;
      res.redirect('/search');
    }
  })

}else if(searchType === "user"){

  res.redirect('/user/searchUser/' + keywords);

}else if(searchType === "hospital"){

  res.redirect('/searchHospital/' + keywords);
}

})

router.get('/searchHospital/:name', (req, res)=>{
  if(req.session.loggedin){
    let name = req.params.name;
    let q = `select * from hospitalblogs where name like ?`

    pool.query(q, ['%' + name + '%'], (err, result, fields)=>{
      if(err){
        throw err
      }else if(result.length <= 0){
        console.log('no result found')
        res.redirect('/search')
      }else if(result.length > 0){
        console.log(result);
        res.render('hospitalblogs', {result: result})
      }
    })

  }else{
    res.redirect('/login')
  }
})


module.exports = router;
