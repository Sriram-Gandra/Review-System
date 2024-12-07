const express = require('express');
const router = express.Router();
const session = require('express-session');
const pool = require('./database');
const multer = require('../middleware/multer');
const cloudinary = require('cloudinary');
require('../middleware/cloudinary')

router.get('/', (req, res) => {
  if (req.session.loggedin) {



    var firstname, lastname, email;
    var ans;

    let q = `SELECT * FROM users
             WHERE users.username = ?;`

    pool.query(q, [req.session.username], (err, result, fields) => {
      if (err) {
        console.log(err);
      } else {
        res.render('user', {
          username: result[0].username,
          email: result[0].email,
          firstname: result[0].firstname,
          lastname: result[0].lastname,
          imageurl: result[0].imageurl
        });
      }
    })


  } else {
    res.redirect('/login');
  }
})

router.get('/addBlog', (req, res) => {
  if (req.session.loggedin) {
    res.render('addBlog');
  } else {
    res.redirect('/login');
  }
})


router.post('/addBlog', (req, res) => {

  var username = req.session.username;
  var body = req.body.body;
  var keywords = req.body.keywords;
  var rating = req.body.rating;
  var dName = req.body.doctorName;
  var dDesignation = req.body.doctorDesignation;
  var typeOfDisease = req.body.typeOfDisease;
  var status = req.body.status;
  var date = new Date();

  let q = `insert into blogs values('', ?, ?, ?, ?, ?, ?, ?, ?, ? )`

  pool.query(q, [username, body, keywords, rating, dName, dDesignation, typeOfDisease, status, date], (err, result, fields) => {
    if (err) {
      throw err;
    } else {
      res.redirect('/user');
    }
  })

})

router.get('/deletePost/:blogId', (req, res) => {
  let blogId = req.params.blogId;


  let q = `delete from blogs where blogId = ?`
  let r = `delete from comment where blogID = ?`

  pool.query(q, [blogId], (err, result, fields) => {
    if (err) throw err;
    else {
      pool.query(r, [blogId], (err, result, fields) => {
        if (err) {
          throw err;
        } else {
          res.redirect('/user')
        }
      })
    }
  })
})

router.get('/userblogs', (req, res) => {
  if (req.session.loggedin) {

    let query = `select * from blogs where blogs.username = ?`

    pool.query(query, [req.session.username], (err, result, fields) => {
      if (err) {
        throw err
      } else {
        res.render('userblogs', {
          result: result
        })
      }
    })


  } else {
    res.redirect('/login')
  }
})

router.post('/comment', (req, res) => {
  let blogID = req.body.blogID;
  let body = req.body.body;
  let username = req.session.username

  let query = `insert into comment values('', ?, ?, ?)`

  pool.query(query, [blogID, username, body], (err, result, fields) => {
    if (err) {
      throw err
    } else {
      res.redirect('/search');
    }
  })


})

router.get('/comments/:blogID', (req, res) => {

  let blogID = req.params.blogID

  let query = `select * from comment where blogID = ?`;

  pool.query(query, [blogID], (err, result, fields) => {
    if (err) {
      throw err
    } else {

      res.render('comments', {
        result: result

      });
    }
  })
})

router.get('/userComments/:blogID', (req, res) => {

  let blogID = req.params.blogID

  let query = `select * from comment where blogID = ?`;

  pool.query(query, [blogID], (err, result, fields) => {
    if (err) {
      throw err
    } else {

      res.render('userComments', {
        result: result

      });
    }
  })
})

router.get('/deleteComment/:ID', (req, res) => {
  let id = req.params.ID;


  let q = `delete from comment where ID = ?`

  pool.query(q, [id], (err, result, fields) => {
    if (err) throw err;
    else {
      res.redirect('/user');
    }
  })
})

//Get other peoples account
router.get('/searchUser/:name', (req, res) => {
  if (req.session.loggedin) {
    let name = req.params.name;
    let makeAdmin = false;


    let q = `select * from users where BINARY username = ?` //Binary is mysql clause that ensures byte by byte comparason

    //so username = 'Hasib' will return only if there is a row with user name Hasib, not hasib/HaSiB/hASIB

    let r = `select * from blogs where username = ?`

    pool.query(q, [name], (err, userResult, fields) => {
      if (err) {
        throw err
        res.redirect('/')
      } else if (userResult.length <= 0) {
        console.log('No user of this name');
        res.redirect('/')
      } else if (userResult.length > 0) {

        let username = userResult[0].username;
        if(userResult[0].role !== "admin" && req.session.role === "admin"){
          makeAdmin = true;
        }

        pool.query(r, [username], (err, blogResult, fields) => {
          if (err) {
            throw err
          } else {
            res.render('uservisit', {
              username: userResult[0].username,
              firstname: userResult[0].firstname,
              lastname: userResult[0].lastname,
              email: userResult[0].email,
              imageurl: userResult[0].imageurl,
              blogResult: blogResult,
              makeAdmin: makeAdmin
            }) //res.render
          } //else
        }) //pool.query
      } //else if
    }) //pool.query
  } else {
    res.redirect('/')
  }

})

router.get('/makeAdmin/:name', (req, res)=>{
  if(req.session.loggedin){
    let username = req.params.name;
    let type = "admin";
    let q = `UPDATE users SET role = ? WHERE username = ?`

    pool.query(q, [type, username], (err, result, fields)=>{
      if(err){
        throw err;
      }else{
        res.redirect(`/user/${username}`);
      }
    })
  }else{
    res.redirect('/')
  }
})

router.get('/addHospitalReview', (req, res)=>{
  if(req.session.loggedin){
    res.render('addHospitalReview');
  }else{
    res.redirect('/login');
  }
})

router.post('/addHospitalReview', (req, res)=>{
  let hName = req.body.hostpitalName;
  let hAdd = req.body.hospitalAddress;
  let phone = req.body.phonenumber;
  let body = req.body.body;

  let q = `insert into hospitalblogs values('', ?, ?, ?, ?, ?)`

  pool.query(q, [hName, req.session.username, body, hAdd, phone], (err, result, fields)=>{
    if(err){
      throw err;
    }else{
      res.redirect('/user');
    }
  })
})

router.get('/uploadimage', (req, res)=>{
  if(req.session.loggedin){
    res.render('uploadimage')
  }else{
    res.redirect('/')
  }
})

router.post('/uploadimage', multer.single('image'), async (req, res)=>{
  const result = await cloudinary.v2.uploader.upload(req.file.path, {secure: true, transformation: [
  {width: 250, height: 250, gravity: "face", radius: 20, crop: "thumb"}
  ]})

  let q = `UPDATE users SET imageurl = ? WHERE username = ?`
  let username = req.session.username


  pool.query(q, [result.url, username], (err, result, fields)=>{
    if(err){
      throw err
    }else{
      res.redirect('/user');
    }
  })
})








module.exports = router;
