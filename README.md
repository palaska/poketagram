# poketagram

## Pages

### Main Page
This page is the newsfeed similar to Instagram's main page. On top of all the posts, there must be a text input and a file upload input to create a new post.

### My following posts
This page has the same layout as the main page. The main difference is you only see posts of the people you follow. On top of all the posts, there must be a text input and a file upload input to create a new post.

### Login Page
Login with email and password.

### Sign up Page
#### User fields
- given_name : String
- family_name : String
- email : String
- username : String
- avatar : MediaSchema

### Profile Page
This page should include that specific user's info and posts.


API Usage

#### User

```javascript
var UserSchema = new Schema({
  username: String,
  given_name: String,
  family_name: String,
  avatar: {
  	url: 'http://someurltoimage.com/image.jpg'
  },
  email: {
    type: String,
    lowercase: true
  },
  role: {
    type: String,
    default: 'user'
  },
  following: [{
    ref: 'User',
    type: Schema.ObjectId
  }],
  password: String,
  provider: String,
  salt: String,
  facebook: {},
  twitter: {},
  google: {},
  github: {}
});
```
 - GET: '/api/users', auth.hasRole('admin'): Get all users
 - GET: '/api/users/me', auth.isAuthenticated(): Get self info
 - GET: '/api/users/:id', auth.isAuthenticated(): Get a specified user info

 - POST: '/api/users' : Create a new user

 - PUT: '/api/users/me', auth.isAuthenticated(): Update self info
 - PUT: '/api/users/:id/password', auth.isAuthenticated(): Change password

 - DELETE: '/api/users/:id', auth.hasRole('admin'): Delete a user


#### Post

```javascript
var PostSchema = new Schema({
  text: String,
  image: {
  	url: 'http://someurltoimage.com/image.jpg'
  },
  by: {
  	ref: 'User',
  	type: Schema.ObjectId
  },
  liked_by: [{
  	ref: 'User',
  	type: Schema.ObjectId
  }],
  created_at: Date
});
```

 - GET: '/api/posts/' : Get all posts
 - GET: '/api/posts/mine', auth.isAuthenticated() : Get posts made by self
 - GET: '/api/posts/following', auth.isAuthenticated() : Get posts of the people who
 - GET: '/api/posts/:id' : Get a specified post
 
 - POST: '/api/posts/', auth.isAuthenticated() : Create a new post
 - POST: '/api/posts/like/:id', auth.isAuthenticated(): Like/dislike a specified post
 
 - PUT: '/api/posts/:id': Update a specified post
 
 - DELETE: '/api/posts/:id' : Delete a specified post


This project was generated with the [Angular Full-Stack Generator](https://github.com/DaftMonk/generator-angular-fullstack) version 3.0.0-rc8.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js and NPM](nodejs.org) >= v0.12.0
- [Bower](bower.io) (`npm install --global bower`)
- [Ruby](https://www.ruby-lang.org) and then `gem install sass`
- [Grunt](http://gruntjs.com/) (`npm install --global grunt-cli`)
- [MongoDB](https://www.mongodb.org/) - Keep a running daemon with `mongod`

### Developing

1. Run `npm install` to install server dependencies.

2. Run `bower install` to install front-end dependencies.

3. Run `mongod` in a separate shell to keep an instance of the MongoDB Daemon running

4. Run `grunt serve` to start the development server. It should automatically open the client in your browser when ready.

## Build & development

Run `grunt build` for building and `grunt serve` for preview.

## Testing

Running `npm test` will run the unit tests with karma.
