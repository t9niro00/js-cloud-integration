const express = require('express')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { v4: uuidv4 } = require('uuid');
const app = express()
const fs = require('fs')
const multer = require('multer')
const multerUpload = multer({dest: 'uploads/'})

const port = process.env.PORT || 5000
const path = require('path');


app.use(express.json())
app.use(express.urlencoded({ extended:true }))

let item = [
  {
    uid: uuidv4(),
    itemId: uuidv4(),
    title: 'My old Mayhem T-shirt',
    description: 'description',
    category: {
      cars: false,
      home: false,
      clothings: true,
      electronic: false,
      other: false
    },
    images: {
      image1: null,
      image2: null,
      image3: null,
      image4: null
    },
    location: {
      city: 'Pattijoki',
      postalCode: 92140
    },
    deliverytype: {
      shipping: false,
      pickup: true
    },
    contactinfo: {
      sellerName: 'sellername',
      sellerEmail: 'email',
      sellerPhonenumber: '0450450450'
    },
    dateOfPosting: Date.now()
  }
]

let user = [
  {
    uid: uuidv4(),
    username: 'username',
    email: 'email',
    phoneNumber: '05463442',
    password: '$2b$10$DjN/cAf2kTQPb3im4YlMQOVvw9g5vgOSwsv1zVq0CxARZ9xuNHDti',
    name: 'name',
    address: {
      street: 'Street',
      postalCode: 90130,
      city: 'city'
    }
  },
];

let islogged = null;

let img = (req) => {
  var imgArr = [];
  try {
    req.files.forEach(f => {
      fs.renameSync(f.path, './uploads/' + f.originalname);
      imgArr.push('./uploads/' + f.originalname); 
    })
  } catch(err) {
    //console.log(err);
  }

  for(i = imgArr.length; i < 4; i++) {
    imgArr[i] = null;
  }
  return imgArr;
}

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/API_design.html'))
})


//Get users
app.get('/user', (req, res) => {
  res.json({ user });
})

app.get('/item', (req, res) => {
  res.json({item});
})

//Get items
app.get('/item/category', (req, res) => {
  let result = [];
  for(const key in req.query) {
    if(key === "other" && req.query[key] === "true") {
      result = item.filter(t => t.category.other === true);
    } else if(key === "cars" && req.query[key] === "true") {
      result = item.filter(t => t.category.cars === true);
    } else if(key === "home" && req.query[key] === "true") {
      result = item.filter(t => t.category.home === true);
    } else if(key === "clothings" && req.query[key] === "true") {
      result = item.filter(t => t.category.clothings === true);
    } else if(key === "electronic" && req.query[key] === "true") {
      result = item.filter(t => t.category.electronic === true)
    } else {
      res.sendStatus(404);
      break;
    }
    res.json({result});
  }
})

app.get('/item/location', (req, res) => {
  for(const key in req.query) {
    if(key === "city") {
      result = item.filter(t => t.location.city === req.query[key]);
      res.json({result});
    } else {
      res.sendStatus(404);
    }
  }
})

app.get('/item/date', (req, res) => {
  if(req.query.date && req.query.date2) {
    let date1 = new Date(req.query.date);
    let millis1 = date1.getTime();
    let date2 = new Date(req.query.date2);
    let millis2 = date2.getTime();
    result = item.filter(t => (t.dateOfPosting >= millis1) && (t.dateOfPosting <= millis2));
    res.json({result});
  } else {
    console.log("hoho")
    res.sendStatus(404);
  }
})

//login
app.post('/login', (req, res) => {
  for(let i = 0; i < user.length; i++) {
    if(user[i].username === req.body.username) {
      islogged = user[i];
      break;
    } 
  }
  if(islogged) {
    bcrypt.compare(req.body.password, islogged.password, function (err, result) {
      if(result) {
        res.sendStatus(200);
      } else {
        islogged = null;
        res.send('Wrong password');
      }
    })
  }else {
    res.send("Wrong username")
  }
})

//postman to check is logged
app.get('/logged', (req, res) => {
  res.json({islogged});
})

app.post('/logout', (req, res) => {
  islogged = null;
  res.sendStatus(200);
})

//create a new user
app.post('/user', (req, res) => {
  try{
    const newUser = {
      uid: uuidv4(),
      username: req.body.username,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      name: req.body.name,
      address: req.body.address
    };   
    
    if(newUser.username.length > 0 && typeof newUser.username === 'string' &&
    newUser.email.length > 0 && typeof newUser.email === 'string' &&
    newUser.phoneNumber.length > 0 && typeof newUser.phoneNumber === 'string' &&
    newUser.password.length > 4 && typeof newUser.password === 'string' &&
    newUser.name.length > 0 && typeof newUser.name === 'string' &&
    newUser.address.street.length > 0 && typeof newUser.address.street === 'string' &&
    newUser.address.postalCode.toString().length > 0 && typeof newUser.address.postalCode === 'number' &&
    newUser.address.city.length > 0 && typeof newUser.address.city === 'string') 
    {
      bcrypt.hash(newUser.password, saltRounds, function (err, hash) {
        if(hash) {
          newUser.password = hash;
          user.push(newUser);
          res.sendStatus(200);
        } else {
          console.log(err);
          res.sendStatus(400);
        }
      })
    } else {
      res.sendStatus(400);
    }
  } catch(err) {
    res.sendStatus(500);
  }
});

app.post('/item', multerUpload.array('img', 4), (req, res) => {
  try{
    var imgArr = img(req);
    if(islogged != null) {
      const newItem = {
        uid: islogged.uid,
        itemId: uuidv4(),
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        image: {
          image1: imgArr[0],
          image2: imgArr[1],
          image3: imgArr[2],
          image4: imgArr[3]
        },
        deliverytype: req.body.deliverytype,
        contactinfo: req.body.contactinfo,
        dateOfPosting: Date.now()
      };
    
      if(newItem.title.length > 0 && typeof newItem.title === 'string' &&
        newItem.description.length > 0 && typeof newItem.description === 'string' &&
        newItem.location.city.length > 0 && typeof newItem.location.city === 'string' &&
        newItem.location.postalCode.toString().length > 0 && typeof newItem.location.postalCode === 'number' &&
        newItem.contactinfo.sellerName.length > 0 && typeof newItem.contactinfo.sellerName === 'string' &&
        newItem.contactinfo.sellerEmail.length > 0 && typeof newItem.contactinfo.sellerEmail === 'string' &&
        newItem.contactinfo.sellerPhonenumber.length > 0 && typeof newItem.contactinfo.sellerPhonenumber === 'string') 
        {
        if(Object.values(newItem.category).some(e => e === true)) 
        {
          item.push(newItem)
          res.sendStatus(201);
        } else {
          console.log(Object.values(newItem.category).some(e => e === true))
          res.sendStatus(400);
        }
      } else {
        res.sendStatus(400);
      }

    } else {
      res.sendStatus(401);
    }
  } catch (err) {
    res.sendStatus(400);
  }
})

app.put('/user/:uid', (req, res) => {
  const result = user.find(t => t.uid === req.params.uid);
  if(result !== undefined)
  {
    for(const key in req.body){
      result[key] = req.body[key];
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
})

app.put('/item/:itemId', multerUpload.array('img', 4), (req, res) => {
  const result = item.find(t => t.itemId === req.params.itemId);
  if(islogged != null){
    if(result !== undefined)
    {
      if(result.uid === islogged.uid){
        for(const key in req.body){
          result[key] = req.body[key];
        }
        var count = 0;
        var arr = img(req);
        for(let img in result["images"]) {
          result["images"][img] = arr[count];
          count += 1;
        }
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(404);
    }
  } else {
    res.sendStatus(401);
  }
})

app.delete('/item/:itemId', (req, res) => {
  const resultIndex = item.findIndex(t => t.itemId === req.params.itemId);
  const result = item.find(x => x.itemId === req.params.itemId);
  if(islogged != null){
    if(resultIndex !== -1)
    {
      if(result.uid === islogged.uid){
        item.splice(resultIndex, 1);
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(404);
    }
  } else {
    res.sendStatus(401);
  }
})



let serverInstance = null;

module.exports = {
    start: function (){
      serverInstance = app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
      })
    },
    close: function (){
      serverInstance.close()
    }
  }