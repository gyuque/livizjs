if (!window['JSViz']){window['JSViz']={};}

(function(pkg) {
	"use strict";
	var $H = pkg.createHTMLElement;

	function AppScreen(ids) {
		this.elementIDs = ids;
		
		this.codingAreaContainer = document.getElementById( ids.codingAreaContainer );
		this.codingTextBox = document.getElementById( ids.codingTextBox );
		this.goButton = new PlayButton(this.codingAreaContainer, 
		                                document.getElementById( ids.menuBox ));
		this.errorIndicator = null;
	}
	
	AppScreen.prototype = {
		setupErrorIndicator: function(errsink) {
			this.errorIndicator = new ErrorIndicator(errsink);
			this.codingAreaContainer.appendChild(this.errorIndicator.element);
		},
		
		watchResize: function(graphController, fitToBox, fitTextBox) {
			var w = $(window);
			var j = $(fitToBox);
			var tx = this.codingTextBox;
			
			var closure = function() {
				graphController.renderer.setViewportWidth(j.width()-19);
				if (fitTextBox) {
					tx.style.height = Math.floor(w.height()-118)+'px';
				}
			};
			
			w.resize(closure);
			closure();
		}
	};


	function ErrorIndicator(sink) {
		this.errorSink = sink;
		this.element = $H('div');
		var label =  $H('div');
		label.className = "jv-error-messages-box";
		
		var s = this.element.style;
		s.minHeight = "22px";
		s.minWidth = "48px";
		s.backgroundImage = "url('" +ErrorIndicator.SignalImage.url+ "')";
		s.backgroundRepeat = "no-repeat";
		s.paddingLeft = "40px";
		this.setSignal(0);
		
		this.element.appendChild(label);
		this.jLabel = $(label);
	}

	ErrorIndicator.SignalImage = {
		url: "images/signals.png",
		height: 22
	};

	ErrorIndicator.prototype = {
		update: function() {
			this.jLabel.empty();
			var count = this.errorSink.countFatal();
			this.setSignal(count ? 1 : 0);
			if (count) {
				for (var i = 0;i < count;i++) {
					var lineno = this.errorSink.lineNumAt(i);
					var msg = this.errorSink.messageAt(i);
					if (lineno) {
						this.addErrorMessage(msg +" at "+lineno);
					} else {
						this.addErrorMessage(msg);
					}
				}
			}
		},
		
		addErrorMessage: function(msg) {
			var ln = document.createElement('p');
			ln.appendChild(document.createTextNode(msg));
			this.jLabel[0].appendChild(ln);
		},
		
		setSignal: function(warn) {
			this.element.style.backgroundPosition = "0 " + (-warn*44)+"px";
		}
	};

	var DMY_IMG = "data:image/gif;base64,R0lGODlhCAACALMAAM7OMf"+
	 "///////////////////////////////////////////////////////////yH5BAEAAAAALAAAAAAIAAIAQAQEEMgpIwA7";
	var PLAYBUTTON_URL = "images/gobutton.png";
	var MOREBUTTON_URL = "images/morebtn.gif";
	function PlayButton(containerElement, menuElement) {
		var img = $H('img');
		img.src = DMY_IMG;
		img.setAttribute('class', 'jsv-play-button');
		this.element = img;
		img.title = "Start";
		this.j = $(img);
		this.containerElement = containerElement;
		this.enabled = true;

		var more_img = $H('img');
		more_img.src = MOREBUTTON_URL;
		more_img.setAttribute('class', 'jsv-more-button');
		
		// menu triggers
		var _this = this;
		$(menuElement).click(function(e){
			if (e.target && e.target.id) {
				if (_this.enabled) {
					_this.onOptionalCommand(e.target.id);
				}
			}
		});

		$('html').click(function(e){
			menuElement.style.display = "";
			e.stopPropagation();
		});

		$(more_img).click(function(e){
			if (menuElement.style.display != "block") {
				menuElement.style.display = "block";
				e.stopPropagation();
			}
		});
		
		containerElement.appendChild(more_img);
		containerElement.appendChild(img);
	}

	PlayButton.prototype = {
		eventDispatcher: function() {
			return this.j;
		},
		
		setEnabled: function(b) {
			this.enabled = b;
			b ? this.j.removeClass('disabled') : this.j.addClass('disabled');
		}
	};

	pkg.ErrorIndicator = ErrorIndicator;
	pkg.PlayButton     = PlayButton;
	pkg.AppScreen      = AppScreen;
})(JSViz);