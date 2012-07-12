var PROGRESS_UNKNOWN        = 0;
var PROGRESS_AFTER_RANK     = 1;
var PROGRESS_BEFORE_MX      = 2;
var PROGRESS_WHILE_MX       = 3;
var PROGRESS_AFTER_MX       = 4;
var PROGRESS_AFTER_POSITION = 6;
var PROGRESS_LAYOUT_FINISH  = 9

function allocCString(m, str) {
	var len = str.length;
	var a = new Array(len);
	for (var i = 0;i < len;i++) { // >
		a[i] = str.charCodeAt(i);
	}

	return m.allocate(a, "i8", m.allocate.ALLOC_STATIC) &4294967295;
}

function emCharArray(m, len) {
	return m.allocate(len, "i8", m.allocate.ALLOC_STATIC) &4294967295;
}

function emDoubleArray(m, len) {
	return m.allocate(len, "double", m.allocate.ALLOC_STATIC) &4294967295;
}

function emExtractArray(m, ptr, len, val_type) {
	var a = [];
	var stride = 1;
	switch(val_type){
	case 'i8':  stride = 1; break;
	case 'double':  stride = 8; break;
	}
	for (var i = 0;i < len;i++) // >
		{ a.push(m.getValue(ptr+(i*stride), val_type)); }

	return a;
}
