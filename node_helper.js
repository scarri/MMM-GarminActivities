/* Magic Mirror
 * Node Helper: Garmin Activities
 *
 * By Sebastien Carrier
 * Very inspired by Trello project of Joseph Bethge
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const https = require('https');

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function() {
        var self = this;
        console.log("Starting node helper for: " + self.name);

        self.list = ""
		self.optionsConnectionGarmin = "";
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        var self = this;

        if (notification === "GARMIN_CONFIG") {
			self.optionsConnectionGarmin = payload.optionsConnectionGarmin;
        }

        if (notification === "REQUEST_LIST_CONTENT") {
            const list = payload.list;		
            self.retrieveListContentGarmin(list);
        }
    },

		
    // retrieve list content
    retrieveListContentGarmin: function(list) {
        var self = this;	

		//making the https get call
		var getReq = https.request(this.optionsConnectionGarmin, function(res) {
			//console.log("\nstatus code: ", res.statusCode);
			res.on('data', function(data) {								
				var json = JSON.parse(data);
				self.sendSocketNotification("LIST_CONTENT", json);	
			});
		});
		getReq.on('error', function(err){
			
			self.sendSocketNotification("GARMIN_ERROR", error);
		});
		getReq.end();		
			
			
		
    },	
});
