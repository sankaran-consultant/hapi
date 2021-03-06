'use strict';
const siteConfig = require('./config');
const Hapi = require('hapi');
const Good = require('good');
const mysql = require('mysql');
const server = new Hapi.Server();
const Auth = require('./auth');
const Path = require('path');
const Hoek = require('hoek');
const Joi = require('joi');

server.connection({ 
    host: 'localhost', 
    port: 3000 
});

var dbConnection = mysql.createConnection({
  host     : siteConfig.db.host,
  user     : siteConfig.db.root,
  password : siteConfig.db.pass,
  database : siteConfig.db.dbName
});
dbConnection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    // console.log('connected as id ' + dbConnection.threadId);
});
// console.log(dbConnection); return;

server.bind({db: dbConnection});
server.bind({joi: Joi});

// Add the route
/*
server.route({
    method: 'GET',
    path:'/{name}', 
    handler: function (request, reply) {
        // return reply('hello world');
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});

server.route({
    method: 'GET',
    path:'/hello', 
    handler: function (request, reply) {
        return reply('hello world');
    }
});
*/

server.register(require('hapi-auth-bearer-token'), (err) => {
    if (err) { throw err; }
    server.auth.strategy('jsonAuth', 'bearer-access-token', {
        validateFunc: Auth.validateFunc
    });
});

server.register(require('inert'), (err) => {
    if (err) {
        throw err;
    }
    server.route(require('./routes'));
});

// Start the server
/*
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
*/

server.register(require('vision'), (err) => {
    Hoek.assert(!err, err);
    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates',
        layout: true,
        layoutPath: './templates/layout'
    });
});

server.register({
    register: Good,
    options: {
        reporters: {
            console: [{
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{
                    response: '*',
                    log: '*'
                }]
            }, {
                module: 'good-console'
            }, 'stdout']
        }
    }
}, (err) => {
    if (err) {
        throw err; // something bad happened loading the plugin
    }
    server.start((err) => {
        if (err) {
            throw err;
        }
        server.log('info', 'Server running at: ' + server.info.uri);
    });
});

/*
dbConnection.end(function(err) {
  // The connection is terminated now 
});
*/