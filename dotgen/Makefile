CC = clang
EM = emcc
EMFLAGS = -s EXPORTED_FUNCTIONS="[\"_finalizeGVContext\",\"_prepareGVContext\",\"_getFirstNode\",\"_getNextNode\",\"_getCurentGraph\",\"_beginGVJob\",\"_testCountNodes\",\"_countEdges\",\"_extractGraph\",\"_runDotLayout\",\"_getNodeName\",\"_getGraphWidth\",\"_getGraphHeight\",\"_getEdgeColor\",\"_extractRanks\",\"_extractEdgesEarly\",\"_getEdgeLabel\"]"
CFLAGS = -I. -I.. -I../common -I../gvc -I../pathplan -I../cdt -I../graph \
	   -DHAVE_CONFIG_H
LIBS = liviz-apis/liviz-apis.bc \
	 ../common/libcommon-em.bc \
	 ../gvc/libgvc-em.bc \
	 ../graph/libgraph-em.bc \
	 ../cdt/libcdt-em.bc \
	 ../pathplan/libpathplan-em.bc 

DOTOBJS = acyclic.c aspect.c class1.c class2.c \
	   cluster.c compound.c conc.c decomp.c \
	   dotinit.c dotsplines.c fastgr.c flat.c \
	   mincross.c position.c rank.c sameport.c


testrun-2.js: testrun-2.bc dotgen.bc liviz-apis/liviz-apis.bc
	$(EM) -o testrun-2.js testrun-2.bc dotgen.bc $(LIBS) $(EMFLAGS)
	cp testrun-2.js ../liviz/js/em-dotgen.js

testrun-2.bc:
	$(EM) -o testrun-2.bc $(CFLAGS) -c testrun-dot-2.c

liviz-apis/liviz-apis.bc:
	cd liviz-apis; make

testrun-1: testrun-1.bc dotgen.bc
	llvm-ld -native -o testrun-1 testrun-1.bc dotgen.bc $(LIBS)


testrun-1.bc:
	$(EM) -o testrun-1.bc $(CFLAGS) -c testrun-dot-1.c


dotgen.bc:
	$(EM) -o dotgen.bc $(CFLAGS) $(DOTOBJS)

.PHONY: clean
clean:
	cd liviz-apis; make clean
	rm -f testrun
	rm -f testrun-2.js
	rm -f *.bc
