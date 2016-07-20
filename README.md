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
GET: '/api/users', auth.hasRole('admin'): Get all users
GET: '/api/users/me', auth.isAuthenticated(): Get self info
GET: '/api/users/:id', auth.isAuthenticated(): Get a specified user info

POST: '/api/users' : Create a new user

PUT: '/me', auth.isAuthenticated(): Update self info
PUT: '/:id/password', auth.isAuthenticated(): Change password

DELETE: '/:id', auth.hasRole('admin'): Delete a user


#### Post

GET: '/' : Get all posts
GET: '/mine', auth.isAuthenticated() : Get posts made by self
GET: '/:id' : Get a specified post

POST: '/', auth.isAuthenticated() : Create a new post
POST: '/like/:id', auth.isAuthenticated(): Like/dislike a specified post

PUT: '/:id': Update a specified post

DELETE: '/:id' : Delete a specified post


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
