all:
	cd cdt; make
	cd common; make
	cd gvc; make
	cd pathplan; make
	cd graph; make
	cd dotgen; make

clean:
	cd cdt; make clean
	cd common; make clean
	cd gvc; make clean
	cd pathplan; make clean
	cd graph; make clean
	cd dotgen; make clean
