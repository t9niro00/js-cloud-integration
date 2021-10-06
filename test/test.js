const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const server = require('../server');
const fs = require('fs');

const expect = chai.expect;
const apiAddress = 'https://cloud-integration.herokuapp.com';

describe('Webstore api operations', function() {

  before(function() {
    server.start();
  })

  after(function() {
    server.close();
  })

  let islogged;
  let item = [];

  describe('create a new user', () => {
    it('should create a new user', async () => {
      await
      chai
        .request(apiAddress)
        .post('/user')
        .send({
          username: 'Roope123',
          email: 'foo@bar.com',
          phoneNumber: '0450450450',
          password: 'password123',
          name: 'Roope',
          address: {
            street: 'Pietarinpolku',
            postalCode: 92140,
            city: 'Pattijoki'
          }
        })
        .then(response => {
          expect(response.status).to.equal(200);
          return chai.request(apiAddress).get('/user');
        })
        .then(readResponse => {
          expect(readResponse.body.user[readResponse.body.user.length - 1].username).to.equal('Roope123')
          expect(readResponse.body.user[readResponse.body.user.length - 1].email).to.equal('foo@bar.com')
          expect(readResponse.body.user[readResponse.body.user.length - 1].phoneNumber).to.equal('0450450450')
          expect(readResponse.body.user[readResponse.body.user.length - 1].name).to.equal('Roope')
          expect(readResponse.body.user[readResponse.body.user.length - 1].address).to.deep.equal({
            street: "Pietarinpolku",
            postalCode: 92140,
            city: "Pattijoki"
          });
        })
    })

    it('should not create a new user if empty strings', async () => {
      await
      chai
        .request(apiAddress)
        .post('/user')
        .send({
          username: '',
          email: 'foo@bar.com',
          phoneNumber: '0450450450',
          password: 'password123',
          name: 'Roope',
          address: {
            street: 'Pietarinpolku',
            postalCode: 92140,
            city: 'Pattijoki'
          }
        })
        .then(response => {
          expect(response.status).to.equal(400);
        })
        .catch(err => {
          expect.fail(err);
        })
    })

    it('should not create a new user if password is under 4 characters long', async () => {
      await
      chai
        .request(apiAddress)
        .post('/user')
        .send({
          username: 'Roope123',
          email: 'foo@bar.com',
          phoneNumber: '0450450450',
          password: 'pa1',
          name: 'Roope',
          address: {
            street: 'Pietarinpolku',
            postalCode: 92140,
            city: 'Pattijoki'
          }
        })
        .then(response => {
          expect(response.status).to.equal(400);
        })
        .catch(err => {
          expect.fail(err);
        })
    })

    it('should not create a new user if one or more field is string (except postalCode = number)', async () => {
      await
      chai
        .request(apiAddress)
        .post('/user')
        .send({
          username: 'Roope123',
          email: 654654,
          phoneNumber: false,
          password: 'password123',
          name: 16874861,
          address: {
            street: 'Pietarinpolku',
            postalCode: 92140,
            city: 'Pattijoki'
          }
        })
        .then(response => {
          expect(response.status).to.equal(400);
        })
        .catch(err => {
          expect.fail(err);
        })
    })

    it('should not create a new user if one or more field is null', async () => {
      await
      chai
        .request(apiAddress)
        .post('/user')
        .send({
          username: 'Roope123',
          email: '654654',
          phoneNumber: null,
          password: 'password123',
          name: 'Roope',
          address: {
            street: 'Pietarinpolku',
            postalCode: 92140,
            city: 'Pattijoki'
          }
        })
        .then(response => {
          expect(response.status).to.equal(500);
        })
        .catch(err => {
          expect.fail(err);
        })
    })
  })

  describe('logging in', () => {
    it('should response "Wrong username" and not log in if the username is inconnect', async () => {
      await
      chai
        .request(apiAddress)
        .post('/login')
        .send({
          username: "usernamewrong",
          password: "password123"
        })
        .then(response => {
          expect(response.status).to.equal(200);
          expect(response.text).to.equal('Wrong username');
          return chai.request(apiAddress).get('/logged')
        })
        .then(readResponse => {
          expect(readResponse.body.islogged).to.be.a('null');
        });
    })

    it('should response "Wrong password" and not log in if the password is inconnect', async () => {
      await
      chai
        .request(apiAddress)
        .post('/login')
        .send({
          username: "username",
          password: "password"
        })
        .then(response => {
          expect(response.status).to.equal(200);
          expect(response.text).to.equal('Wrong password');
          return chai.request(apiAddress).get('/logged')
        })
        .then(readResponse => {
          expect(readResponse.body.islogged).to.be.a('null');
        });
    })

    it('should log in if the username and password are correct', async () => {
      await
      chai
        .request(apiAddress)
        .post('/login')
        .send({
          username: "username",
          password: "password123"
        })
        .then(response => {
          expect(response.status).to.equal(200);
          return chai.request(apiAddress).get('/logged');
        })
        .then(readResponse => {
          islogged = readResponse.body.islogged;
          expect(readResponse.body.islogged.username).to.equal('username')
          expect(readResponse.body.islogged.password).to.equal('$2b$10$DjN/cAf2kTQPb3im4YlMQOVvw9g5vgOSwsv1zVq0CxARZ9xuNHDti')
        })
        .catch(err => {
          expect.fail(err);
        })
    })
  })

  describe('Create a new item', async () => {
    it('should create a new item', async () => {
      await
      chai
        .request(apiAddress)
        .post('/item')
        .send({
          uid: islogged.uid,
          title: 'My old car',
          description: 'Very much used',
          category: {
            cars: true,
            home: false,
            clothings: false,
            electronic: false,
            other: false
          },
          images: {
            image1: (fs.readFileSync('./test/images/unknown.jpg'), 'test1_0.jpg'),
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
            sellerName: 'Roope',
            sellerEmail: 'Roope@email.com',
            sellerPhonenumber: '0450450450'
          }
        })
        .then(response => {
          expect(response.status).to.equal(201);
          return chai.request(apiAddress).get('/item')
        })
        .then(res => {
          item.push(res.body.item[res.body.item.length - 1]);
        })
    })

    it('should not create a new item if empty string', async () => {
      await
      chai
        .request(apiAddress)
        .post('/item')
        .send({
          uid: islogged.uid,
          title: '',
          description: 'Very much used',
          category: {
            cars: true,
            home: false,
            clothings: false,
            electronic: false,
            other: false
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
            sellerName: 'Roope',
            sellerEmail: 'Roope@email.com',
            sellerPhonenumber: '0450450450'
          }
        })
        .then(response => {
          expect(response.status).to.equal(400);
        })
    })  

    it('should not create a new item if empty field', async () => {
      await
      chai
        .request(apiAddress)
        .post('/item')
        .send({
          uid: islogged.uid,
          title: null,
          description: 'Very much used',
          category: {
            cars: true,
            home: false,
            clothings: false,
            electronic: false,
            other: false
          },
          location: {
            city: 'Pattijoki',
            postalCode: 90100
          },
          deliverytype: {
            shipping: false,
            pickup: true
          },
          contactinfo: {
            sellerName: 'Roope',
            sellerEmail: 'Roope@email.com',
            sellerPhonenumber: '0450450450'
          }
        })
        .then(response => {
          expect(response.status).to.equal(400);
        })
    })    

    it('should now create a new item if not logged in', async () => {
      await
      chai
        .request(apiAddress)
        .post('/logout')
        .then(response => {
          expect(response.status).to.equal(200);
          return chai .request(apiAddress).post('/item')
          .send({
            uid: islogged.uid,
            title: 'My old car',
            description: 'Very much used',
            category: {
              cars: true,
              home: false,
              clothings: false,
              electronic: false,
              other: false
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
              sellerName: 'Roope',
              sellerEmail: 'Roope@email.com',
              sellerPhonenumber: '0450450450'
            }
          })
        })
        .then(responseRead => {
          expect(responseRead.status).to.equal(401);
        })
    })
  })

  describe('Modify a item', async () => {
    it('should modify a item', async () => {
      await
      chai
        .request(apiAddress)
        .post('/login')
        .send({
          username: 'username',
          password: 'password123'
        })
        .then(response => {
          expect(response.status).to.equal(200);
          return chai .request(apiAddress).put('/item/' + item[item.length -1].itemId)
            .send({
              title: 'New Title'
            })
        })
        .then(res => {
          expect(res.status).to.equal(200);
        })
    })

    it('should add a image to a item', async () => {
      await
      chai
        .request(apiAddress)
        .put('/item/' + item[item.length - 1].itemId)
        .attach('img', fs.readFileSync('./test/images/unknown.jpg'), 'test1_1.jpg')
        .field('title', 'new title')
        .then(response => {
          expect(response.status).to.equal(200);
        })
    })

    it('should not modify item if item does not exist', async () => {
      await
      chai
        .request(apiAddress)
        .put('/item/randomId')
        .send({
          title: 'New Title'
        })
        .then(res => {
          expect(res.status).to.equal(404);
        })
    })  
    
    it('should not modify if not permission', async () => {
      await
      chai
        .request(apiAddress)
        .post('/logout')
        .then(response => {
          expect(response.status).to.equal(200);
          return chai .request(apiAddress).put('/item/' + item[item.length -1].itemId)
          .send({
            title: 'new car title'
          })
        })
        .then(responseRead => {
          expect(responseRead.status).to.equal(401);
        })
    })
  })

  describe('Delete item', async () => {  
    it('should delete item', async () => {
      await
      chai
        .request(apiAddress)
        .post('/login')
        .send({
          username: 'username',
          password: 'password123'
        })
        .then(response => {
          expect(response.status).to.equal(200);
          return chai.request(apiAddress).get('/logged')
        .then(responseRead => {
          islogged = responseRead.body.islogged
          return chai.request(apiAddress).delete('/item/' + item[item.length -1].itemId)
        })
        .then(res => {
          expect(res.status).to.equal(200);
          return chai.request(apiAddress).post('/item').send({
            uid: islogged.uid,
            title: 'My old car',
            description: 'Very much used',
            category: {
              cars: true,
              home: false,
              clothings: false,
              electronic: false,
              other: false
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
              sellerName: 'Roope',
              sellerEmail: 'Roope@email.com',
              sellerPhonenumber: '0450450450'
            }
          })
        })
        .then(resp => {
          expect(resp.status).to.equal(201);
          return chai.request(apiAddress).get('/item')
        })
        .then(respo => {
          item.push(respo.body.item[respo.body.item.length - 1]);
        })

      })
    })

    it('should not delete item if item not found', async () => {
      await
      chai
        .request(apiAddress)
        .delete('/item/randomId')
        .then(response => {
          expect(response.status).to.equal(404);
        })
    })

    it('should not delete item if not permission', async () => {
      await
      chai
        .request(apiAddress)
        .post('/logout')
        .then(response => {
          return chai.request(apiAddress).delete('/item/'+ item[item.length -1].itemId)
        })
        .then(res => {
          expect(res.status).to.equal(401);
        })
    })
  })

  describe('Search items', async () => {
    it('should find item by category', async () => {
      await
      chai
        .request(apiAddress)
        .get('/item/category/?cars=true')
        .then(response => {
          expect(response.body.result[response.body.result.length - 1].category.cars)
          .to.be.true;
          })
    })

    it('should find item by location', async () => {
      await
      chai
        .request(apiAddress)
        .get('/item/location/?city=Pattijoki')
        .then(response => {
          expect(response.body.result[response.body.result.length - 1].location.city)
          .to.equal('Pattijoki')
        })
    })

    it('should find item by two dates', async () => {
      date1 = '05/05/2020'
      date2 = '11/11/2021'

      expectDate1 = new Date(date1);
      date1InMillis = expectDate1.getTime();
      expectDate2 = new Date(date2);
      date2InMillis = expectDate2.getTime();

      await
      chai
        .request(apiAddress)
        .get('/item/date/?date=' + date1 + '&date2=' + date2)
        .then(response => {
          expect(response.body.result[response.body.result.length - 1].dateOfPosting)
          .to.be.at.least(date1InMillis)
          expect(response.body.result[response.body.result.length - 1].dateOfPosting)
          .to.be.below(date2InMillis)
        })
    })

    it('should return all items', async () => {
      await
      chai
        .request(apiAddress)
        .get('/item')
        .then(response => {
          expect(response.body.item.length).to.be.at.least(1)
        })
    })

    it('should not return item if cannot find', async () => {
      await
      chai
        .request(apiAddress)
        .get('/item/category/?electronic=true')
        .then(response => {
          expect(response.body.result).to.be.empty;
        })
    })

    it('should not return anythink if wrong query parameters', async () => {
      await
      chai
        .request(apiAddress)
        .get('/item/cate/?cars=true')
        .then(response => {
          expect(response.status).to.equal(404);
        })
    })

  })
})