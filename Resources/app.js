// open a single win
var win = Ti.UI.createWindow({
	backgroundColor:'white'
});

// Get a reference to the module
var box = require('com.codeboxed.boxrestapi'),
	api_key = '', // Your API Key
	auth_token = Ti.App.Properties.getString('auth_token') || null,
	ticket = null,
	file_id = '';

// Load the module
box.load(function (e) {
	// Global callback function
	Ti.API.info(this.responseText);
}, {
	api_key:api_key,
	auth_token:auth_token
});

// Check if the user was logged-in before
if (auth_token == null) {
	login();
}

var button = Ti.UI.createButton({
	top:20,
	width:300,
	height:40,
	title:'create directory'
});

button.addEventListener('click', function () {
	// Call create_folder API function
	box.call('create_folder', function () {
		// Callback anonymous function
		// Response comes as this.responseXML|this.responseText|this.responseData
		// Do some processing on the XML string received from the server
		Ti.API.info(box.prepareResponse(this.responseXML).status);
		Ti.API.info(box.prepareResponse(this.responseXML).json);
		
		// Check to see if the create_folder operation was successful
		if (box.prepareResponse(this.responseXML).status === 's_folder_exists') {
			// Get a reference to the target_id tag in the response
			var target_id = box.prepareResponse(this.responseXML).json.folder.folder_id.text;
			
			Ti.API.info(target_id);
			//Ti.API.info(box.prepareResponse(this.responseXML).json);

			
			// If the directory exists, call delete_ API function
			box.call('delete', function () {
				Ti.API.info(box.prepareResponse(this.responseXML).status);
			}, [
				api_key,
				auth_token,
				'folder',
				target_id
			]);
		}
	}, [
		api_key,
		auth_token,
		0,
		'Testing Box Api',
		1
	]);
	
	// This call returns an error which is handled gracefully 
	//box.call('fail', function () {});
});

var button2 = Ti.UI.createButton({
	top:70,
	width:300,
	height:40,
	title:'download file'
});

button2.addEventListener('click', function () {
	// Test the download call
	box.call('download', function () {
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, file_id + '.mp4');
		
		// Save the file locally
    	file.write(this.responseData);
    	
    	// Assume it's a video file and play it
    	var media = Ti.Media.createVideoPlayer({
    		media:this.responseData,
    		top:150,
    		left:10,
    		width:300,
    		height:200
    	});
    	
    	win.add(media);
    	
    	media.play();
	}, [
		auth_token,
		file_id
	]);
});

var button3 = Ti.UI.createButton({
	bottom:10,
	width:300,
	height:40,
	title:'upload file'
});

button3.addEventListener('click', function () {
	var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, file_id + '.mp4');
	
	// Call the upload API function
	// The upload API function needs an extra set of parameters
	box.call('upload', function () {
		// Echo the response
		Ti.API.info(box.prepareResponse(this.responseXML).status);
	}, [
		auth_token, 
		0
	], {
		file:file.read(), 
		share:1, 
		message:'titanium', 
		emails:['you@example.com'].toString()
	});
});

var button4 = Ti.UI.createButton({
	bottom:60,
	width:300,
	height:40,
	title:'log out'
});

button4.addEventListener('click', function () {
	// Call the logout API function
	box.call('logout', function () {
		Ti.API.info(box.prepareResponse(this.responseXML).status);
	}, [api_key, auth_token]);
	
	Ti.App.Properties.setString('auth_token', null);
	
	// Show the login window
	login();
});

var button5 = Ti.UI.createButton({
	bottom:110,
	width:300,
	height:40,
	title:'show folders'
});

button5.addEventListener('click', showFolders);

win.add(button);
win.add(button2);
win.add(button3);
win.add(button4);
win.add(button5);
win.open();

function login() {
	// According to the Box.net login instructions,
	// first thing is to call get_ticket
	box.call('get_ticket', function() {	
		// If status is OK
		if (box.prepareResponse(this.responseXML).status === 'get_ticket_ok') {
			ticket = box.prepareResponse(this.responseXML).json.ticket.text;
			
			Ti.API.info(ticket);
			
			var loginUrl = 'https://m.box.net/api/1.0/auth/' + ticket;
			
			var loginWindow = Ti.UI.createWindow({
				left:10,
				top:10,
				width:300,
				height:430,
				backgroundColor:'#FFF',
				borderRadius:10,
				borderColor:'#5F9F9F',
				borderWidth:3,
				navBarHidden:true
			});
					
			var loginWebview = Ti.UI.createWebView({
				url:loginUrl,
				top:0,
				width:300,
				height:430
			});
			
			// Confirm login
			var confirmButton = Ti.UI.createButton({
				title:'Close',
				width:280,
				height:30,
				left:10,
				top:390	
			});
			
			confirmButton.addEventListener('click', function (e) {
				// Call get_auth_token API function
				box.call('get_auth_token', function() {
					if (box.prepareResponse(this.responseXML).json.auth_token !== undefined) {
						auth_token = box.prepareResponse(this.responseXML).json.auth_token.text;
						
						Ti.API.info(auth_token);
						
						// Store the auth_token
						Ti.App.Properties.setString('auth_token', auth_token);
					}
				}, [api_key, ticket]);
				
				loginWindow.close({animated:false});
			});
			
			loginWindow.add(loginWebview);
			loginWindow.add(confirmButton);
			
			loginWindow.open({modal:false, animated:false});
		}
	}, [api_key]);
}

function showFolders(data) {
	var tableData;
	
	var foldersWin = Ti.UI.createWindow({
		backgroundColor:'white'
	});

	var tableView = Ti.UI.createTableView({
		top:10,
		width:'100%',
		height:420
	});
	
	tableView.addEventListener('click', function (e) {
		if (e.rowData.type === 'folder') {
			getTree(e.rowData.id);	
		}
	});
	
	var closeButton = Ti.UI.createButton({
		title:'Close',
		width:300,
		height:40,
		left:10,
		bottom:10
	});
	
	closeButton.addEventListener('click', function () {
		foldersWin.close();
	});
	
	foldersWin.add(tableView);
	foldersWin.add(closeButton);
	
	foldersWin.open();
	
	getTree(0);
	
	function getTree(folder_id) {
		tableData = [];
		
		box.call('get_account_tree', function() {
			Ti.API.info(box.prepareResponse(this.responseXML).status);
			
			if (box.prepareResponse(this.responseXML).status === 'listing_ok') {
				var responseJson = box.prepareResponse(this.responseXML).json,
					file = responseJson.tree.folder.files !== undefined ? responseJson.tree.folder.files.file : [],
					folder = responseJson.tree.folder.folders !== undefined ? responseJson.tree.folder.folders.folder : [];
					
				Ti.API.info(responseJson);
				
				// The Box.net API is inconsistent
				// If there is only one folder
				// responseJson.tree.folder.files.file is an Object
				// if there are more folders it is an array
				if (!isArray(folder)) {
					folder = [folder];
				}
				
				if (!isArray(file)) {
					file = [file];
				}
				
				for (var i = 0, b = folder.length; i < b; i++) {
					tableData.push({
						title:folder[i]['attributes'].name, 
						type:'folder', 
						id:folder[i]['attributes'].id,
						hasChild:true
					});
				}
				
				for (var i = 0, b = file.length; i < b; i++) {
					tableData.push({
						title:file[i]['attributes'].file_name, 
						type:'file', 
						id:file[i]['attributes'].id,
						hasChild:false
					});
				}
				
				Ti.API.info(tableData.length);
				
				if (tableData.length == 0) {
					tableData.push({
						title:'Empty',
						type:null
					});
				}

				tableView.data = tableData;
			}
		}, [api_key, auth_token, folder_id, 'params[]=onelevel&params[]=nozip&params[]=simple']);
	}
}

function isArray (obj) {
	return !(obj.constructor.toString().indexOf('Array') == -1);
}