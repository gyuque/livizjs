/*
 -> JSViz <-
 Interactive GraphViz on DHTML

-- MIT License

Copyright (c) 2011-2012 Satoshi Ueyama

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, 
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/

(function() {
	function setWorkerSTDIN(txt) {
		postArgMessage(dotWorker, "setWorkerSTDIN", txt); }
	function setupGVContext(opt) {
		postArgMessage(dotWorker, "setupGVContext", opt); }
	function runDotLayout() {
		postArgMessage(dotWorker, "runDotLayout"); }

	var dotWorker = null;
	var progressView = null;
	var graphsCtrl = null;
	var stopGo = null;
	var startAnimationFunc = null;
	var appScreen = null;
	var errorSink;
	var demoDiffPager = null;
	
	var runOptions = {
		slow: false,
		prog: false
	};


	window.w_launch = function() {
		progressView = new JSViz.ProgressView();
		document.body.appendChild(progressView.getElement());
		progressView.autoFit();
		progressView.renderLabel(progressView.g, true, "Initializing...");
		progressView.show();
		setupUI();
		
		graphsCtrl = new JSViz.GraphsController('graph-svg');
		appScreen.watchResize(graphsCtrl, document.body, true);
		appScreen.goButton.setEnabled(false);
		appScreen.goButton.onOptionalCommand = onOptionalMenuCommand;
		
		dotWorker = new Worker("js/worker-main.js?v=2");
		setupMessageHandler(dotWorker);
		stopGo = new WorkerStopGo.Controller(dotWorker,
			function(){ // stopGo ready
				postArgMessage(dotWorker, "init");
			},
			function() { // worker task complete
			
			});
	};
	
	function afterInit() {
		appScreen.goButton.setEnabled(true);
		progressView.hideWithAnimation();
		
		appScreen.goButton.eventDispatcher().click(function(){
			runOptions.slow = false;
			runOptions.prog = false;
			startDot();
		});
	}
	
	function onOptionalMenuCommand(cmd) {
		switch(cmd) {
		case 'cmd-prog':
			runOptions.slow = false;
			runOptions.prog = true;
			startDot();
			break;
		case 'cmd-slow':
			runOptions.slow = true;
			runOptions.prog = false;
			startDot();
			break;
		case 'cmd-demo':
			demoDiffPager = new difftype.DiffPager("./demodata", appScreen.codingTextBox, function() {
				runOptions.slow = demoDiffPager.currentPageData.slow;
				runOptions.prog = demoDiffPager.currentPageData.prog;
				startDot();
				
			});
			
			break;
		case 'cmd-about':
			window.open('./about/');
			break;
		}
	}
	
	function startDot() {
		var btn = appScreen.goButton;
		if (!btn.enabled) { return; }
		
		btn.setEnabled(false);
		setWorkerSTDIN( document.getElementById('dot-src').value );
		setupGVContext(runOptions);
	}

	function afterErrorCheck(param) {
		errorSink.load(param);
	}

	function nextReady() {
		appScreen.goButton.setEnabled(true);

		if (demoDiffPager) {
			if (!demoDiffPager.next()) {
				demoDiffPager = null;
				appScreen.codingTextBox.style.fontSize = '';
			}
		}
	}
	
	function afterSetupGVContext(param) {
		progressView.clearAll();
		appScreen.errorIndicator.update();
		if (errorSink.countFatal() < 1) {
			stopGo.run();
		} else {
			nextReady();
		}
	}
	
	
	function afterRunDotLayout(param) {
		var extractor = new JSViz.GraphExtractor();
		var graphInfo;
		if (param[0].type == "G") {
			graphInfo = param.shift();
		}
		
		extractor.extractFromJSON(param);
		graphsCtrl.setDisplayGraphSize(extractor.g, graphInfo.displayWidth, graphInfo.displayHeight);
		startAnimationFunc = function() {
			graphsCtrl.setNewGraph(extractor.g, runOptions.slow, function(){
				nextReady();
			});
		};
		
		if (!runOptions.prog) {
			startAnimationFunc();
		}
	}

	function setupUI() {
		errorSink = new JSViz.ErrorSink();
		appScreen = new JSViz.AppScreen({
			codingAreaContainer: "coding-area",
			codingTextBox:       "dot-src",
			menuBox:             "dot-options"
		});
		
		appScreen.setupErrorIndicator(errorSink);
	}

	function recvProgress(j) {
		var pg = JSViz.ProgressModel.fromJSON(j);
		if (pg.state == PROGRESS_LAYOUT_FINISH) {
			progressView.hideWithAnimation();
			startAnimationFunc();
		} else {
			progressView.setNext(pg);
			progressView.startAnimation();
		}
	}
	
	function setupMessageHandler(wk) {
		wk.addEventListener("message", function(event){
			var etype  = event.data.type;
			var arg0   = event.data.arg0 || null;
			
			switch(etype) {
			case "afterInit":
				afterInit(); break;
				
			case "afterSetupGVContext":
				afterSetupGVContext(JSON.parse(arg0)); break;
			case "afterRunDotLayout":
				afterRunDotLayout(JSON.parse(arg0)); break;
			case "afterErrorCheck":
				afterErrorCheck(JSON.parse(arg0)); break;
			case "sendProgress":
				recvProgress(JSON.parse(arg0)); break;
			case "log":
				console.log(arg0); break;
			}
		});
	}
})();
