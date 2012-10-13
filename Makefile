# Nathan Ramella (nar@hush.com) 

CC = clang
EMCC = emcc
DEFINES = -DHAVE_CONFIG_H
INCLUDE = -I. -Icdt -Icommon -Idotgen -Igraph -Igvc -Ipathplan 
OPTIMIZATION_LEVEL = -O3

# Setting c99 might not be critically important, but c89 didn't play
# well for lack of inline.A

CFLAGS = -std=c99 

ifeq "$(shell uname -s)" "Darwin"
EXTRA_CFLAGS = -arch i686
EXTRA_DEFINES = -DHAVE_STRINGS_H
endif

SUBDIRS = cdt common gvc pathplan graph dotgen dotgen/liviz-api

COMPILER_CMD=$(EMCC) $(DEFINES) $(EXTRA_DEFINES) $(INCLUDE) $(EXTRA_INCLUDE) $(CFLAGS) $(EXTRA_CFLAGS)

# Dynamically generate a timestamp to tag the
# build with.

BUILD_TIMESTAMP = $(shell date +%s)

CDT_SRC = $(addprefix cdt/, \
	dtclose.c dtdisc.c dtextract.c dtview.c	\
	dthash.c  dtlist.c dtflatten.c dtrestore.c \
	dtopen.c  dtsize.c dtstrhash.c dttreeset.c \
	dttree.c  dtwalk.c dtmethod.c)

COMMON_SRC = $(addprefix common/, \
	ns.c xdot.c emit.c geom.c input.c utils.c \
	arrows.c timing.c labels.c memory.c \
	shapes.c splines.c globals.c htmllex.c \
	postproc.c htmlparse.c htmltable.c \
	routespl.c colxlate.c psusershape.c \
	fontmetrics.c)

GVC_SRC = $(addprefix gvc/,	\
	gvc.c gvconfig.c gvcontext.c gvdevice.c	\
	gvlayout.c gvevent.c gvjobs.c gvplugin.c \
	gvrender.c gvusershape.c gvloadimage.c \
	gvtextlayout.c)
						
PATHPLAN_SRC = $(addprefix pathplan/, \
	cvt.c inpoly.c route.c shortest.c \
	solvers.c triang.c util.c \
	visibility.c)

GRAPH_SRC = $(addprefix graph/, \
	agxbuf.c attribs.c edge.c graph.c \
	graphio.c lexer.c node.c parser.c \
	refstr.c trie.c)

DOTGEN_SRC = $(addprefix dotgen/, \
	acyclic.c aspect.c class1.c class2.c \
	cluster.c compound.c conc.c decomp.c \
	dotinit.c dotsplines.c fastgr.c	\
	flat.c mincross.c position.c rank.c \
	sameport.c)

# This is a little trick to make the maintenance of exported 
# functions a little easier. Add them to the EXPORTED_FUNCTION_LIST
# below and at build time through the magic of awk and some make
# voodoo, they'll be assembled into a Python parsable array that
# can be passed to emscripten.


EXPORTED_FUNCTION_LIST = \
 	_finalizeGVContext \
	_prepareGVContext \
	_getFirstNode \
	_getNextNode \
	_getCurentGraph \
	_beginGVJob \
	_testCountNodes \
	_countEdges \
	_extractGraph \
	_runDotLayout \
	_getNodeName \
	_getGraphWidth \
	_getGraphHeight \
	_getEdgeColor \
	_extractRanks \
	_extractEdgesEarly \
	_getEdgeLabel

EXPORTED_FUNCTIONS = $(addprefix -s EXPORTED_FUNCTIONS=[, \
			$(addsuffix ], \
				$(shell echo $(EXPORTED_FUNCTION_LIST) \
					| awk '{for (i=1;i<NF;++i) printf("\\\"%s\\\",",$$i); printf("\\\"%s\\\"\n",$$NF) }') \
				) \
			)

LIBS = $(addprefix build/, \
			libcdt-em.bc \
			libcommon-em.bc	\
			libgvc-em.bc \
			libpathplan-em.bc \
			libgraph-em.bc \
			dotgen-em.bc)

default: all
	
all: build build_config_summary em-dotgen.js
	mv em-dotgen.js liviz/
	@ls -l liviz/em-dotgen.js
	@echo "-------------------------------------------------------"
	@echo "Done!"

.PHONY:
build_config_summary:
	@echo "-------------------------------------------------------"
	@echo
	@echo " DEFINES = $(DEFINES) $(EXTRA_DEFINES)" | pr -l1 -t -3 
	@echo " INCLUDE = $(INCLUDE) $(EXTRA_INCLUDE)" | pr -l1 -t -3 
	@echo " EMFLAGS = $(EMFLAGS)" | pr -l1 -t -3 
	@echo 
	@echo "     OPT = $(OPTIMIZATION_LEVEL)"
	@echo "   DEBUG = $(DEBUG)"
	@echo
	@echo "-------------------------------------------------------"

build:
	@mkdir -p build
		
em-dotgen.js: build/testrun-dot-2.bc 
	$(EMCC) $(OPTIMIZATION_LEVEL) $(EMFLAGS) $^ $(LIBS) build/liviz-apis.bc -o $@

build/testrun-dot-2.bc: build/liviz-apis.bc
	$(COMPILER_CMD) -o $@ -c dotgen/testrun-dot-2.c

build/liviz-apis.bc: build $(LIBS) 
	$(COMPILER_CMD) -o $@ dotgen/liviz-apis/liviz-apis.c

build/libcdt-em.bc: $(CDT_SRC)
	$(COMPILER_CMD) -o $@ $^ 

build/libcommon-em.bc: $(COMMON_SRC)
	$(COMPILER_CMD) -o $@ $^ 

build/libgvc-em.bc: $(GVC_SRC)
	$(COMPILER_CMD) -DBUILDDATE="\"$(BUILD_TIMESTAMP)\"" -o $@ $^

build/libpathplan-em.bc: $(PATHPLAN_SRC)
	$(COMPILER_CMD) -o $@ $^
	
build/libgraph-em.bc: $(GRAPH_SRC)
	$(COMPILER_CMD) -o $@ $^

build/dotgen-em.bc: $(DOTGEN_SRC)
	$(COMPILER_CMD) -o $@ $^
	
.PHONY:
clean:
	rm -f ./build/* ./*.bc *.bc em-dotgen.js liviz/em-dotgen.js liviz-*.zip

.PHONY: 
zip:
	zip -r liviz-$(BUILD_TIMESTAMP).zip liviz

.PHONY:
install:
	echo "This is where I put my install step.."	
