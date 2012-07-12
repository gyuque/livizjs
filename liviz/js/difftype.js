if (!window.difftype) { window.difftype={}; }

(function(pkg) {
	function DiffPager(baseDir, outArea, handler) {
		this.outArea = outArea;
		this.currentIndex = 0;
		this.diffType = null;
		this.baseDir = baseDir;
		this.indexData = null;
		this.oldText = "";
		this.handler = handler;
		this.currentPageData = null;
		
		this.loadIndex(baseDir);
	}
	
	DiffPager.prototype = {
		loadIndex: function(baseDir) {
			var _this = this;
			$.ajax({
				url: baseDir + '/index.json',
				dataType: 'json',
				success: function(d) {
					_this.indexData = d;
					_this.next();
				},
				
				error: function(e,f) {
					console.log(f)
				}
			});
		},
	
		next: function() {
			var _this = this;
			var len = this.indexData.length;
			if (this.currentIndex < len) {
				var dat = this.indexData[this.currentIndex++];
				this.currentPageData = dat;
				var delay = dat.delay || 0;
				setTimeout(function() {
					$.ajax({
						url: _this.baseDir +'/'+ dat.url,
						dataType: 'text',
						success: function(d) {
							_this.startTyping(d);
						}
					});
				}, delay);
				
				return true;
			}
			
			return false;
		},
		
		startTyping: function(newText) {
			this.diffType = new DiffType(this.oldText, newText, this.outArea);
			this.oldText = newText;
			this.diffType.listener = this;
			this.diffType.tick();
		},
	
		onDiffTypeFinished: function() {
			this.handler();
		}
	};


	function DiffType(s1, s2, outArea) {
		this.listener = null;
		this.diff = makeDiffData(s1, s2);
		this.dCount = 0;
		this.initData();
		this.changed = false;
		this.outArea = outArea;
//		console.log(this.diff); throw 3;
		
		var _this = this;
		this.tickClosure = function(){ _this.tick(); };
	}
	
	DiffType.prototype = {
		initData: function() {
			var i, d;
			var delay = 0;
			var istart = 0;
			for (i in this.diff) {
				d = this.diff[i];
				if (d.hasOwnProperty('ins')) {
					d.current = [];
				} else if (d.hasOwnProperty('del')) {
					d.current = d.del.split('');
					d.delay = delay++;
					istart = delay + d.del.length;
				}
			}

			delay = istart;
			for (i in this.diff) {
				d = this.diff[i];
				if (d.hasOwnProperty('ins')) {
					d.delay = delay++;
				}
			}
			
			this.dCount = delay;;
		},
	
		tick: function() {
			var loop = (this.dCount > 120) ? 3 : (this.dCount > 50) ? 2 : 1;
			for (var j = 0;j < loop;j++) {
				this.changed = false;
				var words = [];
				var i;
				for (i = 0;i < this.diff.length;i++) {
					words.push(this.makeWord(i));
				}
				
				var currentStr = words.join('');
				
				var sz = Math.floor(23 - currentStr.length/30);
				if(sz<8) {sz=8;}
				this.outArea.style.fontSize = sz+"px";

				this.outArea.value = currentStr;
				if (!this.changed) {break;}
			}
			
			if (this.changed) {
				setTimeout(this.tickClosure, 20);
			} else {
				this.listener.onDiffTypeFinished();
			}
		},
		
		makeWord: function(wordIndex) {
			var d = this.diff[wordIndex];
			var toStr;
			
			if (d.hasOwnProperty('ins')) {
				if (d.delay) {
					--d.delay;
					this.changed = true;
					return "";
				}

				toStr = d.ins;
				if (d.current.length < toStr.length) {
					d.current.push(toStr.charAt(d.current.length));
					this.changed = true;
					return d.current.join('');
				} else {
					return toStr;
				}
			} else if (d.hasOwnProperty('del')) {
				if (d.delay) {
					--d.delay;
					this.changed = true;
					return d.del;
				}

				if (d.current.length > 0) {
					if (d.current.length > 1 && d.current[d.current.length-1] == "\n") {
						d.current.pop();
						d.current.pop();
						d.current.push("\n");
					}
					else d.current.pop();
					
					this.changed = true;
					return d.current.join('');
				} else {
					return "";
				}
			} else {
				return d.con;
			}
			
			return "";
		}
	};
	
	pkg.DiffPager = DiffPager;
	pkg.DiffType = DiffType;
	
	
	
	
	
	

/*
 * Javascript Diff Algorithm
 *  By John Resig (http://ejohn.org/)
 *  Modified by Chu Alan "sprite"
 *
 * Released under the MIT license.
 *
 * More Info:
 *  http://ejohn.org/projects/javascript-diff-algorithm/
 */


function diff( o, n ) {
  var ns = new Object();
  var os = new Object();
  
  for ( var i = 0; i < n.length; i++ ) {
    if ( ns[ n[i] ] == null )
      ns[ n[i] ] = { rows: new Array(), o: null };
    ns[ n[i] ].rows.push( i );
  }
  
  for ( var i = 0; i < o.length; i++ ) {
    if ( os[ o[i] ] == null )
      os[ o[i] ] = { rows: new Array(), n: null };
    os[ o[i] ].rows.push( i );
  }
  
  for ( var i in ns ) {
    if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
    }
  }
  
  for ( var i = 0; i < n.length - 1; i++ ) {
    if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null && 
         n[i+1] == o[ n[i].row + 1 ] ) {
      n[i+1] = { text: n[i+1], row: n[i].row + 1 };
      o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
    }
  }
  
  for ( var i = n.length - 1; i > 0; i-- ) {
    if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null && 
         n[i-1] == o[ n[i].row - 1 ] ) {
      n[i-1] = { text: n[i-1], row: n[i].row - 1 };
      o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
    }
  }
  
  return { o: o, n: n };
}

function makeDiffData(o, n ) {
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');
  
  var DELIM  = /\s/ ;
  var DELIMg = /\s/g ;
  
  var list = [];
  var out = diff(o == "" ? [] : o.split(DELIM), n == "" ? [] : n.split(DELIM) );
  
  var oSpace = o.match(DELIMg);
  if (oSpace == null) {
    oSpace = [""];
  } else {
    oSpace.push("");
  }
  var nSpace = n.match(DELIMg);
  if (nSpace == null) {
    nSpace = [""];
  } else {
    nSpace.push("");
  }
  
  if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {
        list.push({del: out.o[i] + oSpace[i]});
      }
  } else {
    if (out.n[0].text == null) {
      for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
        list.push({del: out.o[n] + oSpace[n]});
      }
    }

    for ( var i = 0; i < out.n.length; i++ ) {
      if (out.n[i].text == null) {
        list.push({ins: out.n[i] + nSpace[i]});
      } else {
        list.push({con: out.n[i].text + nSpace[i]});

        for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {
         list.push({del: out.o[n] + oSpace[n]});
        }
      }
    }
  }
  
  return list;
}

})(difftype);

