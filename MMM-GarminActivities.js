/* global Module */

/* Magic Mirror
 * Module: Garmin Activities
 *
 * By Sebastien Carrier
 * Very inspired by Trello project of Joseph Bethge
 * MIT Licensed.
 */

Module.register("MMM-GarminActivities",{
    // Default module config.
    defaults: {
        text: "MMM-GarminActivities",
		userAccessToken: '',
		appAccessToken:  '',
		optionsConnectionGarmin: {
			host :  'connect.garmin.com',
			port : 443,
			path : '/proxy/activitylist-service/activities/[userGarmin]?start=[startEntries]&limit=[limitEntries]',			
			method : 'GET'
			},
		defaultSymbol: "heartbeat", // Fontawesome Symbol see http://fontawesome.io/cheatsheet/
		cyclingSymbol: "bicycle",
		runningSymbol: "road",
		encoding : 'UTF-8',
		reloadInterval: 10 * 60 * 1000, // every 10 minutes
		//updateInterval: 10 * 1000, // every 10 seconds
		updateInterval: 5 * 1000, // every 10 seconds
		animationSpeed: 2.5 * 1000, // 2.5 seconds
		startEntries: 1, // Start Entries
		limitEntries: 5, // Total Maximum Entries
		userGarmin: 'YOU GARMIN CONNECT ID',
		list: "",
		fadePoint: 0.25 // Start on 1/4th of the list.		
    },

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		this.listContent = {};

		this.loaded = false;
		this.error = false;
		this.errorMessage = "";
		this.retry = true;

		this.setGarminConfig();
		
		this.requestUpdate();
		this.scheduleUpdateRequestInterval();
	},

		/* scheduleVisualUpdateInterval()
	 * Schedule visual update.
	 */
	scheduleVisualUpdateInterval: function() {
		var self = this;

		self.updateDom(self.config.animationSpeed);

		setInterval(function() {
			self.updateDom(self.config.animationSpeed);
		}, this.config.updateInterval);
	},
	
	/* scheduleUpdateRequestInterval()
	 * Schedule visual update.
	 */
	scheduleUpdateRequestInterval: function() {
		var self = this;

		setInterval(function() {
			if (self.retry)
			{
				self.requestUpdate();
			}
		}, this.config.reloadInterval);
	},	
	
	// Define required scripts.
	getStyles: function() {
		return ["calendar.css", "font-awesome.css"];
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},		
	
	// Define required translations.
	getTranslations: function() {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionairy.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},		
	
	getDom: function() {
		//var wrapper = document.createElement("div");
		var tableWrapper = document.createElement("table");
		tableWrapper.className = "small";
		
		//var ActivityDate = new Date('2000-01-01');

		if (this.loaded) {
			if (this.listContent.length == 0) {
				tableWrapper.innerHTML = (this.loaded) ? this.translate("EMPTY") : this.translate("LOADING");
				tableWrapper.className = "small dimmed";
				return tableWrapper;
			}
			else
			{
				var desc = document.createElement("div");
				desc.className = "small light";
			
				var nbActivities = Object.keys(this.listContent['activityList']).length;			
				var activities = this.listContent['activityList'];
				var typeActivity = ''
				var typeActivityLib = ''
				
				for (var a in activities) {
					var trWrapper = document.createElement("tr");
					trWrapper.className = "normal";
				
				   var activity = activities[a];
				   

			     		
					var tdSymbolWrapper =  document.createElement("td");
					tdSymbolWrapper.className = "symbol";
					var symbol =  document.createElement("span");
					
				   typeActivity = activity.activityType.typeKey;
				   if (typeActivity == 'running'){
					  typeActivityLib = 'Course à pied';
					  symbol.className = "fa fa-" + this.config.runningSymbol;
					}
					else if(typeActivity == 'road_biking'){
					  typeActivityLib = 'Vélo'					
					  symbol.className = "fa fa-" + this.config.cyclingSymbol;
					}
					else{
					  symbol.className = "fa fa-" + this.config.defaultSymbol;
					}
					tdSymbolWrapper.appendChild(symbol);
					trWrapper.appendChild(tdSymbolWrapper);				
								
					var tdActivityNameWrapper = document.createElement("td");
					tdActivityNameWrapper.className = "title bright";
					tdActivityNameWrapper.innerHTML = activity.activityName;
					trWrapper.appendChild(tdActivityNameWrapper);
					
					var tTimeNameWrapper = document.createElement("td");
					tTimeNameWrapper.className = "time light";
					tTimeNameWrapper.innerHTML = moment(activity.startTimeLocal).format("dddd D MMMM");
				
					trWrapper.appendChild(tTimeNameWrapper);

					// Create fade effect.
					if (this.config.fadePoint < 1) {
						if (this.config.fadePoint < 0) {
							this.config.fadePoint = 0;
						}
						var startingPoint = nbActivities * this.config.fadePoint;
						var steps = nbActivities - startingPoint;
						if (a >= startingPoint) {
							var currentStep = a - startingPoint;
							trWrapper.style.opacity = 1 - (1 / steps * currentStep);
						}
					}					
									
					tableWrapper.appendChild(trWrapper);
				}
			}
		} else {
			if (this.error)
			{
				tableWrapper.innerHTML = "Please check your config file, an error occured: " + this.errorMessage;
				tableWrapper.className = "xsmall dimmed";
			}
			else
			{
				tableWrapper.innerHTML = this.translate("LOADING");
				tableWrapper.className = "small dimmed";
			}
		}

		return tableWrapper;	
	},		
	
	
		
	/* setGarminConfig()
	 * intializes garmin backend
	 * set Garmin parameters
	 */
	setGarminConfig: function() {		
		this.config.optionsConnectionGarmin.path = this.config.optionsConnectionGarmin.path.toString().replace('[userGarmin]', this.config.userGarmin);
		this.config.optionsConnectionGarmin.path = this.config.optionsConnectionGarmin.path.replace('[startEntries]', this.config.startEntries);
		this.config.optionsConnectionGarmin.path = this.config.optionsConnectionGarmin.path.replace('[limitEntries]', this.config.limitEntries);		
	
		this.sendSocketNotification("GARMIN_CONFIG", { optionsConnectionGarmin: this.config.optionsConnectionGarmin });
	},

	/* requestUpdate()
	 * request a list content update
	 */
	requestUpdate: function() {
		this.sendSocketNotification("REQUEST_LIST_CONTENT", { list: this.config.list });
	},	
	
	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "GARMIN_ERROR") {
			this.errorMessage = "Error " + payload.statusCode + "(" + payload.statusMessage + "): " + payload.responseBody;
			Log.error(this.errorMessage);

			if (payload.statusCode == 401 || payload.statusCode == 400) {
				this.error = true;
				this.retry = false;
				this.updateDom(self.config.animationSpeed);
			}
		}
		if (notification === "LIST_CONTENT") {
			this.error = false;

			this.listContent = payload;

			if (!this.loaded) {
				this.scheduleVisualUpdateInterval();
				this.loaded = true;
			}
		}
	},	
	
});