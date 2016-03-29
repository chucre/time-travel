#!/usr/bin/env node

var trackingParser = require('./tracking-parser'),
    mapMatching = require('./map-matching'),
    timeTravelCalculate = require('./time-travel-calculate'),
    file_name = (process.argv[3] || process.argv[2]).trim(),
    pg = require('pg'),
    conString = process.env['POSTGRES_URL'] || 'postgres://localhost/test';

trackingParser(file_name, function(traking){
  mapMatching(traking, function(route, traking){
    timeTravelCalculate(route, traking, function(route){
      route.links.map(function(e){
	var geometry = JSON.parse(e.geometry);
	pg.connect(conString, function(err, client, done) {
	  client.query('select count(*) as total from edgelatlng where idedge = $1::int', [e.id], function(err, result) {
	    if (err) {
              console.log(err);
            }
	    if (result.rows[0].total==0) {
              var j = geometry.coordinates.length-1;
              client.query('insert into edgelatlng (idedge, geometry) values ($1::int, $2);', [e.id, e.geometry], function(err, result){
                if (err) {
                  console.log(err);
                }
                done();
              });
            } else {
              done();
            }
	  });
        });
        pg.connect(conString, function(err, client, done) {
	  client.query('insert into edgeid (idedge, timeday, totaltime) values ($1, $2, $3)',[e.id, e.entry_time, e.total_time], function(err, result){
           if (err) {
              console.log(err);
           }
           done();
          });
	});
        console.log(e.id+';'+JSON.stringify(geometry.coordinates)+';'+e.total_time+';'+e.totalLength+';'+e.entry_time);
      })
    });
  })
})

//trackingParser -> mapMatching -> timeTravelCalculate -> write in database
