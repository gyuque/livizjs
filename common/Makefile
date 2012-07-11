EM = emcc
CFLAGS = -I. -I.. -I../gvc -I../pathplan -I../cdt -I../graph \
	  -DHAVE_CONFIG_H
OBJS = arrows.c emit.c utils.c labels.c memory.c fontmetrics.c geom.c globals.c \
	 htmllex.c htmlparse.c htmltable.c ns.c postproc.c routespl.c shapes.c splines.c \
	 colxlate.c psusershape.c input.c xdot.c timing.c


libcommon-em.bc:
	$(EM) -o libcommon-em.bc $(CFLAGS) $(OBJS)
	
.PHONY: clean
clean:
	rm -f *.bc
