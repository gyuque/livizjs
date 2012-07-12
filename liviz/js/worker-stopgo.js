(function(parent, className) {
	"use strict";
	var StopGo = {
		Worker: function(messagePort, proc) {
			var _this = this;
			this.messagePort = messagePort;
			this.sharedFileURL = null;
			this.proc = proc;
			this.running = false;
			messagePort.addEventListener("message", function(event) {
				if (event.data) {
					switch(event.data.type) {
					case "_stopgo_run":
						if (!_this.running) {
							_this.sharedFileURL = event.data.sharedFileURL;
							_this.running = true;
							_this.proc(_this);
							_this.setStopped();
						}
						break;
					}
				}
			}, false);
		},

		Controller: function(targetWorker, onReady, onComplete) {
			this.targetWorker = targetWorker;
			this.sharedFileWriter = null;
			this.sharedFileURL    = null;
			this.makeFlagBlobs();
			this.createSharedFile(onReady);

			targetWorker.addEventListener("message", function(event) {
				if (event.data) {
					switch(event.data.type) {
					case "_stopgo_complete":
						if (onComplete) {
							onComplete();
						}
						break;
					}
				}
			}, false);
		}
	};

	StopGo.Worker.prototype = {
		shouldStop: function () {
			if (!this.sharedFileURL){ return false; }

			return compareFileContent(this.sharedFileURL, "STOP");
		},

		setStopped: function() {
			var _this = this;
			setTimeout(function() {
				_this.running = false;
			}, 50);
		},

		setCompleted: function() {
			this.messagePort.postMessage({type: '_stopgo_complete'});
		}
	};

	StopGo.Controller.prototype = {
		makeFlagBlobs: function() {
			var builder1 = getBlobBuilder();
			if (!builder1) {
				return;
			}
			
			builder1.append("RUN ");

			var builder2 = getBlobBuilder();
			builder2.append("STOP");

			this.blobRUN  = builder1.getBlob('text/plain');
			this.blobSTOP = builder2.getBlob('text/plain');
		},

		run: function() {
			var w = this.sharedFileWriter;
			function postRunMsg() {
				if (w) {
					w.onwriteend = null;
				}
				_this.targetWorker.postMessage({type: '_stopgo_run', sharedFileURL: _this.sharedFileURL});
			}
		
			var _this = this;
			this.setFlag(false);
			if (w) {
				w.onwriteend = postRunMsg;
			} else {
				postRunMsg();
			}
		},

		stop: function() {
			this.setFlag(true);
		},

		setFlag: function(stopFlag) {
			if (this.sharedFileWriter) {
				this.sharedFileWriter.seek(0);
				this.sharedFileWriter.write(stopFlag ? this.blobSTOP : this.blobRUN);
			}
		},

		createSharedFile: function(onComplete) {
			var _this = this;
			if (!window.webkitRequestFileSystem) {
				this.sharedFileWriter = this.sharedFileURL = null;
				onComplete(null);
				return;
			}
			
			webkitRequestFileSystem(TEMPORARY, 64, 
				function(fs){ // success
					fs.root.getFile("shared-status.txt", {create: true}, function(fileEntry) {
						fileEntry.createWriter(function(fileWriter) {
							_this.sharedFileWriter = fileWriter;
							fileEntry.file(function(f){
								var u = webkitURL || URL;
								_this.sharedFileURL = u.createObjectURL(f);
								onComplete( _this.sharedFileURL );
							});
						});
					});
				},
				function(){ // fail
					console.log("FAIL FS");
					_this.sharedFileWriter = _this.sharedFileURL = null;
					onComplete(null);
				}
			);
		}
	};

	function getBlobBuilder() {
		var ctor = null;
		try { ctor = MozBlobBuilder; } catch(e) {}
		if (!ctor) {
			try { ctor = WebKitBlobBuilder; } catch(e) {}
		}

		return ctor ? (new ctor()) : null;
	}

	function compareFileContent(url, keyword) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, false);
		xhr.send(null);

		return xhr.responseText.indexOf(keyword) >= 0;
	}

	parent[className] = StopGo;
})(this, "WorkerStopGo");

function postArgMessage(port, msgType, arg) {
	var msg = {type: msgType};
	if (arguments.length > 1) {
		msg.arg0 = arg;
	}

	port.postMessage(msg);
}
