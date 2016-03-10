"use strict";

var request = require("request-json");
var async = require("async");

var accessToken = process.env.GITHUB_ACCESS_TOKEN;


var client = request.createClient("https://api.github.com");
client.headers.Authorization = "token " + accessToken;

function getAPI(url, callback, oldBody, page) {
	if (page === undefined){
		page = 1;
	}

	if (oldBody === undefined){
		oldBody = [];
	}

	client.get(url + "?per_page=100&page=" + page, function(err, res, body) {
		if (err) {
			console.log(err);
		}

		for (var i in body){
			oldBody.push(body[i]);
		}

		var link = res.caseless.dict.link;
		if (link !== undefined && link.substring(link.indexOf(";")+7, link.indexOf(";")+11) === "next") {
			getAPI(url, callback, oldBody, page+1);
		}
		else {
			callback(null, oldBody);
		}
	});
}

function getAllRepos(username, callback){
	async.map(
		{
			starred: "users/"+username+"/starred",
			repos: "users/"+username+"/repos",
			orgs: "users/"+username+"/orgs",
		}, getAPI,
		function(err, results){
			var userRepos = [];

			var i;
			for (i = 0; i < results.starred.length; i++){
				userRepos.push(results.starred[i]);
			}
			for (i = 0; i < results.repos.length; i++){
				userRepos.push(results.repos[i]);
			}

			async.map(
				results.orgs,
				function(org, callback){
					getAPI("/orgs/" + org.login + "/repos", callback);
				},
				function(err, results){
					for (var i = 0; i < results.length; i++){
						var orgRepos = results[i];
						for (var ii = 0; ii < orgRepos.length; ii++){
							userRepos.push(orgRepos[ii]);
						}
					}

					callback(userRepos);
				}
			);
		}
	);
}

module.exports = {
	getAllRepos: getAllRepos
};
